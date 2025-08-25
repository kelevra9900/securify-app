package com.trablisarn

import android.Manifest
import android.app.*
import android.content.*
import android.net.ConnectivityManager
import android.net.Network
import android.os.*
import androidx.annotation.RequiresPermission
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.TimeUnit

class TrackingService : Service() {

    companion object {


        const val CHANNEL_ID = "tracking_channel"
        const val NOTIF_ID = 201

        const val ACTION_START = "com.trablisarn.TRACKING_START"
        const val ACTION_STOP  = "com.trablisarn.TRACKING_STOP"
        const val ACTION_UPDATE = "com.trablisarn.TRACKING_UPDATE"

        const val EXTRA_INTERVAL_MS = "intervalMs"
        const val EXTRA_FASTEST_MS = "fastestMs"
        const val EXTRA_MIN_DISTANCE = "minDistanceMeters"
        const val EXTRA_SOCKET_URL = "socketUrl"
        const val EXTRA_TOKEN = "authToken"

        // Defaults
        private val DEFAULT_UPDATE_INTERVAL_MS = TimeUnit.SECONDS.toMillis(10)
        private val DEFAULT_FASTEST_INTERVAL_MS = TimeUnit.SECONDS.toMillis(5)
        private const val DEFAULT_MIN_DISTANCE = 5f
        private const val MAX_BUFFER = 300
    }

    private lateinit var fused: FusedLocationProviderClient
    private lateinit var locationRequest: LocationRequest
    private var socket: Socket? = null
    private var socketUrl: String = ""
    private var authToken: String = ""

    // Config runtime
    private var updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS
    private var fastestIntervalMs = DEFAULT_FASTEST_INTERVAL_MS
    private var minDistanceMeters = DEFAULT_MIN_DISTANCE

    // Throttle (emisión hacia backend)
    private var lastEmitTs = 0L
    private val MIN_EMIT_INTERVAL_MS = 1500L // ajusta según tu rate-limit servidor

    // Buffer offline cuando no hay red o socket desconectado
    private val buffer = ConcurrentLinkedQueue<JSONObject>()

