package com.securify.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class TrackingReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        // ✅ Compare the nullable String? with the String constant
        if (intent?.action == TrackingService.ACTION_STOP) {
            val stopIntent = Intent(context, TrackingService::class.java).apply {
                action = TrackingService.ACTION_STOP
            }
            // ✅ Use startForegroundService on O+ (safe even if service is already foreground)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(stopIntent)
            } else {
                context.startService(stopIntent)
            }
        }
    }
}