# 🐛 Bug: Checkpoints Marcados como "Hecho" Después de Reiniciar Ronda

**Fecha:** 4 de Noviembre, 2025  
**Estado:** 🔴 Crítico - Requiere corrección en Backend  
**Reportado por:** Usuario / AI Assistant

---

## 📋 Descripción del Problema

Cuando un usuario reinicia una ronda cíclica usando el botón "Reiniciar Ronda", todos los checkpoints aparecen marcados como **"Hecho"** (done: true) en la nueva vuelta, aunque no han sido escaneados aún.

### **Comportamiento Esperado:**

Al reiniciar una ronda cíclica, los checkpoints deberían resetearse a `done: false` para permitir que el usuario los registre nuevamente en la nueva vuelta.

### **Comportamiento Actual:**

Los checkpoints conservan el estado `done: true` de la vuelta anterior, lo que impide que el usuario pueda escanearlos nuevamente.

---

## 🔍 Causa Raíz

El problema se origina en el **backend** cuando se llama al endpoint:

```
POST /mobile/rounds/:id/restart
```

**Respuesta actual (incorrecta):**
```json
{
  "ok": true,
  "data": {
    "id": 2,
    "status": "IN_PROGRESS",
    "currentLap": 2,
    "startedAtISO": "2025-11-04T10:00:00.000Z",
    "checkpoints": [
      { 
        "id": 1, 
        "name": "Checkpoint Entrada", 
        "latitude": -34.xxx,
        "longitude": -58.xxx,
        "done": true  // ❌ Debería ser false
      },
      { 
        "id": 2, 
        "name": "Checkpoint Pasillo", 
        "latitude": -34.xxx,
        "longitude": -58.xxx,
        "done": true  // ❌ Debería ser false
      }
    ],
    "progress": {
      "done": 2,  // ❌ Debería ser 0
      "total": 2,
      "currentLap": 2,
      "completedLaps": 1
    }
  }
}
```

**Respuesta esperada (correcta):**
```json
{
  "ok": true,
  "data": {
    "id": 2,
    "status": "IN_PROGRESS",
    "currentLap": 2,
    "startedAtISO": "2025-11-04T10:00:00.000Z",
    "checkpoints": [
      { 
        "id": 1, 
        "name": "Checkpoint Entrada", 
        "latitude": -34.xxx,
        "longitude": -58.xxx,
        "done": false  // ✅ Correcto
      },
      { 
        "id": 2, 
        "name": "Checkpoint Pasillo", 
        "latitude": -34.xxx,
        "longitude": -58.xxx,
        "done": false  // ✅ Correcto
      }
    ],
    "progress": {
      "done": 0,  // ✅ Correcto
      "total": 2,
      "currentLap": 2,
      "completedLaps": 1
    }
  }
}
```

---

## 🎯 Solución Requerida (Backend)

### **Endpoint:** `POST /mobile/rounds/:id/restart`

Al ejecutar este endpoint, el backend debe:

1. ✅ Cambiar el estado de la ronda a `IN_PROGRESS`
2. ✅ Incrementar `currentLap` (2, 3, 4...)
3. ✅ Mantener `completedLaps` con el historial
4. **✅ RESETEAR todos los checkpoints a `done: false`** ← **FALTA ESTO**
5. **✅ RESETEAR `progress.done` a `0`** ← **FALTA ESTO**
6. ✅ Crear nueva entrada de inicio de ronda (startedAtISO)

### **Código Backend Sugerido (Pseudocódigo):**

```typescript
// En el controlador de /restart
async function restartRound(roundId: number) {
  const round = await Round.findById(roundId);
  
  // Verificar que esté COMPLETED y sea cíclica
  if (round.status !== 'COMPLETED' || !round.isCyclic) {
    throw new Error('Round cannot be restarted');
  }
  
  // Actualizar estado de la ronda
  round.status = 'IN_PROGRESS';
  round.currentLap = (round.currentLap || 1) + 1;
  round.startedAtISO = new Date().toISOString();
  
  // ⚠️ IMPORTANTE: Resetear checkpoints para la nueva vuelta
  await RoundCheckpointLog.deleteMany({ 
    roundId, 
    lap: round.currentLap 
  });
  
  // O si se usa un campo `done` en el checkpoint:
  await RoundCheckpoint.updateMany(
    { roundId },
    { $set: { done: false, currentLapDone: false } }
  );
  
  await round.save();
  
  // Devolver data actualizada con checkpoints en done: false
  return {
    ok: true,
    data: {
      ...round,
      checkpoints: round.checkpoints.map(cp => ({
        ...cp,
        done: false  // ← Resetear a false
      })),
      progress: {
        done: 0,  // ← Resetear a 0
        total: round.checkpoints.length,
        currentLap: round.currentLap,
        completedLaps: round.completedLaps
      }
    }
  };
}
```

