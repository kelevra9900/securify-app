# 📊 NFC Tracking con Sentry

Este documento describe el sistema de tracking implementado para monitorear el flujo de escaneo NFC en Android.

## 🎯 Objetivo

Capturar eventos detallados del proceso de escaneo NFC desde el módulo nativo de Android y enviarlos a Sentry como breadcrumbs para facilitar el debugging y monitoreo de la experiencia del usuario.

## 🔄 Flujo de Tracking

### Arquitectura

```
Android (NfcModule.kt) → Native Event → React Native (useNfcTracking) → Sentry
```

1. **NfcModule.kt**: Emite eventos nativos durante el proceso de escaneo
2. **useNfcTracking**: Hook que escucha los eventos nativos
3. **Sentry**: Registra los eventos como breadcrumbs y alertas

## 📝 Eventos Disponibles

### Eventos de Lectura (Scan)

#### 1. `scan_started`

**Cuándo**: Al iniciar el proceso de escaneo NFC
**Datos**:

- `timeoutMs`: Tiempo de espera configurado en milisegundos

**Nivel**: `debug`

---

### 2. `scan_error`

**Cuándo**: Error al intentar iniciar el escaneo
**Datos**:

- `error`: Tipo de error (`no_activity`, `nfc_not_supported`, `nfc_disabled`)

**Nivel**: `error`

**Casos comunes**:

- `no_activity`: La actividad de Android no está disponible
- `nfc_not_supported`: El dispositivo no tiene hardware NFC
- `nfc_disabled`: NFC está deshabilitado en configuración

---

### 3. `reader_mode_enabled`

**Cuándo**: Se activa exitosamente el ReaderMode de Android
**Datos**:

- `flags`: Flags utilizados (`NO_PLATFORM_SOUNDS | SKIP_NDEF_CHECK`)

**Nivel**: `debug`

**Nota**: Los flags suprimen la UI nativa del sistema para dar control total a la app.

---

### 4. `reader_mode_error`

**Cuándo**: Error al activar el ReaderMode
**Datos**:

- `error`: Descripción del error

**Nivel**: `error`

---

### 5. `tag_detected`

**Cuándo**: Se detecta un tag NFC cerca del dispositivo
**Datos**:

- `uid`: Identificador único del tag (formato hexadecimal)
- `tech`: Tecnologías soportadas por el tag (ej: `MifareClassic,NfcA`)

**Nivel**: `info`

---

### 6. `ndef_read_success`

**Cuándo**: Se lee exitosamente el contenido NDEF del tag
**Datos**:

- `uid`: Identificador del tag
- `type`: Tipo MIME del contenido (ej: `application/json`)
- `payloadLength`: Tamaño del payload en bytes
- `tnf`: Type Name Format del registro NDEF

**Nivel**: `info`

---

### 7. `tag_no_ndef`

**Cuándo**: El tag no soporta NDEF o está vacío
**Datos**:

- `uid`: Identificador del tag

**Nivel**: `debug`

---

### 8. `ndef_read_error`

**Cuándo**: Error al intentar leer el contenido NDEF
**Datos**:

- `uid`: Identificador del tag
- `error`: Descripción del error

**Nivel**: `error`

---

### 9. `scan_success`

**Cuándo**: Se completa exitosamente todo el proceso de escaneo
**Datos**:

- `uid`: Identificador del tag
- `hasNdef`: `true` si se leyó contenido NDEF, `false` si solo se obtuvo el UID

**Nivel**: `info`

---

#### 10. `scan_timeout`

**Cuándo**: Se alcanza el tiempo límite sin detectar ningún tag
**Datos**:

- `timeoutMs`: Tiempo de espera que se alcanzó

**Nivel**: `warning`

---

### Eventos de Escritura (Write)

#### 11. `write_started`

**Cuándo**: Al iniciar el proceso de escritura NFC
**Datos**:

- `timeoutMs`: Tiempo de espera configurado
- `payloadSize`: Tamaño del payload en bytes

**Nivel**: `debug`

---

#### 12. `write_error`

**Cuándo**: Error al intentar iniciar la escritura
**Datos**:

- `error`: Tipo de error (`no_activity`, `nfc_not_supported`, `nfc_disabled`)

**Nivel**: `error`

---

#### 13. `write_reader_mode_enabled`

**Cuándo**: Se activa exitosamente el ReaderMode para escritura
**Datos**:

- `flags`: Flags utilizados

**Nivel**: `debug`

---

#### 14. `write_tag_detected`

**Cuándo**: Se detecta un tag NFC para escritura
**Datos**:

- `uid`: Identificador único del tag

