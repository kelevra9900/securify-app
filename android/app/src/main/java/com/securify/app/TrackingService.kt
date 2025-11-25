// TrackingService.kt
package com.securify.app

import android.Manifest
import android.app.*
import android.content.*
import android.net.ConnectivityManager
import android.net.Network
import android.os.*
import android.util.Log
import androidx.annotation.RequiresPermission
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.android.gms.location.*
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.client.Manager
import org.json.JSONObject
import java.text.DateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.TimeUnit

class TrackingService : Service() {

  companion object {
    const val CHANNEL_ID = "tracking_channel"
    const val NOTIF_ID = 201

    const val ACTION_START = "com.securify.app.TRACKING_START"
    const val ACTION_STOP  = "com.securify.app.TRACKING_STOP"
    const val ACTION_UPDATE = "com.securify.app.TRACKING_UPDATE"

    const val EXTRA_INTERVAL_MS = "intervalMs"
    const val EXTRA_FASTEST_MS = "fastestMs"
    const val EXTRA_MIN_DISTANCE = "minDistanceMeters"
    const val EXTRA_THROTTLE_MS = "throttleMs"
    const val EXTRA_SOCKET_URL = "socketUrl"
    const val EXTRA_TOKEN = "authToken"
    const val EXTRA_EVENT = "socketEvent"
    const val EXTRA_REALTIME_EVENT = "socketRealtimeEvent"
    const val EXTRA_REALTIME_MIN_DISTANCE = "minRealtimeDistanceMeters"
    const val EXTRA_NAMESPACE = "socketNamespace"

    private val DEFAULT_UPDATE_INTERVAL_MS = TimeUnit.SECONDS.toMillis(10)
    private val DEFAULT_FASTEST_INTERVAL_MS = TimeUnit.SECONDS.toMillis(5)
    private const val DEFAULT_MIN_DISTANCE = 5f
    private const val DEFAULT_EVENT = "new_location"
    private const val DEFAULT_REALTIME_EVENT = "tracking:location:update"
    private const val DEFAULT_NAMESPACE = "/tracker/v2"
    private const val MAX_BUFFER = 300
    private const val TAG = "TrackingService"
  }

  private lateinit var fused: FusedLocationProviderClient
  private lateinit var locationRequest: LocationRequest

  private var socket: Socket? = null
  private var socketUrl: String = ""
  private var namespace: String = DEFAULT_NAMESPACE
  private var eventName: String = DEFAULT_EVENT
  private var realtimeEventName: String = DEFAULT_REALTIME_EVENT
  private var authToken: String = ""

  private var updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS
  private var fastestIntervalMs = DEFAULT_FASTEST_INTERVAL_MS
  private var minDistanceMeters = DEFAULT_MIN_DISTANCE
  private var throttleMs = 1500L
  private var realtimeMinDistanceMeters = 1f

  private var lastEmitTs = 0L
  private var lastRealtimeEmitTs = 0L
  private val buffer = ConcurrentLinkedQueue<JSONObject>()

