package com.trablisarn

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
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

  // ---------- API existente ----------
  @ReactMethod
  fun start(options: ReadableMap?) {
    val i = Intent(rc, TrackingService::class.java).apply {
      action = TrackingService.ACTION_START
      putExtra(TrackingService.EXTRA_INTERVAL_MS, options?.getDouble("intervalMs")?.toLong() ?: 10_000L)
      putExtra(TrackingService.EXTRA_FASTEST_MS, options?.getDouble("fastestMs")?.toLong() ?: 5_000L)
      putExtra(TrackingService.EXTRA_MIN_DISTANCE, options?.getDouble("minDistanceMeters")?.toFloat() ?: 5f)
      options?.getString("socketUrl")?.let { putExtra(TrackingService.EXTRA_SOCKET_URL, it) }
      options?.getString("token")?.let { putExtra(TrackingService.EXTRA_TOKEN, it) }
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
      if (options.hasKey("socketUrl")) putExtra(TrackingService.EXTRA_SOCKET_URL, options.getString("socketUrl"))
      if (options.hasKey("token")) putExtra(TrackingService.EXTRA_TOKEN, options.getString("token"))
    }
    rc.startService(i)
  }

  @ReactMethod
  fun stop() {
    val i = Intent(rc, TrackingService::class.java).apply {
      action = TrackingService.ACTION_STOP
    }
    rc.startService(i)
  }

  @ReactMethod
  fun saveAuth(token: String, socketUrl: String?) {
    val sp = rc.getSharedPreferences("auth", 0)
    sp.edit().putString("token", token).apply()
    socketUrl?.let { sp.edit().putString("socketUrl", it).apply() }
  }

  // ---------- NUEVO: Battery optimizations ----------
  /** Abre la pantalla del sistema para gestionar optimizaciones de batería (lista blanca de Doze). */
  @ReactMethod
  fun openBatteryOptimizationSettings() {
    val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    rc.startActivity(intent)
  }

  /** Solicita al usuario excluir la app de Doze (whitelist) con el diálogo del sistema. */
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

  /** Devuelve si la app ya está excluida de optimizaciones de batería. */
  @ReactMethod
  fun isIgnoringBatteryOptimizations(promise: Promise) {
    val pm = rc.getSystemService(PowerManager::class.java)
    val ignoring = pm?.isIgnoringBatteryOptimizations(rc.packageName) ?: false
    promise.resolve(ignoring)
  }
}
