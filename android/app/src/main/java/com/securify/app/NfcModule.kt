package com.securify.app

import android.app.Activity
import android.content.Context
import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.os.*
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.IOException

class NfcModule(private val rc: ReactApplicationContext)
  : ReactContextBaseJavaModule(rc) {

  override fun getName() = "NfcModule"

  private var scanResolved = false
  private var writeResolved = false
  private val TAG = "NfcModule"
  
  // Handlers para cancelar timeouts si es necesario
  private var scanTimeoutHandler: Runnable? = null
  private var writeTimeoutHandler: Runnable? = null

  /**
   * Envía un evento de tracking a React Native para Sentry
   */
  private fun sendTrackingEvent(eventName: String, data: WritableMap?) {
    try {
      rc.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("NfcTracking", Arguments.createMap().apply {
          putString("event", eventName)
          if (data != null) {
            putMap("data", data)
          }
        })
    } catch (e: Exception) {
      Log.w(TAG, "Failed to send tracking event: ${e.message}")
    }
  }

  /**
   * Genera feedback háptico cuando se detecta un tag
   */
  private fun vibrateOnTagDetected(activity: Activity) {
    try {
      val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? android.os.VibratorManager
        vibratorManager?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        activity.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
      }
      
      vibrator?.let {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          it.vibrate(VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
          @Suppress("DEPRECATION")
          it.vibrate(50)
        }
        Log.d(TAG, "Vibración de feedback ejecutada")
      }
    } catch (e: Exception) {
      Log.w(TAG, "No se pudo ejecutar vibración: ${e.message}")
    }
  }

  @ReactMethod
  fun isSupported(promise: Promise) {
    promise.resolve(NfcAdapter.getDefaultAdapter(rc) != null)
  }

  @ReactMethod
  fun writeTag(payload: String, options: ReadableMap?, promise: Promise) {
    val timeoutMs = (options?.getDouble("timeoutMs")?.toLong() ?: 10_000L).coerceAtLeast(2_000L)
    
    Log.d(TAG, "writeTag: Iniciando escritura NFC (timeout: ${timeoutMs}ms)")
    sendTrackingEvent("write_started", Arguments.createMap().apply {
      putDouble("timeoutMs", timeoutMs.toDouble())
      putInt("payloadSize", payload.length)
    })

    val activity: Activity = rc.currentActivity ?: run {
      Log.e(TAG, "writeTag: No hay actividad disponible")
      sendTrackingEvent("write_error", Arguments.createMap().apply {
        putString("error", "no_activity")
      })
      promise.reject("E_ACTIVITY", "No activity available")
      return
    }
    
    val adapter = NfcAdapter.getDefaultAdapter(activity)
    if (adapter == null) {
      Log.e(TAG, "writeTag: NFC no soportado en el dispositivo")
      sendTrackingEvent("write_error", Arguments.createMap().apply {
        putString("error", "nfc_not_supported")
      })
      promise.reject("E_UNSUPPORTED", "NFC not supported")
      return
    }

    if (!adapter.isEnabled) {
      Log.e(TAG, "writeTag: NFC está deshabilitado")
      sendTrackingEvent("write_error", Arguments.createMap().apply {
        putString("error", "nfc_disabled")
      })
      promise.reject("E_NFC_DISABLED", "NFC is disabled. Please enable it in settings.")
      return
    }

    writeResolved = false

    val callback = NfcAdapter.ReaderCallback { tag ->
      if (writeResolved) {
        Log.d(TAG, "writeTag: Tag detectado pero ya resuelto, ignorando")
        return@ReaderCallback
      }
      writeResolved = true
      
      val uid = tag.id.toHex()
      val techList = tag.techList.joinToString(", ")
      Log.i(TAG, "writeTag: Tag detectado para escritura - UID: $uid")
      Log.d(TAG, "writeTag: Tecnologías soportadas: $techList")
      
      // Feedback háptico
      vibrateOnTagDetected(activity)

      var error: Exception? = null
      var ndef: android.nfc.tech.Ndef? = null
      var formatable: android.nfc.tech.NdefFormatable? = null
      
      sendTrackingEvent("write_tag_detected", Arguments.createMap().apply {
        putString("uid", uid)
        putString("techList", techList)
      })
      
      try {
        val message = NdefMessage(arrayOf(
          NdefRecord.createMime("application/json", payload.toByteArray(Charsets.UTF_8))
        ))
        val messageSize = message.toByteArray().size
        Log.d(TAG, "writeTag: Tamaño del mensaje NDEF: $messageSize bytes")

        ndef = android.nfc.tech.Ndef.get(tag)
        if (ndef != null) {
          Log.d(TAG, "writeTag: Tag soporta NDEF")
          ndef.connect()
          Log.d(TAG, "writeTag: Tipo NDEF: ${ndef.type}, MaxSize: ${ndef.maxSize}, isWritable: ${ndef.isWritable}")
          
          if (!ndef.isWritable) {
            throw IOException("Tag está protegido contra escritura (read-only)")
          }
          if (ndef.maxSize < messageSize) {
            throw IOException("Payload muy grande para el tag (max: ${ndef.maxSize} bytes, necesitados: $messageSize bytes)")
          }
          ndef.writeNdefMessage(message)
          Log.i(TAG, "writeTag: Escritura NDEF exitosa")
        } else {
          Log.d(TAG, "writeTag: Tag sin formato NDEF previo")
          formatable = android.nfc.tech.NdefFormatable.get(tag)
          if (formatable != null) {
            Log.d(TAG, "writeTag: Tag es formatable, formateando como NDEF...")
            formatable.connect()
            formatable.format(message)
            Log.i(TAG, "writeTag: Tag formateado y escrito exitosamente")
          } else {
            // Intento alternativo: verificar si es MifareUltralight (NTAG215)
            Log.w(TAG, "writeTag: Tag no es NdefFormatable, intentando escritura directa con MifareUltralight...")
            val mifareUl = android.nfc.tech.MifareUltralight.get(tag)
            if (mifareUl != null) {
              try {
                mifareUl.connect()
                val type = mifareUl.type
                val typeName = when(type) {
                  android.nfc.tech.MifareUltralight.TYPE_ULTRALIGHT -> "Ultralight"
                  android.nfc.tech.MifareUltralight.TYPE_ULTRALIGHT_C -> "Ultralight C"
                  else -> "Unknown/NTAG ($type)"
                }
                Log.i(TAG, "writeTag: Tag es MifareUltralight tipo: $typeName. Intentando escritura directa...")
                
                // Escribir NDEF directamente en el tag usando escritura de bajo nivel
                writeNdefToMifareUltralight(mifareUl, message)
                
                Log.i(TAG, "writeTag: Escritura directa en MifareUltralight exitosa")
              } finally {
                try { mifareUl.close() } catch (_: Exception) {}
              }
            } else {
              throw IOException("Tag no soporta NDEF ni NdefFormatable. Tecnologías disponibles: $techList")
            }
          }
        }
      } catch (e: Exception) {
        Log.e(TAG, "writeTag: Error escribiendo en tag: ${e.message}", e)
        error = e
        sendTrackingEvent("write_operation_error", Arguments.createMap().apply {
          putString("uid", uid)
          putString("error", e.message ?: "unknown")
        })
      } finally {
        try {
          ndef?.close()
        } catch (_: Exception) {}
        try {
          formatable?.close()
        } catch (_: Exception) {}
      }

      activity.runOnUiThread {
        try { adapter.disableReaderMode(activity) } catch (_: Exception) {}
        writeTimeoutHandler?.let { Handler(Looper.getMainLooper()).removeCallbacks(it) }
        
        if (error == null) {
          Log.i(TAG, "writeTag: Escritura completada exitosamente")
          sendTrackingEvent("write_success", Arguments.createMap().apply {
            putString("uid", uid)
          })
          promise.resolve(null)
        } else {
          val msg = error?.localizedMessage ?: "Failed to write tag"
          promise.reject("E_WRITE", msg, error)
        }
      }
    }

    val flags = NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_NFC_F or
                NfcAdapter.FLAG_READER_NFC_V or
                NfcAdapter.FLAG_READER_NFC_BARCODE or
                NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK

    try {
      adapter.enableReaderMode(activity, callback, flags, Bundle())
      Log.i(TAG, "writeTag: ReaderMode activado para escritura")
      sendTrackingEvent("write_reader_mode_enabled", Arguments.createMap().apply {
        putString("flags", "NO_PLATFORM_SOUNDS | SKIP_NDEF_CHECK")
      })
    } catch (e: Exception) {
      Log.e(TAG, "writeTag: Error activando ReaderMode: ${e.message}", e)
      sendTrackingEvent("write_reader_mode_error", Arguments.createMap().apply {
        putString("error", e.message ?: "unknown")
      })
      promise.reject("E_ENABLE", e.localizedMessage, e)
      return
    }

    // Timeout
    writeTimeoutHandler = Runnable {
      if (!writeResolved) {
        writeResolved = true
        try { adapter.disableReaderMode(activity) } catch (_: Exception) {}
        Log.w(TAG, "writeTag: Timeout alcanzado (${timeoutMs}ms)")
        sendTrackingEvent("write_timeout", Arguments.createMap().apply {
          putDouble("timeoutMs", timeoutMs.toDouble())
        })
        promise.reject("E_TIMEOUT", "NFC write timed out")
      }
    }
    Handler(Looper.getMainLooper()).postDelayed(writeTimeoutHandler!!, timeoutMs)
  }

  /**
   * Escribe un mensaje NDEF directamente en un tag MifareUltralight (NTAG215)
   * Resetea y formatea el tag antes de escribir
   * 
   * Estructura de memoria NTAG215:
   * - Páginas 0-2: UID (solo lectura)
   * - Página 3: Capability Container (CC) parte 1
   * - Página 4: CC parte 2 + inicio de datos NDEF
   * - Páginas 5-129: Datos NDEF
   * 
   * @param mifareUl Instancia de MifareUltralight ya conectada
   * @param message Mensaje NDEF a escribir
   * @throws IOException si hay error de escritura o el mensaje es muy grande
   */
  private fun writeNdefToMifareUltralight(mifareUl: android.nfc.tech.MifareUltralight, message: NdefMessage) {
    val ndefBytes = message.toByteArray()
    val ndefLength = ndefBytes.size
    
    Log.d(TAG, "writeNdefToMifareUltralight: Preparando escritura directa de $ndefLength bytes")
    
    // NTAG215 tiene 504 bytes de memoria de usuario (páginas 4-129, 126 páginas * 4 bytes)
    // Restamos 4 bytes para el TLV header (T, L) y terminator
    val maxPayloadSize = 500
    
    if (ndefLength > maxPayloadSize) {
      throw IOException("Mensaje muy grande para NTAG215: $ndefLength bytes (máximo: $maxPayloadSize bytes)")
    }
    
    // TLV: Type-Length-Value
    // T = 0x03 (mensaje NDEF)
    // L = tamaño del mensaje (1 o 3 bytes dependiendo del tamaño)
    // V = mensaje NDEF
    // 0xFE = terminador
    
    val tlvData = if (ndefLength < 255) {
      // Formato corto: T + L (1 byte) + V
      ByteArray(ndefLength + 2).apply {
        this[0] = 0x03.toByte() // Type: NDEF Message
        this[1] = ndefLength.toByte() // Length (1 byte)
        System.arraycopy(ndefBytes, 0, this, 2, ndefLength)
      }
    } else {
      // Formato largo: T + 0xFF + L (2 bytes) + V
      ByteArray(ndefLength + 4).apply {
        this[0] = 0x03.toByte() // Type: NDEF Message
        this[1] = 0xFF.toByte() // Indicador de formato largo
        this[2] = (ndefLength shr 8).toByte() // Length high byte
        this[3] = (ndefLength and 0xFF).toByte() // Length low byte
        System.arraycopy(ndefBytes, 0, this, 4, ndefLength)
      }
    }
    
    Log.d(TAG, "writeNdefToMifareUltralight: TLV preparado con ${tlvData.size} bytes totales")
    
    try {
      // Paso 1: Escribir Capability Container (CC) en páginas 3 y 4
      // CC define las capacidades del tag NDEF
      // Byte 0: Magic number 0xE1 (indica soporte NDEF)
      // Byte 1: Version (0x10 = versión 1.0)
      // Byte 2: Tamaño de memoria en bloques de 8 bytes (0x3F = 504 bytes para NTAG215)
      // Byte 3: Permisos de lectura/escritura (0x00 = lectura y escritura permitidas)
      
      val ccPage3 = byteArrayOf(
        0xE1.toByte(), // Magic number NDEF
        0x10.toByte(), // Versión 1.0
        0x3F.toByte(), // Tamaño: 63 * 8 = 504 bytes
        0x00.toByte()  // Permisos: R/W permitido
      )
      
      Log.d(TAG, "writeNdefToMifareUltralight: Escribiendo Capability Container en página 3...")
      mifareUl.writePage(3, ccPage3)
      
      // Paso 2: Resetear página 4 (inicio de datos NDEF)
      // Esta página contendrá el inicio del TLV
      Log.d(TAG, "writeNdefToMifareUltralight: Preparando escritura de datos NDEF...")
      
      // Paso 3: Escribir datos NDEF página por página (4 bytes por página)
      // Comenzamos en la página 4
      val startPage = 4
      var bytesWritten = 0
      var currentPage = startPage
      
      while (bytesWritten < tlvData.size) {
        val pageData = ByteArray(4) { 0x00 } // Inicializar con ceros
        val bytesToWrite = minOf(4, tlvData.size - bytesWritten)
        
        // Copiar bytes del TLV a la página actual
        System.arraycopy(tlvData, bytesWritten, pageData, 0, bytesToWrite)
        
        Log.d(TAG, "writeNdefToMifareUltralight: Escribiendo página $currentPage (${bytesToWrite} bytes de datos)")
        mifareUl.writePage(currentPage, pageData)
        
        bytesWritten += bytesToWrite
        currentPage++
        
        // Verificación de seguridad: no escribir más allá de la página 129 (límite de NTAG215)
        if (currentPage > 129) {
          throw IOException("Se excedió el límite de páginas del tag NTAG215")
        }
      }
      
      // Paso 4: Escribir terminador TLV (0xFE) en la siguiente página
      val terminatorPage = ByteArray(4) { 0x00 }
      terminatorPage[0] = 0xFE.toByte() // Terminador TLV
      
      Log.d(TAG, "writeNdefToMifareUltralight: Escribiendo terminador TLV en página $currentPage")
      mifareUl.writePage(currentPage, terminatorPage)
      
      Log.i(TAG, "writeNdefToMifareUltralight: Escritura completada. Total de páginas escritas: ${currentPage - startPage + 1}")
      
      sendTrackingEvent("mifare_write_success", Arguments.createMap().apply {
        putInt("bytesWritten", ndefLength)
        putInt("pagesWritten", currentPage - startPage + 1)
        putString("tagType", "MifareUltralight/NTAG215")
      })
      
    } catch (e: Exception) {
      Log.e(TAG, "writeNdefToMifareUltralight: Error en escritura de bajo nivel: ${e.message}", e)
      sendTrackingEvent("mifare_write_error", Arguments.createMap().apply {
        putString("error", e.message ?: "unknown")
      })
      throw IOException("Error escribiendo en NTAG215: ${e.message}", e)
    }
  }

  /**
   * Lee un mensaje NDEF directamente desde un tag MifareUltralight
   * 
   * @param mifareUl Instancia de MifareUltralight ya conectada
   * @return String con el payload NDEF o null si no se puede leer
   */
  private fun readNdefFromMifareUltralight(mifareUl: android.nfc.tech.MifareUltralight): String? {
    try {
      Log.d(TAG, "readNdefFromMifareUltralight: Comenzando lectura directa...")
      
      // Leer página 4 (inicio del TLV)
      val page4Data = mifareUl.readPages(4)
      if (page4Data.size < 4) {
        Log.w(TAG, "readNdefFromMifareUltralight: No se pudo leer página 4")
        return null
      }
      
      // Verificar que sea un mensaje NDEF (T = 0x03)
      if (page4Data[0] != 0x03.toByte()) {
        Log.w(TAG, "readNdefFromMifareUltralight: No es un mensaje NDEF (T=${page4Data[0]})")
        return null
      }
      
      // Leer el tamaño (L)
      val length: Int
      val dataStartByte: Int
      
      if (page4Data[1] == 0xFF.toByte()) {
        // Formato largo (3 bytes de length)
        if (page4Data.size < 4) {
          Log.w(TAG, "readNdefFromMifareUltralight: Formato largo pero datos insuficientes")
          return null
        }
        length = ((page4Data[2].toInt() and 0xFF) shl 8) or (page4Data[3].toInt() and 0xFF)
        dataStartByte = 4
        Log.d(TAG, "readNdefFromMifareUltralight: Formato largo detectado, length=$length bytes")
      } else {
        // Formato corto (1 byte de length)
        length = page4Data[1].toInt() and 0xFF
        dataStartByte = 2
        Log.d(TAG, "readNdefFromMifareUltralight: Formato corto detectado, length=$length bytes")
      }
      
      if (length <= 0 || length > 500) {
        Log.w(TAG, "readNdefFromMifareUltralight: Tamaño inválido: $length")
        return null
      }
      
      // Calcular cuántas páginas necesitamos leer
      val totalBytesNeeded = dataStartByte + length
      val pagesNeeded = (totalBytesNeeded + 15) / 16 // readPages lee 4 páginas (16 bytes) a la vez
      
      Log.d(TAG, "readNdefFromMifareUltralight: Leyendo $pagesNeeded grupos de páginas...")
      
      // Leer todas las páginas necesarias
      val allData = ByteArray(pagesNeeded * 16)
      var currentPage = 4
      var bytesRead = 0
      
      // Copiar los primeros bytes que ya leímos (páginas 4-7, 16 bytes)
      val initialBytes = minOf(page4Data.size, allData.size)
      System.arraycopy(page4Data, 0, allData, 0, initialBytes)
      bytesRead = initialBytes
      currentPage = 8 // readPages(4) ya leyó páginas 4,5,6,7 → siguiente es 8
      
      // Leer el resto de páginas si es necesario
      while (bytesRead < totalBytesNeeded && currentPage < 130) {
        val pageData = mifareUl.readPages(currentPage)
        val bytesToCopy = minOf(pageData.size, allData.size - bytesRead)
        System.arraycopy(pageData, 0, allData, bytesRead, bytesToCopy)
        bytesRead += bytesToCopy
        currentPage += 4 // readPages lee 4 páginas a la vez
      }
      
      Log.d(TAG, "readNdefFromMifareUltralight: Leídos $bytesRead bytes en total")
      
      // Extraer el payload NDEF
      val ndefMessageBytes = ByteArray(length)
      System.arraycopy(allData, dataStartByte, ndefMessageBytes, 0, length)
      
      // Log para debugging: primeros bytes
      val previewBytes = ndefMessageBytes.take(32).joinToString(" ") { 
        String.format("%02X", it) 
      }
      Log.d(TAG, "readNdefFromMifareUltralight: Primeros bytes del mensaje NDEF: $previewBytes")
      
      // Parsear el mensaje NDEF
      try {
        val ndefMessage = NdefMessage(ndefMessageBytes)
        if (ndefMessage.records.isNotEmpty()) {
          val record = ndefMessage.records[0]
          
          // Extraer el payload según el TNF (Type Name Format)
          val payloadString = when (record.tnf) {
            NdefRecord.TNF_MIME_MEDIA -> {
              // Para MIME type (application/json), el payload es directo
              // PERO el record incluye el tipo MIME en el campo 'type', no en payload
              String(record.payload, Charsets.UTF_8)
            }
            NdefRecord.TNF_WELL_KNOWN -> {
              // Text record - el primer byte es status byte
              if (record.payload.isNotEmpty() && String(record.type, Charsets.US_ASCII) == "T") {
                val languageCodeLength = (record.payload[0].toInt() and 0x3F)
                val textStartIndex = 1 + languageCodeLength
                if (record.payload.size > textStartIndex) {
                  String(record.payload.copyOfRange(textStartIndex, record.payload.size), Charsets.UTF_8)
                } else {
                  ""
                }
              } else {
                String(record.payload, Charsets.UTF_8)
              }
            }
            else -> {
              // Otros tipos - payload directo
              String(record.payload, Charsets.UTF_8)
            }
          }
          
          Log.i(TAG, "readNdefFromMifareUltralight: Payload leído exitosamente, TNF=${record.tnf}, tamaño=${payloadString.length}")
          Log.d(TAG, "readNdefFromMifareUltralight: Tipo del record: ${String(record.type, Charsets.UTF_8)}")
          return payloadString
        } else {
          Log.w(TAG, "readNdefFromMifareUltralight: Mensaje NDEF sin registros")
          return null
        }
      } catch (e: Exception) {
        Log.e(TAG, "readNdefFromMifareUltralight: Error parseando mensaje NDEF: ${e.message}", e)
        return null
      }
      
    } catch (e: Exception) {
      Log.e(TAG, "readNdefFromMifareUltralight: Error en lectura directa: ${e.message}", e)
      return null
    }
  }

  @ReactMethod
  fun scanTag(options: ReadableMap?, promise: Promise) {
    val timeoutMs = (options?.getDouble("timeoutMs")?.toLong() ?: 10_000L).coerceAtLeast(2_000L)
    
    Log.d(TAG, "scanTag: Iniciando escaneo NFC (timeout: ${timeoutMs}ms)")
    sendTrackingEvent("scan_started", Arguments.createMap().apply {
      putDouble("timeoutMs", timeoutMs.toDouble())
    })

    val activity: Activity = rc.currentActivity ?: run {
      Log.e(TAG, "scanTag: No hay actividad disponible")
      sendTrackingEvent("scan_error", Arguments.createMap().apply {
        putString("error", "no_activity")
      })
      promise.reject("E_ACTIVITY", "No activity available")
      return
    }
    
    val adapter = NfcAdapter.getDefaultAdapter(activity)
    if (adapter == null) {
      Log.e(TAG, "scanTag: NFC no soportado en el dispositivo")
      sendTrackingEvent("scan_error", Arguments.createMap().apply {
        putString("error", "nfc_not_supported")
      })
      promise.reject("E_UNSUPPORTED", "NFC not supported")
      return
    }

    if (!adapter.isEnabled) {
      Log.e(TAG, "scanTag: NFC está deshabilitado")
      sendTrackingEvent("scan_error", Arguments.createMap().apply {
        putString("error", "nfc_disabled")
      })
      promise.reject("E_NFC_DISABLED", "NFC is disabled. Please enable it in settings.")
      return
    }

    scanResolved = false

    val callback = NfcAdapter.ReaderCallback { tag ->
      if (scanResolved) {
        Log.d(TAG, "scanTag: Tag detectado pero ya resuelto, ignorando")
        return@ReaderCallback
      }
      scanResolved = true

      val uid = tag.id.toHex()
      val tech = tag.techList.joinToString(",")
      
      Log.i(TAG, "scanTag: Tag detectado - UID: $uid, Tech: $tech")
      
      // Feedback háptico
      vibrateOnTagDetected(activity)
      
      sendTrackingEvent("tag_detected", Arguments.createMap().apply {
        putString("uid", uid)
        putString("tech", tech)
      })

      val res = Arguments.createMap().apply {
        putString("uid", uid)
        putString("tech", tech)
      }

      // Intento leer un NDEF (si el tag lo soporta y tiene mensaje)
      try {
        Log.d(TAG, "scanTag: Intentando leer NDEF del tag")
        val ndef = android.nfc.tech.Ndef.get(tag)
        if (ndef != null) {
          Log.d(TAG, "scanTag: Tag soporta NDEF, conectando...")
          ndef.connect()
          val msg: NdefMessage? = ndef.ndefMessage
          if (msg != null && msg.records.isNotEmpty()) {
            Log.i(TAG, "scanTag: Mensaje NDEF encontrado con ${msg.records.size} registro(s)")
            val r: NdefRecord = msg.records.first()
            val typeString = try { String(r.type, Charsets.UTF_8) } catch (_: Exception) { "" }
            Log.d(TAG, "scanTag: Tipo NDEF: $typeString, TNF: ${r.tnf}, Payload size: ${r.payload.size}")
            
            // Extraer el payload según el TNF (Type Name Format)
            val payloadString = try {
              when (r.tnf) {
                NdefRecord.TNF_MIME_MEDIA -> {
                  // MIME type (application/json) - payload directo
                  String(r.payload, Charsets.UTF_8)
                }
                NdefRecord.TNF_WELL_KNOWN -> {
                  // Text record (tipo "T") - el primer byte es status byte (encoding + language code length)
                  // Byte format: bit 7 = encoding (0=UTF-8, 1=UTF-16), bits 0-5 = language code length
                  if (r.payload.isNotEmpty() && String(r.type, Charsets.US_ASCII) == "T") {
                    val languageCodeLength = (r.payload[0].toInt() and 0x3F)
                    val textStartIndex = 1 + languageCodeLength
                    if (r.payload.size > textStartIndex) {
                      String(r.payload.copyOfRange(textStartIndex, r.payload.size), Charsets.UTF_8)
                    } else {
                      ""
                    }
                  } else {
                    // Otros tipos well-known, leer directo
                    String(r.payload, Charsets.UTF_8)
                  }
                }
                NdefRecord.TNF_ABSOLUTE_URI, NdefRecord.TNF_EXTERNAL_TYPE -> {
                  // URI o tipos externos - payload directo
                  String(r.payload, Charsets.UTF_8)
                }
                else -> {
                  // Tipos desconocidos o vacíos - intentar leer directo
                  String(r.payload, Charsets.UTF_8)
                }
              }
            } catch (e: Exception) { 
              // Fallback: intentar leer directo si falla el parsing específico
              try {
                String(r.payload, Charsets.UTF_8)
              } catch (_: Exception) {
                ""
              }
            }
            
            Log.i(TAG, "scanTag: Payload extraído - Tipo: $typeString, Tamaño: ${payloadString.length}")
            
            val map = Arguments.createMap().apply {
              putString("type", typeString)
              putString("payload", payloadString)
            }
            res.putMap("ndef", map)
            
            sendTrackingEvent("ndef_read_success", Arguments.createMap().apply {
              putString("uid", uid)
              putString("type", typeString)
              putInt("payloadLength", payloadString.length)
              putInt("tnf", r.tnf.toInt())
            })
          } else {
            Log.w(TAG, "scanTag: Tag NDEF sin mensaje o vacío")
          }
          try { ndef.close() } catch (_: Exception) {}
        } else {
          Log.d(TAG, "scanTag: Tag no soporta NDEF estándar, intentando lectura directa con MifareUltralight...")
          
          // Intentar leer directamente desde MifareUltralight
          val mifareUl = android.nfc.tech.MifareUltralight.get(tag)
          if (mifareUl != null) {
            try {
              mifareUl.connect()
              Log.d(TAG, "scanTag: MifareUltralight conectado, leyendo páginas...")
              
              // Leer página 3 (Capability Container)
              val ccPage = mifareUl.readPages(3)
              if (ccPage.size >= 4 && ccPage[0] == 0xE1.toByte()) {
                Log.d(TAG, "scanTag: CC válido encontrado (0xE1), leyendo datos NDEF...")
                
                // Leer desde página 4 (inicio de datos NDEF)
                val ndefData = readNdefFromMifareUltralight(mifareUl)
                if (ndefData != null) {
                  Log.i(TAG, "scanTag: Datos NDEF leídos directamente desde MifareUltralight")
                  
                  val map = Arguments.createMap().apply {
                    putString("type", "application/json")
                    putString("payload", ndefData)
                  }
                  res.putMap("ndef", map)
                  
                  sendTrackingEvent("ndef_read_direct_success", Arguments.createMap().apply {
                    putString("uid", uid)
                    putInt("payloadLength", ndefData.length)
                  })
                } else {
                  Log.w(TAG, "scanTag: No se pudieron leer datos NDEF del MifareUltralight")
                }
              } else {
                Log.w(TAG, "scanTag: CC no válido o no encontrado")
              }
              
              try { mifareUl.close() } catch (_: Exception) {}
            } catch (e: Exception) {
              Log.e(TAG, "scanTag: Error leyendo MifareUltralight: ${e.message}", e)
              try { mifareUl.close() } catch (_: Exception) {}
            }
          } else {
            Log.d(TAG, "scanTag: Tag no es MifareUltralight")
          }
          
          sendTrackingEvent("tag_no_ndef", Arguments.createMap().apply {
            putString("uid", uid)
          })
        }
      } catch (e: Exception) {
        // Log error pero no fallar la lectura
        Log.e(TAG, "scanTag: Error leyendo NDEF: ${e.message}", e)
        sendTrackingEvent("ndef_read_error", Arguments.createMap().apply {
          putString("uid", uid)
          putString("error", e.message ?: "unknown")
        })
      }

      activity.runOnUiThread {
        try { adapter.disableReaderMode(activity) } catch (_: Exception) {}
        scanTimeoutHandler?.let { Handler(Looper.getMainLooper()).removeCallbacks(it) }
        
        Log.i(TAG, "scanTag: Escaneo completado exitosamente")
        sendTrackingEvent("scan_success", Arguments.createMap().apply {
          putString("uid", uid)
          putBoolean("hasNdef", res.hasKey("ndef"))
        })
        promise.resolve(res)
      }
    }

    // Activa ReaderMode con flags para suprimir UI del sistema
    val flags = NfcAdapter.FLAG_READER_NFC_A or
                NfcAdapter.FLAG_READER_NFC_B or
                NfcAdapter.FLAG_READER_NFC_F or
                NfcAdapter.FLAG_READER_NFC_V or
                NfcAdapter.FLAG_READER_NFC_BARCODE or
                NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS or
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK

    try {
      adapter.enableReaderMode(activity, callback, flags, Bundle())
      Log.i(TAG, "scanTag: ReaderMode activado con flags para suprimir UI del sistema")
      sendTrackingEvent("reader_mode_enabled", Arguments.createMap().apply {
        putString("flags", "NO_PLATFORM_SOUNDS | SKIP_NDEF_CHECK")
      })
    } catch (e: Exception) {
      Log.e(TAG, "scanTag: Error activando ReaderMode: ${e.message}", e)
      sendTrackingEvent("reader_mode_error", Arguments.createMap().apply {
        putString("error", e.message ?: "unknown")
      })
      promise.reject("E_ENABLE", e.localizedMessage, e)
      return
    }

    // Timeout
    scanTimeoutHandler = Runnable {
      sendTrackingEvent("scan_timeout_handler_invoked", Arguments.createMap().apply {
        putBoolean("alreadyResolved", scanResolved)
        putDouble("timeoutMs", timeoutMs.toDouble())
      })
      if (!scanResolved) {
        scanResolved = true
        try { adapter.disableReaderMode(activity) } catch (_: Exception) {}
        Log.w(TAG, "scanTag: Timeout alcanzado (${timeoutMs}ms)")
        sendTrackingEvent("scan_timeout", Arguments.createMap().apply {
          putDouble("timeoutMs", timeoutMs.toDouble())
        })
        promise.reject("E_TIMEOUT", "NFC scan timed out")
      }
    }
    Handler(Looper.getMainLooper()).postDelayed(scanTimeoutHandler!!, timeoutMs)
  }

  private fun ByteArray.toHex(): String = joinToString("") { b -> "%02X".format(b) }
}
