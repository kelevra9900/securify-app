// TrackingModule.kt
package com.trablisarn

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*

class TrackingModule(private val rc: ReactApplicationContext) :
  ReactContextBaseJavaModule(rc) {

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
    val sp = rc.getSharedPreferences("auth", 0).edit()
    sp.putString("token", token)
    socketUrl?.let { sp.putString("socketUrl", it) }
    event?.let { sp.putString("socketEvent", it) }
    namespace?.let { sp.putString("socketNamespace", it) }
    sp.apply()
  }

  @ReactMethod
  fun start(options: ReadableMap?) {
    val i = Intent(rc, TrackingService::class.java).apply {
      action = TrackingService.ACTION_START
      putExtra(TrackingService.EXTRA_INTERVAL_MS, options?.getDouble("intervalMs")?.toLong() ?: 10_000L)
      putExtra(TrackingService.EXTRA_FASTEST_MS, options?.getDouble("fastestMs")?.toLong() ?: 5_000L)
      putExtra(TrackingService.EXTRA_MIN_DISTANCE, options?.getDouble("minDistanceMeters")?.toFloat() ?: 5f)
      putExtra(TrackingService.EXTRA_THROTTLE_MS, options?.getDouble("throttleMs")?.toLong() ?: 1500L)

      options?.getString("socketUrl")?.let { putExtra(TrackingService.EXTRA_SOCKET_URL, it) }
      options?.getString("token")?.let { putExtra(TrackingService.EXTRA_TOKEN, it) }
      options?.getString("event")?.let { putExtra(TrackingService.EXTRA_EVENT, it) }
      options?.getString("namespace")?.let { putExtra(TrackingService.EXTRA_NAMESPACE, it) }
    }
    startServiceCompat(i)
  }

  @ReactMethod
  fun update(options: ReadableMap) {
    val i = Intent(rc, TrackingService::class.java).apply {
      action = TrackingService.ACTION_UPDATE
      if (options.hasKey("intervalMs")) putExtra(TrackingService.EXTRA_INTERVAL_MS, options.getDouble("intervalMs").toLong())
      if (options.hasKey("fastestMs")) putExtra(TrackingService.EXTRA_FASTEST_MS, options.getDouble("fastestMs").toLong())
      if (options.hasKey("minDistanceMeters")) putExtra(TrackingService.EXTRA_MIN_DISTANCE, options.getDouble("minDistanceMeters").toFloat())
      if (options.hasKey("throttleMs")) putExtra(TrackingService.EXTRA_THROTTLE_MS, options.getDouble("throttleMs").toLong())
      if (options.hasKey("socketUrl")) putExtra(TrackingService.EXTRA_SOCKET_URL, options.getString("socketUrl"))
      if (options.hasKey("token")) putExtra(TrackingService.EXTRA_TOKEN, options.getString("token"))
      if (options.hasKey("event")) putExtra(TrackingService.EXTRA_EVENT, options.getString("event"))
      if (options.hasKey("namespace")) putExtra(TrackingService.EXTRA_NAMESPACE, options.getString("namespace"))
    }
    startServiceCompat(i)
  }

  @ReactMethod
  fun stop() {
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
