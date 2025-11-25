# 🐛 Resumen: Bug al Reiniciar Rondas Cíclicas

## El Problema

Cuando reinicias una ronda cíclica, todos los checkpoints aparecen como **"Hecho"** aunque no los hayas escaneado en la nueva vuelta.

---

## ¿Por Qué Ocurre?

**Es un problema del Backend** 🔴

Cuando se llama a `POST /mobile/rounds/:id/restart`, el backend NO está reseteando el campo `done` de los checkpoints a `false`.

### Lo que hace actualmente (❌ Incorrecto):

```json
POST /restart → Respuesta:
{
  "checkpoints": [
    { "id": 1, "done": true },  ← Sigue en true de la vuelta anterior
    { "id": 2, "done": true }   ← Sigue en true de la vuelta anterior
  ],
  "progress": {
    "done": 2,      ← Debería ser 0
    "total": 2,
    "currentLap": 2
  }
}
```

### Lo que debería hacer (✅ Correcto):

```json
POST /restart → Respuesta:
{
  "checkpoints": [
    { "id": 1, "done": false },  ← Reseteado a false
    { "id": 2, "done": false }   ← Reseteado a false
  ],
  "progress": {
    "done": 0,      ← Reseteado a 0
    "total": 2,
    "currentLap": 2
  }
}
```

---

## ¿Qué Afecta?

### En la UI:
- ❌ Checkpoints muestran badge **"Hecho"**
- ❌ Botones de escaneo **deshabilitados**
- ❌ Progreso muestra **100%** inmediatamente
- ❌ Usuario **no puede escanear** en la nueva vuelta

### Flujo Roto:
```
Usuario reinicia ronda (Vuelta 2)
  └─ Todos los checkpoints: "Hecho" ❌
  └─ Botones: Deshabilitados ❌
  └─ Progreso: 2/2 (100%) ❌
  └─ No puede escanear NFC ❌
```

---

## ✅ Lo Que Ya Se Corrigió (Frontend)

Corregí un problema en `WalkScreen` donde intentaba llamar a `/start` después de un `/restart`. Ahora solo hace `refetch` cuando la ronda ya está en progreso.

**Archivo:** `src/screens/Rounds/walk.tsx` (líneas 67-76)

```typescript
// Si ya hay una ronda activa en IN_PROGRESS, solo refetch (no llamar a /start)
if (active?.data?.status === 'IN_PROGRESS') {
  refetch();
  return;
}
```

---

## 🔴 Lo Que Falta Corregir (Backend)

**Endpoint:** `POST /mobile/rounds/:id/restart`

El backend debe:

1. ✅ Cambiar estado a `IN_PROGRESS` (ya lo hace)
2. ✅ Incrementar `currentLap` (ya lo hace)
3. **❌ RESETEAR checkpoints.done a false** ← **FALTA ESTO**
4. **❌ RESETEAR progress.done a 0** ← **FALTA ESTO**

### Código Backend Sugerido:

```typescript
async function restartRound(roundId: number) {
  const round = await Round.findById(roundId);
  
  // Actualizar estado
  round.status = 'IN_PROGRESS';
  round.currentLap = (round.currentLap || 1) + 1;
  
  // ⚠️ IMPORTANTE: Resetear checkpoints
  await RoundCheckpoint.updateMany(
    { roundId },
    { $set: { done: false } }  // ← Resetear a false
  );
  
  await round.save();
  
  return {
    data: {
      ...round,
      checkpoints: round.checkpoints.map(cp => ({
        ...cp,
        done: false  // ← Asegurar que venga en false
      })),
      progress: {
        done: 0,  // ← Resetear a 0
        total: round.checkpoints.length,
        currentLap: round.currentLap
      }
    }
  };
}
```

---

## 🧪 Cómo Verificar la Corrección

### Test Rápido:

1. **Completa una ronda cíclica** (escanea todos los checkpoints)
2. **Finaliza la ronda** (botón "Finalizar")
3. **Reinicia la ronda** (botón "Reiniciar Ronda")
4. **Verifica en WalkScreen:**
   - ✅ Checkpoints deben decir **"Pendiente"** (no "Hecho")
   - ✅ Botones **"Escanear NFC"** habilitados
   - ✅ Progreso: **"0/N checkpoints · 0%"**

### Test de API:

```bash
# 1. Completar y finalizar vuelta 1
POST /mobile/rounds/2/end

# 2. Reiniciar ronda
POST /mobile/rounds/2/restart

# 3. Obtener ronda activa
GET /mobile/rounds/active

# 4. VERIFICAR en la respuesta:
{
  "checkpoints": [
    { "done": false },  // ← Debe ser false
    { "done": false }   // ← Debe ser false
  ],
  "progress": {
    "done": 0  // ← Debe ser 0
  }
}
```

---

## 📄 Documentación Completa

Ver documento detallado: **`/docs/BUG_RESTART_CHECKPOINTS_DONE.md`**

---

## Acción Requerida

**🔴 Pasa este reporte al equipo de Backend** para que corrijan el endpoint `/restart`

**📱 Frontend ya está listo** para recibir la corrección.

---

**Prioridad:** 🔥 **Alta** - Bloquea funcionalidad de rondas cíclicas


