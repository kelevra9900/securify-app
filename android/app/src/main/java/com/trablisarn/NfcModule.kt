package com.trablisarn

import android.app.Activity
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.os.*
import com.facebook.react.bridge.*

class NfcModule(private val rc: ReactApplicationContext)
  : ReactContextBaseJavaModule(rc) {

  override fun getName() = "NfcModule"

  private var resolved = false

  @ReactMethod
  fun isSupported(promise: Promise) {
    promise.resolve(NfcAdapter.getDefaultAdapter(rc) != null)
  }

  @ReactMethod
  fun scanTag(options: ReadableMap?, promise: Promise) {
    val activity: Activity = rc.currentActivity ?: run {
      promise.reject("E_ACTIVITY", "No activity available")
      return
    }
    val adapter = NfcAdapter.getDefaultAdapter(activity)
    if (adapter == null) {
      promise.reject("E_UNSUPPORTED", "NFC not supported")
      return
    }

    val timeoutMs = (options?.getDouble("timeoutMs")?.toLong() ?: 10_000L).coerceAtLeast(2_000L)
    resolved = false

    val callback = NfcAdapter.ReaderCallback { tag ->
      if (resolved) return@ReaderCallback
      resolved = true

      val res = Arguments.createMap().apply {
        putString("uid", tag.id.toHex())
        putString("tech", tag.techList.joinToString(","))
      }

      // Intento leer un NDEF (si el tag lo soporta y tiene mensaje)
      try {
        // Desde Android 10, NDEF se obtiene con Ndef.get(tag); no todos los tags lo soportan
        val ndef = android.nfc.tech.Ndef.get(tag)
        if (ndef != null) {
          ndef.connect()
          val msg: NdefMessage? = ndef.ndefMessage
          if (msg != null && msg.records.isNotEmpty()) {
            val r: NdefRecord = msg.records.first()
            val map = Arguments.createMap().apply {
              putString("type", try { String(r.type) } catch (_: Exception) { "" })
              putString("payload", try { String(r.payload) } catch (_: Exception) { "" })
            }
            res.putMap("ndef", map)
          }
          try { ndef.close() } catch (_: Exception) {}
        }
      } catch (_: Exception) {}

      activity.runOnUiThread {
        try { adapter.disableReaderMode(activity) } catch (_: Exception) {}
        promise.resolve(res)
      }
    }

    // Activa ReaderMode
    val flags = NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_NFC_F or
                NfcAdapter.FLAG_READER_NFC_V or
                NfcAdapter.FLAG_READER_NFC_BARCODE

    try {
      adapter.enableReaderMode(activity, callback, flags, Bundle())
    } catch (e: Exception) {
      promise.reject("E_ENABLE", e.localizedMessage, e)
      return
    }

    // Timeout
    Handler(Looper.getMainLooper()).postDelayed({
      if (!resolved) {
        resolved = true
        try { adapter.disableReaderMode(activity) } catch (_: Exception) {}
        promise.reject("E_TIMEOUT", "NFC scan timed out")
      }
    }, timeoutMs)
  }

  private fun ByteArray.toHex(): String = joinToString("") { b -> "%02X".format(b) }
}
