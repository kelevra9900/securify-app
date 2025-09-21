package com.trablisarn

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Looper
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.google.android.gms.location.*
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.tasks.Task
import kotlin.math.max

class GeolocationModule(private val rc: ReactApplicationContext) :
  ReactContextBaseJavaModule(rc) {

  private val fused by lazy { LocationServices.getFusedLocationProviderClient(rc) }

  override fun getName() = "GeolocationModule"

  @ReactMethod
  fun requestPermissions() {
    // Sugerencia: maneja la solicitud real en JS con PermissionsAndroid.
    // Aquí no hacemos runtime request para evitar depender de una Activity.
    // Puedes abrir settings si quieres, pero mantengo este método no-op.
  }

  @ReactMethod
  fun getCurrentPosition(options: ReadableMap?, promise: Promise) {
    val hasFine = ActivityCompat.checkSelfPermission(rc, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    val hasCoarse = ActivityCompat.checkSelfPermission(rc, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    if (!hasFine && !hasCoarse) {
      promise.reject("E_PERMISSION", "Location permission not granted")
      return
    }

    val timeoutMs = (options?.getDouble("timeoutMs")?.toLong() ?: 10_000L).coerceAtLeast(1_000L)
    val enableHighAccuracy = options?.getBoolean("enableHighAccuracy") ?: true

    val priority = if (enableHighAccuracy) {
      Priority.PRIORITY_HIGH_ACCURACY
    } else {
      Priority.PRIORITY_BALANCED_POWER_ACCURACY
    }

    val cts = CancellationTokenSource()

    // 1) Intento principal: getCurrentLocation (rápido y preciso)
    val task: Task<android.location.Location> =
      fused.getCurrentLocation(priority, cts.token)

    // 2) Timeout manual
    val handler = android.os.Handler(Looper.getMainLooper())
    val timeout = Runnable {
      cts.cancel()
      // Fallback a getLastLocation por si había cache
      fused.lastLocation
        .addOnSuccessListener { last ->
          if (last != null) {
            promise.resolve(last.toWritableMap())
          } else {
            promise.reject("E_TIMEOUT", "Location request timed out")
          }
        }
        .addOnFailureListener { e ->
          promise.reject("E_TIMEOUT", e.localizedMessage)
        }
    }
    handler.postDelayed(timeout, timeoutMs)

    // 3) Resultado
    task
      .addOnSuccessListener { loc ->
        handler.removeCallbacks(timeout)
        if (loc != null) {
          promise.resolve(loc.toWritableMap())
        } else {
          // fallback lastLocation
          fused.lastLocation
            .addOnSuccessListener { last ->
              if (last != null) {
                promise.resolve(last.toWritableMap())
              } else {
                promise.reject("E_LOCATION", "Failed to get location")
              }
            }
            .addOnFailureListener { e -> promise.reject("E_LOCATION", e.localizedMessage) }
        }
      }
      .addOnFailureListener { e ->
        handler.removeCallbacks(timeout)
        promise.reject("E_LOCATION", e.localizedMessage)
      }
  }

  private fun android.location.Location.toWritableMap(): WritableMap {
    val m = Arguments.createMap()
    m.putDouble("latitude", latitude)
    m.putDouble("longitude", longitude)
    m.putDouble("accuracy", accuracy.toDouble())
    m.putDouble("altitude", altitude)
    m.putDouble("speed", speed.toDouble())
    m.putDouble("bearing", bearing.toDouble())
    // Ensure non-negative and convert to Double for JS bridge
    m.putDouble("timestamp", max(0L, time).toDouble())
    return m
  }
}