  private lateinit var connectivity: ConnectivityManager
  private val notificationManager by lazy { NotificationManagerCompat.from(this) }
  private val notificationBuilder by lazy { createNotificationBuilder() }
  private val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: Network) { flushBuffer() }
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    startForeground(
      NOTIF_ID,
      notificationBuilder
        .setContentText("Iniciando rastreo...")
        .setStyle(
          NotificationCompat.BigTextStyle()
            .bigText("Esperando primera ubicación…")
            .setSummaryText("Buscando señal GPS")
        )
        .build()
    )

    connectivity = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    connectivity.registerDefaultNetworkCallback(networkCallback)

    fused = LocationServices.getFusedLocationProviderClient(this)
    // Rehidrata creds básicas por si el proceso fue matado
    val sp = getSharedPreferences("auth", Context.MODE_PRIVATE)
    socketUrl = sp.getString("socketUrl", socketUrl) ?: socketUrl
    authToken = sp.getString("token", authToken) ?: authToken
    eventName = sp.getString("socketEvent", DEFAULT_EVENT) ?: DEFAULT_EVENT
    realtimeEventName = sp.getString("socketRealtimeEvent", DEFAULT_REALTIME_EVENT) ?: DEFAULT_REALTIME_EVENT
    namespace = sp.getString("socketNamespace", DEFAULT_NAMESPACE) ?: DEFAULT_NAMESPACE
  }

  @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // CRÍTICO: Llamar a startForeground() INMEDIATAMENTE para cumplir con el requisito de Android 8+
    // que exige que se llame dentro de los primeros 5 segundos de startForegroundService()
    if (intent?.action != ACTION_STOP) {
      try {
        startForeground(
          NOTIF_ID,
          notificationBuilder
            .setContentText("Servicio de rastreo activo...")
            .build()
        )
      } catch (e: Exception) {
        Log.e(TAG, "Error calling startForeground in onStartCommand", e)
      }
    }

    when (intent?.action ?: ACTION_START) {
      ACTION_STOP -> {
        Log.i(TAG, "Received ACTION_STOP")
        stopSelfSafely()
        return START_NOT_STICKY
      }
      ACTION_UPDATE, ACTION_START -> {
        Log.i(TAG, "Received ${intent?.action ?: ACTION_START} - configuring service")
        updateIntervalMs = intent?.getLongExtra(EXTRA_INTERVAL_MS, DEFAULT_UPDATE_INTERVAL_MS) ?: DEFAULT_UPDATE_INTERVAL_MS
        fastestIntervalMs = intent?.getLongExtra(EXTRA_FASTEST_MS, DEFAULT_FASTEST_INTERVAL_MS) ?: DEFAULT_FASTEST_INTERVAL_MS
        minDistanceMeters = intent?.getFloatExtra(EXTRA_MIN_DISTANCE, DEFAULT_MIN_DISTANCE) ?: DEFAULT_MIN_DISTANCE
        throttleMs = intent?.getLongExtra(EXTRA_THROTTLE_MS, 1500L) ?: 1500L
        realtimeMinDistanceMeters = intent?.getFloatExtra(EXTRA_REALTIME_MIN_DISTANCE, realtimeMinDistanceMeters) ?: realtimeMinDistanceMeters

        intent?.getStringExtra(EXTRA_SOCKET_URL)?.let { socketUrl = it }
        intent?.getStringExtra(EXTRA_TOKEN)?.let { authToken = it }
        intent?.getStringExtra(EXTRA_EVENT)?.let { eventName = it }
        intent?.getStringExtra(EXTRA_REALTIME_EVENT)?.let { realtimeEventName = it }
        intent?.getStringExtra(EXTRA_NAMESPACE)?.let { namespace = it }

        Log.d(
          TAG,
          "Config -> interval=$updateIntervalMs fastest=$fastestIntervalMs minDist=$minDistanceMeters realtimeMinDist=$realtimeMinDistanceMeters throttle=$throttleMs event=$eventName realtimeEvent=$realtimeEventName namespace=$namespace url=$socketUrl"
        )

        // persiste por si el sistema mata el proceso
        getSharedPreferences("auth", Context.MODE_PRIVATE)
          .edit()
          .putString("socketUrl", socketUrl)
          .putString("token", authToken)
          .putString("socketEvent", eventName)
          .putString("socketRealtimeEvent", realtimeEventName)
          .putString("socketNamespace", namespace)
          .apply()

        ensureSocket()
        buildLocationRequest()
        startLocationUpdates()
      }
    }
    return START_STICKY
  }

  private fun ensureSocket() {
    if (socket != null) {
      Log.d(TAG, "ensureSocket -> existing socket connected=${socket?.connected()} url=$socketUrl")
      return
    }
    if (socketUrl.isBlank()) {
      socketUrl = getSocketUrlFromPrefs()
      Log.d(TAG, "ensureSocket -> url hydrated from prefs: $socketUrl")
    }
    Log.d(TAG, "ensureSocket -> preparing socket namespace=$namespace event=$eventName url=$socketUrl")
    if (socketUrl.isBlank()) {
      Log.e(TAG, "ensureSocket -> socketUrl is blank, skipping connect")
      return
    }
    try {
      val opts = IO.Options().apply {
        reconnection = true
        reconnectionAttempts = Int.MAX_VALUE
        reconnectionDelay = 2000
        reconnectionDelayMax = 20_000
        // Si tu server es https w/ SNI correcto, Ok. Para self-signed necesitarías custom factory.
        extraHeaders = mapOf("Authorization" to listOf("Bearer $authToken"))
      }
      // Namespace:
      val url = if (namespace.startsWith("/")) "$socketUrl$namespace" else "$socketUrl/$namespace"
      socket = IO.socket(url, opts)

      socket?.on(Socket.EVENT_CONNECT) {
        Log.i(TAG, "Socket connected -> namespace=$namespace")
        flushBuffer()
      }
      // Listen to reconnection via Manager to match client 2.x API
      socket?.io()?.on(Manager.EVENT_RECONNECT) {
        Log.i(TAG, "Socket reconnected, flushing buffer")
        flushBuffer()
      }
      socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
        Log.e(TAG, "Socket connect error -> ${args.joinToString()}")
      }
      socket?.on(Socket.EVENT_DISCONNECT) { args ->
        Log.w(TAG, "Socket disconnected: ${args.joinToString()}")
      }
      Log.d(TAG, "ensureSocket -> starting connection attempt")
      socket?.connect()
    } catch (e: Exception) {
      Log.e(TAG, "Error creating socket", e)
      e.printStackTrace()
    }
  }

  private fun buildLocationRequest() {
    locationRequest = LocationRequest.create().apply {
      priority = LocationRequest.PRIORITY_HIGH_ACCURACY
      interval = updateIntervalMs
      fastestInterval = fastestIntervalMs
      setSmallestDisplacement(minDistanceMeters)
    }
  }

  @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
  private fun startLocationUpdates() {
    fused.removeLocationUpdates(locationCallback)
    fused.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
  }

  private val locationCallback = object : LocationCallback() {
    private var lastPersistentLat = 0.0
    private var lastPersistentLng = 0.0
    private var hasPersistentLast = false

    private var lastRealtimeLat = 0.0
    private var lastRealtimeLng = 0.0
    private var hasRealtimeLast = false

    override fun onLocationResult(result: LocationResult) {
      val loc = result.lastLocation ?: return

      val now = System.currentTimeMillis()
      val distancePersistent = if (hasPersistentLast) {
        distance(lastPersistentLat, lastPersistentLng, loc.latitude, loc.longitude)
      } else 0f
      val distanceRealtime = if (hasRealtimeLast) {
        distance(lastRealtimeLat, lastRealtimeLng, loc.latitude, loc.longitude)
      } else 0f

      val persistentMovedEnough = !hasPersistentLast || distancePersistent >= minDistanceMeters
      val persistentThrottleOk = (now - lastEmitTs) >= throttleMs
      val realtimeMovedEnough = !hasRealtimeLast || distanceRealtime >= realtimeMinDistanceMeters
      val realtimeThrottleOk = (now - lastRealtimeEmitTs) >= throttleMs

      Log.d(
        TAG,
        "Location received -> lat=${loc.latitude}, lng=${loc.longitude}, acc=${loc.accuracy}, " +
          "distPersistent=$distancePersistent, persistentOk=${persistentMovedEnough && persistentThrottleOk}, " +
          "distRealtime=$distanceRealtime, realtimeOk=${realtimeMovedEnough && realtimeThrottleOk}"
      )

      val shouldPersist = persistentMovedEnough && persistentThrottleOk
      val shouldRealtime = realtimeMovedEnough && realtimeThrottleOk

      if (!shouldPersist && !shouldRealtime) {
        Log.d(
          TAG,
          "Location skipped -> persistentMovedEnough=$persistentMovedEnough, persistentThrottleOk=$persistentThrottleOk, " +
            "distPersistent=$distancePersistent, realtimeMovedEnough=$realtimeMovedEnough, realtimeThrottleOk=$realtimeThrottleOk, distRealtime=$distanceRealtime"
        )
        return
      }

      if (shouldPersist) {
        val payload = JSONObject().apply {
          put("latitude", loc.latitude)
          put("longitude", loc.longitude)
          put("accuracy", loc.accuracy)
          put("speed", loc.speed)
          put("bearing", loc.bearing)
          put("ts", now)
        }
        hasPersistentLast = true
        lastPersistentLat = loc.latitude
        lastPersistentLng = loc.longitude
        lastEmitTs = now

        Log.d(
          TAG,
          "Location ready -> lat=${loc.latitude}, lng=${loc.longitude}, acc=${loc.accuracy}, speed=${loc.speed}, bearing=${loc.bearing}"
        )

        emitOrBuffer(payload)

        updateNotification(loc)
      }

      if (shouldRealtime) {
        hasRealtimeLast = true
        lastRealtimeLat = loc.latitude
        lastRealtimeLng = loc.longitude
        lastRealtimeEmitTs = now
        val realtimePayload = JSONObject().apply {
          put("latitude", loc.latitude)
          put("longitude", loc.longitude)
        }
        emitRealtime(realtimePayload)
      }
    }
  }

  private fun emitOrBuffer(payload: JSONObject) {
    val s = socket
    if (s != null && s.connected()) {
      Log.i(TAG, "Emitting on emitOrBuffer event $eventName -> $payload")
      s.emit(eventName, payload)
    } else {
      buffer.offer(payload)
      while (buffer.size > MAX_BUFFER) buffer.poll()
      Log.w(TAG, "Socket offline, buffering payload (size=${buffer.size})")
    }
  }

  private fun emitRealtime(payload: JSONObject) {
    val event = realtimeEventName.takeUnless { it.isBlank() }
    val s = socket
    if (event == null) {
      Log.d(TAG, "emitRealtime -> skipping because realtimeEventName is blank")
      return
    }
    if (event == eventName) {
      Log.d(TAG, "emitRealtime -> realtime event matches persistent event; skipping")
      return
    }
    if (s != null && s.connected()) {
      Log.d(TAG, "Emitting realtime $event -> $payload")
      s.emit(event, payload)
    } else {
      Log.d(TAG, "emitRealtime -> skipped because socket is offline")
    }
  }

  private fun flushBuffer() {
    val s = socket ?: return
    if (!s.connected()) return
    val drained = mutableListOf<JSONObject>()
    var item = buffer.poll()
    while (item != null) {
      s.emit(eventName, item)
      drained.add(item)
      item = buffer.poll()
    }
    if (drained.isNotEmpty()) {
      Log.i(TAG, "Flushed ${drained.size} buffered payloads")
    } else {
      Log.d(TAG, "Flush requested but buffer empty")
    }
  }

  private fun createNotificationBuilder(): NotificationCompat.Builder {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val openPending = launchIntent?.let {
      PendingIntent.getActivity(
        this, 0, it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }
    val stopIntent = Intent(this, TrackingReceiver::class.java).apply { action = ACTION_STOP }
    val stopPending = PendingIntent.getBroadcast(
      this, 0, stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    return NotificationCompat.Builder(this, CHANNEL_ID).apply {
      setSmallIcon(android.R.drawable.ic_menu_mylocation)
      setContentTitle("Seguimiento activo")
      setOngoing(true)
      setOnlyAlertOnce(true)
      setShowWhen(true)
      openPending?.let { setContentIntent(it) }
      addAction(0, "Detener", stopPending)
    }
  }

  private fun updateNotification(loc: android.location.Location) {
    val coords = "Lat: ${formatCoord(loc.latitude)}  Lng: ${formatCoord(loc.longitude)}"
    val accuracyDetail = "Precisión ${loc.accuracy.toInt()} m"
    val speedDetail = if (loc.hasSpeed()) {
      "Vel ${String.format(Locale.US, "%.1f", loc.speed * 3.6f)} km/h"
    } else {
      "Vel N/D"
    }
    val bearingDetail = if (loc.hasBearing()) {
      "Rumbo ${String.format(Locale.US, "%.0f°", loc.bearing)}"
    } else {
      "Rumbo N/D"
    }
    val timeStamp = DateFormat.getTimeInstance(DateFormat.MEDIUM).format(Date())
    val details = listOf(accuracyDetail, speedDetail, bearingDetail).joinToString(" • ")
    val summary = "Actualizado $timeStamp"

    notificationBuilder
      .setContentText(coords)
      .setSubText(summary)
      .setStyle(
        NotificationCompat.BigTextStyle()
          .bigText("$coords\n$details")
          .setSummaryText(summary)
      )

    notificationManager.notify(NOTIF_ID, notificationBuilder.build())
  }

  private fun formatCoord(value: Double): String = String.format(Locale.US, "%.5f", value)

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(CHANNEL_ID, "Rastreo", NotificationManager.IMPORTANCE_LOW)
      (getSystemService(NotificationManager::class.java)).createNotificationChannel(channel)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    fused.removeLocationUpdates(locationCallback)
    try { connectivity.unregisterNetworkCallback(networkCallback) } catch (_: Exception) { }
    socket?.disconnect()
    socket?.close()
    Log.i(TAG, "TrackingService destroyed")
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun stopSelfSafely() {
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun distance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Float {
    val results = FloatArray(1)
    android.location.Location.distanceBetween(lat1, lon1, lat2, lon2, results)
    return results[0]
  }

  private fun getSocketUrlFromPrefs(): String {
    val sp = getSharedPreferences("auth", Context.MODE_PRIVATE)
    return sp.getString("socketUrl", "") ?: ""
  }
}