**Nivel**: `info`

**Nota**: Se activa vibración háptica de 50ms.

---

#### 15. `write_operation_error`

**Cuándo**: Error durante la operación de escritura en el tag
**Datos**:

- `uid`: Identificador del tag
- `error`: Descripción del error (ej: "Tag is read-only", "Payload too large")

**Nivel**: `error`

---

#### 16. `write_success`

**Cuándo**: Se completa exitosamente la escritura
**Datos**:

- `uid`: Identificador del tag

**Nivel**: `info`

---

#### 17. `write_timeout`

**Cuándo**: Se alcanza el tiempo límite sin detectar ningún tag
**Datos**:

- `timeoutMs`: Tiempo de espera que se alcanzó

**Nivel**: `warning`

## 🔍 Logs de Android

Además de los eventos de Sentry, el módulo genera logs nativos en Android con la etiqueta `NfcModule`:

```kotlin
Log.d(TAG, "scanTag: Iniciando escaneo NFC (timeout: 10000ms)")
Log.i(TAG, "scanTag: Tag detectado - UID: ABC123, Tech: MifareClassic")
Log.e(TAG, "scanTag: Error leyendo NDEF: IOException")
```

### Ver logs en desarrollo

```bash
# Ver todos los logs del módulo NFC
adb logcat | grep NfcModule

# Ver solo errores
adb logcat *:E | grep NfcModule

# Ver logs en tiempo real con filtro
adb logcat -s NfcModule:*
```

## 📱 Integración en React Native

### Uso del hook

El hook `useNfcTracking` se integra automáticamente en las pantallas que usan NFC:

```typescript
import {useNfcTracking} from '@/hooks/useNfcTracking';

export default function RoundWalkScreen() {
  // Activa el tracking de eventos NFC
  useNfcTracking();
  
  // ... resto del componente
}
```

### Ejemplo de flujo completo

```
1. Usuario toca botón de escaneo
   → scan_started (timeoutMs: 10000)
   → reader_mode_enabled

2. Usuario acerca el teléfono al tag
   → tag_detected (uid: "04ABC123", tech: "MifareClassic,NfcA")

3. Se lee el contenido
   → ndef_read_success (type: "application/json", payloadLength: 156)

4. Se completa el proceso
   → scan_success (uid: "04ABC123", hasNdef: true)
```

## 📳 Feedback Háptico

El sistema genera una vibración de 50ms cuando detecta un tag NFC, proporcionando feedback táctil inmediato al usuario.

**Cuándo se activa**:

- Al detectar tag para lectura (`tag_detected`)
- Al detectar tag para escritura (`write_tag_detected`)

**Requisitos**:

- Permiso `VIBRATE` en `AndroidManifest.xml` ✅
- Funciona en todas las versiones de Android (21+)

## 🐛 Debugging

### En Sentry

1. Ve a **Issues** o **Performance**
2. Busca eventos con tag `feature: nfc`
3. Revisa el trail de breadcrumbs con categoría `nfc.native`

### Breadcrumbs en Sentry

Los breadcrumbs aparecerán así:

```
[nfc.native] NFC: scan_started { timeoutMs: 10000 }
[nfc.native] NFC: reader_mode_enabled { flags: "NO_PLATFORM_SOUNDS | SKIP_NDEF_CHECK" }
[nfc.native] NFC: tag_detected { uid: "04ABC123", tech: "MifareClassic" }
[nfc.native] NFC: ndef_read_success { type: "application/json", payloadLength: 156 }
[nfc.native] NFC: scan_success { uid: "04ABC123", hasNdef: true }
```

## ⚠️ Eventos de Error

Los siguientes eventos se capturan también como mensajes en Sentry (no solo breadcrumbs):

**Lectura**:

- `scan_error`
- `reader_mode_error`
- `ndef_read_error`
- `scan_timeout`

**Escritura**:

- `write_error`
- `write_reader_mode_error`
- `write_operation_error`
- `write_timeout`

Esto permite crear alertas y notificaciones cuando ocurren problemas recurrentes.

## 🚀 Próximos Pasos

- [ ] Agregar métricas de tiempo entre eventos
- [ ] Trackear tasa de éxito/fallo por dispositivo
- [ ] Crear dashboard en Sentry para monitoreo en tiempo real
- [x] ~~Agregar tracking para operaciones de escritura (writeTag)~~ ✅ Completado
- [ ] Configuración de intensidad de vibración
- [ ] Tracking de tags por ubicación geográfica

## 📞 Soporte

Para más información sobre los eventos o agregar nuevos puntos de tracking, contactar al equipo de desarrollo.
