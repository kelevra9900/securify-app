// TrackingModule.kt
package com.securify.app

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*

class TrackingModule(private val rc: ReactApplicationContext) :
  ReactContextBaseJavaModule(rc) {

  companion object {
    private const val TAG = "TrackingModule"
  }

  override fun getName() = "TrackingModule"

  // ---------- Helpers ----------
  private fun startServiceCompat(intent: Intent) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      rc.startForegroundService(intent)
    } else {
      rc.startService(intent)
    }
  }

  // ---------- API ----------
  @ReactMethod
  fun saveAuth(token: String, socketUrl: String?, event: String?, namespace: String?) {
    Log.d(TAG, "saveAuth(token=${token.take(6)}…, url=$socketUrl, event=$event, namespace=$namespace)")
    val sp = rc.getSharedPreferences("auth", 0).edit()
    sp.putString("token", token)
    socketUrl?.let { sp.putString("socketUrl", it) }
    event?.let { sp.putString("socketEvent", it) }
    namespace?.let { sp.putString("socketNamespace", it) }
    sp.apply()
  }

  @ReactMethod
  fun start(options: ReadableMap?) {
    Log.i(TAG, "start() called with options=${options?.toHashMap()}")
    val i = Intent(rc, TrackingService::class.java).apply {
      action = TrackingService.ACTION_START

      val interval = if (options?.hasKey("intervalMs") == true) {
        options.getDouble("intervalMs").toLong()
      } else 10_000L
      val fastest = if (options?.hasKey("fastestMs") == true) {
        options.getDouble("fastestMs").toLong()
      } else 5_000L
      val minDistance = if (options?.hasKey("minDistanceMeters") == true) {
        options.getDouble("minDistanceMeters").toFloat()
      } else 5f
      val throttle = if (options?.hasKey("throttleMs") == true) {
        options.getDouble("throttleMs").toLong()
      } else 1500L

      putExtra(TrackingService.EXTRA_INTERVAL_MS, interval)
      putExtra(TrackingService.EXTRA_FASTEST_MS, fastest)
      putExtra(TrackingService.EXTRA_MIN_DISTANCE, minDistance)
      putExtra(TrackingService.EXTRA_THROTTLE_MS, throttle)

      if (options?.hasKey("socketUrl") == true) {
        options.getString("socketUrl")?.let { putExtra(TrackingService.EXTRA_SOCKET_URL, it) }
      }
      if (options?.hasKey("token") == true) {
        options.getString("token")?.let { putExtra(TrackingService.EXTRA_TOKEN, it) }
      }
      if (options?.hasKey("event") == true) {
        options.getString("event")?.let { putExtra(TrackingService.EXTRA_EVENT, it) }
      }
      if (options?.hasKey("realtimeEvent") == true) {
        options.getString("realtimeEvent")?.let { putExtra(TrackingService.EXTRA_REALTIME_EVENT, it) }
      }
      if (options?.hasKey("realtimeMinDistanceMeters") == true) {
        putExtra(
          TrackingService.EXTRA_REALTIME_MIN_DISTANCE,
          options.getDouble("realtimeMinDistanceMeters").toFloat()
        )
      }
      if (options?.hasKey("namespace") == true) {
        options.getString("namespace")?.let { putExtra(TrackingService.EXTRA_NAMESPACE, it) }
      }
    }
    startServiceCompat(i)
  }

  @ReactMethod
  fun update(options: ReadableMap) {
    Log.i(TAG, "update() called with options=${options.toHashMap()}")
    val i = Intent(rc, TrackingService::class.java).apply {
      action = TrackingService.ACTION_UPDATE
      if (options.hasKey("intervalMs")) putExtra(TrackingService.EXTRA_INTERVAL_MS, options.getDouble("intervalMs").toLong())
      if (options.hasKey("fastestMs")) putExtra(TrackingService.EXTRA_FASTEST_MS, options.getDouble("fastestMs").toLong())
      if (options.hasKey("minDistanceMeters")) putExtra(TrackingService.EXTRA_MIN_DISTANCE, options.getDouble("minDistanceMeters").toFloat())
      if (options.hasKey("throttleMs")) putExtra(TrackingService.EXTRA_THROTTLE_MS, options.getDouble("throttleMs").toLong())
      if (options.hasKey("socketUrl")) putExtra(TrackingService.EXTRA_SOCKET_URL, options.getString("socketUrl"))
      if (options.hasKey("token")) putExtra(TrackingService.EXTRA_TOKEN, options.getString("token"))
      if (options.hasKey("event")) putExtra(TrackingService.EXTRA_EVENT, options.getString("event"))
      if (options.hasKey("realtimeEvent")) putExtra(TrackingService.EXTRA_REALTIME_EVENT, options.getString("realtimeEvent"))
      if (options.hasKey("realtimeMinDistanceMeters")) {
        putExtra(
          TrackingService.EXTRA_REALTIME_MIN_DISTANCE,
          options.getDouble("realtimeMinDistanceMeters").toFloat()
        )
      }
      if (options.hasKey("namespace")) putExtra(TrackingService.EXTRA_NAMESPACE, options.getString("namespace"))
    }
    startServiceCompat(i)
  }

  @ReactMethod
  fun stop() {
    Log.i(TAG, "stop() called")
    val i = Intent(rc, TrackingService::class.java).apply { action = TrackingService.ACTION_STOP }
    startServiceCompat(i)
  }

  // ---------- Battery utils (como ya tenías) ----------
  @ReactMethod
  fun openBatteryOptimizationSettings() {
    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    rc.startActivity(intent)
  }

  @ReactMethod
  fun requestIgnoreBatteryOptimizations() {
    val pm = rc.getSystemService(PowerManager::class.java) ?: return
    if (!pm.isIgnoringBatteryOptimizations(rc.packageName)) {
      val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
        .setData(Uri.parse("package:${rc.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      rc.startActivity(intent)
    }
  }

  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    val pm = rc.getSystemService(PowerManager::class.java)
    promise.resolve(pm?.isIgnoringBatteryOptimizations(rc.packageName) ?: false)
  }

  // ---------- Permissions ----------
  @ReactMethod
  fun checkPermissions(promise: Promise) {
    val fine = ActivityCompat.checkSelfPermission(rc, Manifest.permission.ACCESS_FINE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
    val coarse = ActivityCompat.checkSelfPermission(rc, Manifest.permission.ACCESS_COARSE_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
    val bg = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ActivityCompat.checkSelfPermission(rc, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == android.content.pm.PackageManager.PERMISSION_GRANTED
    } else true
    val obj = Arguments.createMap().apply {
      putBoolean("fine", fine)
      putBoolean("coarse", coarse)
      putBoolean("background", bg)
    }
    promise.resolve(obj)
  }

  /** Abre settings de ubicación para que el usuario otorgue BACKGROUND si hace falta. */
  @ReactMethod
  fun openLocationSettings() {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
      .setData(Uri.fromParts("package", rc.packageName, null))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    rc.startActivity(intent)
  }

  /** Nota: solicitar permisos en runtime debe hacerse desde una Activity.
   *  Desde el módulo abrimos la pantalla adecuada para que el usuario conceda. */
  @ReactMethod
  fun requestPermissions() {
    // Abre la pantalla general de ubicación (el flujo concreto lo manejas en JS con PermissionsAndroid)
    val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    rc.startActivity(intent)
  }
}