---

## 📱 Impacto en Frontend

### **Antes de la Corrección (Problema):**

```typescript
// Después de reiniciar
active.data.checkpoints = [
  { id: 1, name: "Entrada", done: true },  // ❌ Usuario no puede escanear
  { id: 2, name: "Pasillo", done: true }   // ❌ Usuario no puede escanear
];

// nextCheckpoint será undefined
const nextCheckpoint = checkpoints.find((c) => !c.done); // undefined
```

**UI Resultante:**
- ✅ Todos los checkpoints muestran badge "Hecho"
- ❌ Botones de escaneo deshabilitados
- ❌ Usuario no puede registrar checkpoints en la nueva vuelta
- ❌ Progreso muestra 100% inmediatamente

### **Después de la Corrección (Esperado):**

```typescript
// Después de reiniciar (correcto)
active.data.checkpoints = [
  { id: 1, name: "Entrada", done: false },  // ✅ Usuario puede escanear
  { id: 2, name: "Pasillo", done: false }   // ✅ Usuario puede escanear
];

// nextCheckpoint será el primero
const nextCheckpoint = checkpoints.find((c) => !c.done); // {id: 1, ...}
```

**UI Resultante:**
- ✅ Checkpoints muestran "Pendiente"
- ✅ Botones de escaneo habilitados
- ✅ Usuario puede registrar checkpoints normalmente
- ✅ Progreso muestra 0/N correctamente

---

## 🔄 Flujo Completo (Esperado)

```
1. Usuario completa Vuelta 1
   ├─ Checkpoints: [done: true, done: true]
   ├─ Progress: 2/2 (100%)
   └─ Estado: COMPLETED

2. Usuario toca "Reiniciar Ronda"
   └─ POST /mobile/rounds/2/restart

3. Backend procesa /restart
   ├─ Estado → IN_PROGRESS
   ├─ currentLap → 2
   ├─ completedLaps → 1
   ├─ ✅ RESETEA checkpoints.done → false
   └─ ✅ RESETEA progress.done → 0

4. Frontend recibe respuesta
   └─ Checkpoints: [done: false, done: false] ✅

5. Usuario en WalkScreen (Vuelta 2)
   ├─ Ve checkpoints en "Pendiente" ✅
   ├─ Puede escanear NFC ✅
   └─ Progreso: 0/2 (0%) ✅

6. Usuario completa Vuelta 2
   ├─ Checkpoints: [done: true, done: true]
   ├─ Progress: 2/2 (100%)
   └─ Estado: COMPLETED

7. Usuario puede reiniciar nuevamente (Vuelta 3, 4, 5...)
```

---

## 🧪 Cómo Probar la Corrección

### **Test Manual:**

1. **Setup:**
   ```bash
   # Crear ronda cíclica con 2 checkpoints
   # Completar Vuelta 1 (escanear ambos checkpoints)
   # Finalizar ronda → Estado: COMPLETED
   ```

2. **Reiniciar Ronda:**
   ```bash
   # Tocar "Reiniciar Ronda" en RoundsScreen
   # Navegar a WalkScreen
   ```

3. **Verificar:**
   ```bash
   ✅ Checkpoints deben mostrar "Pendiente" (no "Hecho")
   ✅ Botones "Escanear NFC" deben estar habilitados
   ✅ Progress debe mostrar "0/2 checkpoints · 0%"
   ✅ Badge "Vuelta 2" debe aparecer
   ```

### **Test de API:**

