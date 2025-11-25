# Guía de Implementación NFC - Android

## ✅ Verificación Completa de la Implementación

### 📱 **Módulo Nativo Android** (`NfcModule.kt`)

#### **Funcionalidades Implementadas:**

1. **`isSupported()`** - Verifica si el dispositivo tiene NFC
2. **`scanTag()`** - Lee tags NFC con mensaje NDEF
3. **`writeTag()`** - Escribe datos JSON en tags NFC

#### **Lectura NDEF Mejorada:**

- ✅ Manejo correcto de TNF (Type Name Format)
- ✅ Soporte para MIME types (`application/json`)
- ✅ Soporte para Text records (con decodificación correcta del language code)
- ✅ Soporte para URI y tipos externos
- ✅ Fallback robusto para tipos desconocidos
- ✅ Logging de errores para debugging

#### **Escritura NDEF:**

- ✅ Crea registros MIME type `application/json`
- ✅ Soporta tags NDEF formateados
- ✅ Formateo automático de tags vírgenes (NdefFormatable)
- ✅ Validación de capacidad del tag
- ✅ Validación de permisos de escritura

---

### 🎯 **RoundWalkScreen** (`src/screens/Rounds/walk.tsx`)

#### **Flujo de Escaneo:**

1. ✅ **Validación de Geofencing** (30 metros)
   - Obtiene posición GPS actual del dispositivo
   - Calcula distancia al checkpoint esperado
   - Valida que esté dentro del radio permitido

2. ✅ **Apertura de Modal de Escaneo**
   - Muestra interfaz visual al usuario
   - Prepara el módulo NFC para lectura

3. ✅ **Lectura NFC** con timeout de 10 segundos
   - Escanea el tag NFC físico
   - Extrae UID del tag
   - Lee el mensaje NDEF completo

4. ✅ **Parseo del JSON** del payload NDEF
   - Extrae el payload del registro NDEF
   - Parsea el JSON con los datos del checkpoint
   - Valida estructura completa del JSON

5. ✅ **Validación de Checkpoint y Ronda**
   - Verifica que el `roundId` coincida con la ronda activa
   - Verifica que el `checkpointId` coincida con el checkpoint seleccionado
   - Previene registros incorrectos o fraudulentos

6. ✅ **Registro en el Backend con `useRegisterCheckpoint`**
   - Envía datos al servidor:
     - `checkpointId`: ID del checkpoint
     - `roundId`: ID de la ronda
     - `nfcUid`: UID único del tag NFC leído
     - `latitude`: Coordenada GPS del dispositivo
     - `longitude`: Coordenada GPS del dispositivo
   - Muestra toast de éxito al completar

7. ✅ **Logging completo con Sentry**
   - Registra breadcrumbs de todas las etapas
   - Captura errores con contexto completo
   - Incluye datos del NFC y GPS para debugging

#### **Estructura del JSON Esperado:**

```json
{
  "id": 123,
  "roundId": 456,
  "latitude": -33.4489,
  "longitude": -70.6693,
  "name": "Checkpoint Principal"
}
```

---

### 📡 **Datos Enviados al Backend**

Cuando se registra un checkpoint exitosamente, se envían los siguientes datos:

```typescript
{
  checkpointId: number;    // ID del checkpoint validado
  roundId: number;         // ID de la ronda activa
  nfcUid: string;         // UID único del tag NFC (ej: "04:E1:2A:3B")
  latitude: number;       // Coordenada GPS del dispositivo al momento del escaneo
  longitude: number;      // Coordenada GPS del dispositivo al momento del escaneo
}
```

Esto permite al backend:

- ✅ Verificar la autenticidad del tag físico (UID único)
- ✅ Confirmar la ubicación real del guardia
- ✅ Detectar tags clonados o reutilizados
- ✅ Generar reportes de geolocalización precisos
- ✅ Auditar cada registro de checkpoint

#### **Endpoint del Backend:**

```typescript
// POST /users/me/checkpoint
// Body:
{
  checkpointId: 123,
  roundId: 456,
  nfcUid: "04:E1:2A:3B:56:78:90",
  latitude: -33.4489,
  longitude: -70.6693
}

// Response:
{
  success: true,
  data: {
    id: 789,
    checkpointId: 123,
    roundId: 456,
    timestamp: "2025-10-23T14:30:00Z",
    method: "nfc"
  }
}
```

---

### 🔧 **Configuración Android**