    private lateinit var connectivity: ConnectivityManager
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            flushBuffer()
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIF_ID, buildNotification("Iniciando rastreo..."))

        connectivity = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        connectivity.registerDefaultNetworkCallback(networkCallback)

        fused = LocationServices.getFusedLocationProviderClient(this)
    }

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action ?: ACTION_START) {
            ACTION_STOP -> {
                stopSelfSafely()
                return START_NOT_STICKY
            }
            ACTION_UPDATE, ACTION_START -> {
                // lee config nueva (si viene)
                updateIntervalMs = intent?.getLongExtra(EXTRA_INTERVAL_MS, DEFAULT_UPDATE_INTERVAL_MS) ?: DEFAULT_UPDATE_INTERVAL_MS
                fastestIntervalMs = intent?.getLongExtra(EXTRA_FASTEST_MS, DEFAULT_FASTEST_INTERVAL_MS) ?: DEFAULT_FASTEST_INTERVAL_MS
                minDistanceMeters = intent?.getFloatExtra(EXTRA_MIN_DISTANCE, DEFAULT_MIN_DISTANCE) ?: DEFAULT_MIN_DISTANCE

                socketUrl = intent?.getStringExtra(EXTRA_SOCKET_URL) ?: socketUrl
                authToken = intent?.getStringExtra(EXTRA_TOKEN) ?: getTokenFromPrefs()

                ensureSocket()
                buildLocationRequest()
                startLocationUpdates()
            }
        }
        return START_STICKY
    }

    private fun ensureSocket() {
        if (socket != null) return
        if (socketUrl.isBlank()) {
            // Fallback: si no seteaste por intent, lee de prefs (ajústalo a tu caso)
            socketUrl = getSocketUrlFromPrefs()
        }
        try {
            val opts = IO.Options().apply {
                reconnection = true
                reconnectionAttempts = Int.MAX_VALUE
                reconnectionDelay = 2000
                extraHeaders = mapOf("Authorization" to listOf("Bearer $authToken"))
            }
            socket = IO.socket(socketUrl, opts)
            socket?.on(Socket.EVENT_CONNECT) {
                flushBuffer()
            }
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                // Log opcional
            }
            socket?.connect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun buildLocationRequest() {
        val builder = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, updateIntervalMs)
            .setMinUpdateIntervalMillis(fastestIntervalMs)

        // setMinUpdateDistanceMeters disponible en play-services-location recientes
        try {
            val m = LocationRequest.Builder::class.java.getMethod("setMinUpdateDistanceMeters", Float::class.javaPrimitiveType)
            m.invoke(builder, minDistanceMeters)
        } catch (_: Exception) {
            // Si no existe, filtramos manualmente en el callback
        }
        locationRequest = builder.build()
    }

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    private fun startLocationUpdates() {
        fused.removeLocationUpdates(locationCallback) // evita dobles suscripciones
        fused.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    private val locationCallback = object : LocationCallback() {
        private var lastLat = 0.0
        private var lastLng = 0.0
        private var hasLast = false

        override fun onLocationResult(result: LocationResult) {
            val loc = result.lastLocation ?: return

            // Filtro por distancia si el request no lo soportó
            val movedEnough = !hasLast ||
                    distance(lastLat, lastLng, loc.latitude, loc.longitude) >= minDistanceMeters

            // Throttle de emisiones al server
            val now = System.currentTimeMillis()
            val throttleOk = (now - lastEmitTs) >= MIN_EMIT_INTERVAL_MS

            if (movedEnough && throttleOk) {
                hasLast = true
                lastLat = loc.latitude
                lastLng = loc.longitude
                lastEmitTs = now

                val payload = JSONObject().apply {
                    put("latitude", loc.latitude)
                    put("longitude", loc.longitude)
                    put("accuracy", loc.accuracy)
                    put("speed", loc.speed)
                    put("bearing", loc.bearing)
                    put("ts", now)
                }

                emitOrBuffer(payload)

                // Actualiza notificación
                val text = "Lat: ${"%.5f".format(loc.latitude)}, Lng: ${"%.5f".format(loc.longitude)}"
                (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
                    .notify(NOTIF_ID, buildNotification(text))
            }
        }
    }

    private fun emitOrBuffer(payload: JSONObject) {
        val s = socket
        if (s != null && s.connected()) {
            s.emit("new_location", payload)
        } else {
            buffer.offer(payload)
            while (buffer.size > MAX_BUFFER) buffer.poll() // descarta antiguos
        }
    }

    private fun flushBuffer() {
        val s = socket ?: return
        if (!s.connected()) return
        var item = buffer.poll()
        while (item != null) {
            s.emit("new_location", item)
            item = buffer.poll()
        }
    }

    private fun buildNotification(content: String): Notification {
        val openAppIntent = PendingIntent.getActivity(
            this, 0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Acción STOP
        val stopIntent = Intent(this, TrackingReceiver::class.java).apply { action = ACTION_STOP }
        val stopPending = PendingIntent.getBroadcast(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Seguimiento activo")
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setContentIntent(openAppIntent)
            .addAction(0, "Detener", stopPending)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Rastreo", NotificationManager.IMPORTANCE_LOW)
            (getSystemService(NotificationManager::class.java)).createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        fused.removeLocationUpdates(locationCallback)
        try {
            connectivity.unregisterNetworkCallback(networkCallback)
        } catch (_: Exception) {}
        socket?.disconnect()
        socket?.close()
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

    private fun getTokenFromPrefs(): String {
        val sp = getSharedPreferences("auth", Context.MODE_PRIVATE)
        return sp.getString("token", "") ?: ""
    }

    private fun getSocketUrlFromPrefs(): String {
        val sp = getSharedPreferences("auth", Context.MODE_PRIVATE)
        return sp.getString("socketUrl", "https://tu-servidor-socket") ?: "https://tu-servidor-socket"
    }
}