```bash
# 1. Completar Vuelta 1
POST /mobile/rounds/2/checkpoints/1/log
POST /mobile/rounds/2/checkpoints/2/log
POST /mobile/rounds/2/end

# 2. Verificar estado COMPLETED
GET /mobile/rounds/available
# Debe mostrar: status: "COMPLETED", completedLaps: 1

# 3. Reiniciar ronda
POST /mobile/rounds/2/restart

# 4. Verificar respuesta
GET /mobile/rounds/active
# DEBE devolver:
{
  "data": {
    "id": 2,
    "status": "IN_PROGRESS",
    "currentLap": 2,
    "checkpoints": [
      { "id": 1, "done": false },  // ← VERIFICAR false
      { "id": 2, "done": false }   // ← VERIFICAR false
    ],
    "progress": {
      "done": 0,  // ← VERIFICAR 0
      "total": 2,
      "currentLap": 2,
      "completedLaps": 1
    }
  }
}
```

---

## 📊 Endpoints Relacionados

| Endpoint | Método | Debe Resetear Checkpoints |
|----------|--------|---------------------------|
| `/mobile/rounds/:id/start` | POST | N/A (primera vez) |
| `/mobile/rounds/:id/restart` | POST | **✅ SÍ (falta implementar)** |
| `/mobile/rounds/:id/end` | POST | No (finaliza ronda) |
| `/mobile/rounds/active` | GET | N/A (solo lectura) |

---

## ⚠️ Consideraciones Importantes

### **1. Historial de Vueltas**

El backend debe **mantener el historial** de checkpoints completados en vueltas anteriores para estadísticas:

```typescript
// Estructura sugerida en DB
RoundCheckpointLog {
  roundId: 2,
  checkpointId: 1,
  lap: 1,  // ← Identificar la vuelta
  timestampISO: "2025-11-04T09:30:00.000Z",
  latitude: -34.xxx,
  longitude: -58.xxx
}
```

### **2. Campo `done` vs Logs**

El campo `done` en checkpoints debería ser **calculado dinámicamente** basado en la vuelta actual:

```typescript
// Lógica sugerida
checkpoint.done = !!RoundCheckpointLog.findOne({
  roundId,
  checkpointId: checkpoint.id,
  lap: round.currentLap  // ← Solo considerar lap actual
});
```

### **3. Progress Calculation**

```typescript
progress.done = RoundCheckpointLog.countDocuments({
  roundId,
  lap: round.currentLap  // ← Solo contar lap actual
});
```

---

## 🔧 Corrección Frontend Aplicada

Mientras se corrige el backend, se aplicó una corrección en el frontend para evitar llamar a `/start` después de `/restart`:

**Archivo:** `src/screens/Rounds/walk.tsx`

```typescript
// Si ya hay una ronda activa en IN_PROGRESS, solo refetch (no llamar a /start)
// Esto ocurre cuando se viene de un /restart
if (active?.data?.status === 'IN_PROGRESS') {
  addAppBreadcrumb({
    category: 'rounds.refetch',
    data: {roundId: targetRoundId, currentActiveId: active.data.id},
    message: 'Ronda ya está en progreso, solo refetch',
  });
  refetch();
  return;
}
```

**Beneficio:** Evita conflictos al intentar iniciar una ronda que ya fue reiniciada.

---

## 📞 Acción Requerida

**🔴 Equipo Backend debe corregir:**

1. ✅ Modificar handler de `POST /mobile/rounds/:id/restart`
2. ✅ Resetear campo `done` de checkpoints a `false`
3. ✅ Resetear `progress.done` a `0`
4. ✅ Mantener historial de logs por vuelta (lap)
5. ✅ Actualizar tests de integración
6. ✅ Verificar que GET `/mobile/rounds/active` devuelva datos correctos

**📱 Frontend ya está preparado** para recibir la corrección.

---

## 📚 Referencias

- **Documentación:** `/docs/RONDAS_CICLICAS_REINICIO.md`
- **Servicio API:** `/src/data/services/rounds.ts`
- **Hook:** `/src/hooks/rounds/index.ts` (useRestartRound)
- **UI:** `/src/screens/Root/Rounds/index.tsx`
- **WalkScreen:** `/src/screens/Rounds/walk.tsx`

---

**Estado:** 🔴 **Pendiente de corrección en Backend**  
**Prioridad:** 🔥 **Alta** (Bloquea funcionalidad de rondas cíclicas)