#### **1. Permisos (`AndroidManifest.xml`):**

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

✅ **Estado:** Configurado correctamente

#### **2. Registro del Módulo (`TrackingPackage.kt`):**

```kotlin
override fun createNativeModules(rc: ReactApplicationContext): List<NativeModule> =
  listOf(
    TrackingModule(rc), 
    GeolocationModule(rc), 
    NfcModule(rc) // ✅ Registrado
  )
```

#### **3. ProGuard Rules (`proguard-rules.pro`):**

```proguard
# Keep React Native modules
-keep class com.securify.app.NfcModule { *; }
-keep class com.securify.app.TrackingPackage { *; }

# Keep all React Native bridge methods
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Keep NFC classes
-keep class android.nfc.** { *; }
-keep class android.nfc.tech.** { *; }
```

✅ **Estado:** Configurado correctamente

---

### 🧪 **Cómo Probar**

#### **Preparación:**

1. **Dispositivo físico** con NFC (los emuladores no soportan NFC)
2. **Tags NFC programables** (NTAG213, NTAG215, NTAG216, Mifare Classic, etc.)
3. **App instalada** en modo debug o release

#### **Prueba de Lectura:**

1. Inicia la app y navega a una ronda activa
2. Selecciona un checkpoint para escanear
3. Acerca el teléfono al tag NFC
4. El módulo detectará el tag y leerá el mensaje NDEF
5. La app validará el JSON y registrará el checkpoint

#### **Prueba de Escritura (Opcional):**

Puedes usar la función `writeCheckpointTag()` desde JavaScript:

```typescript
import { writeCheckpointTag } from '@/utils/nfc';

const payload = JSON.stringify({
  id: 123,
  roundId: 456,
  latitude: -33.4489,
  longitude: -70.6693,
  name: "Checkpoint Principal"
});

await writeCheckpointTag(payload, { timeoutMs: 10000 });
```

---

### 📊 **Formato del Tag NFC**

#### **Estructura NDEF:**

```
TNF: MIME Media (0x02)
Type: "application/json"
Payload: JSON string con los datos del checkpoint
```

#### **Ejemplo de Payload:**

```json
{
  "id": 1,
  "roundId": 10,
  "latitude": -33.4489,
  "longitude": -70.6693,
  "name": "Entrada Principal"
}
```

---

### 🐛 **Debugging**

#### **Logs de Android:**

```bash
# Ver logs del módulo NFC
adb logcat | grep NfcModule

# Ver todos los logs de la app
adb logcat | grep com.securify.app
```

#### **Errores Comunes:**

1. **`E_UNSUPPORTED`**: El dispositivo no tiene NFC o no está habilitado
   - **Solución**: Activar NFC en Settings → Connections → NFC

2. **`E_TIMEOUT`**: No se detectó ningún tag en el tiempo especificado
   - **Solución**: Acercar más el tag al teléfono

3. **`E_ACTIVITY`**: No hay actividad disponible
   - **Solución**: Asegurarse de que la app esté en foreground

4. **`Tag is read-only`**: El tag está protegido contra escritura
   - **Solución**: Usar un tag escribible

5. **Payload inválido**: El JSON no tiene la estructura esperada
   - **Solución**: Verificar que el tag contenga un JSON válido con todos los campos

---

### 📝 **API TypeScript**

#### **Funciones Disponibles:**

```typescript
// Verificar soporte NFC
const supported = await isNfcSupported();

// Leer tag NFC
const result = await scanCheckpointTag(10000);
// result = { uid: "04:E1:2A:3B", tech: "...", ndef: { type: "application/json", payload: "{...}" } }

// Escribir tag NFC
await writeCheckpointTag(jsonPayload, { timeoutMs: 10000 });
```

---

### ✅ **Checklist de Verificación**

- [x] Módulo NFC implementado y registrado
- [x] Permisos configurados en AndroidManifest
- [x] ProGuard rules configuradas
- [x] Lectura NDEF robusta con soporte para múltiples TNF
- [x] Escritura NDEF con formato JSON
- [x] Integración con RoundWalkScreen
- [x] Validación de geofencing
- [x] Validación de JSON payload
- [x] Logging con Sentry
- [x] Manejo de errores completo
- [x] API TypeScript documentada

---

## 🚀 **Estado: Listo para Producción**

La implementación NFC para Android está completa y optimizada. Todos los casos de uso están cubiertos y el código está preparado para builds de release con ProGuard habilitado.
