# 🏁 Guía de Finalización de Rondas

Esta guía documenta la implementación de la funcionalidad para **finalizar rondas activas** integrada con el sistema de tracking Android.

## 📋 Tabla de Contenidos

- [Overview de la Funcionalidad](#overview-de-la-funcionalidad)
- [Implementación Técnica](#implementación-técnica)
- [Integración con Tracking](#integración-con-tracking)
- [Flujo de Usuario](#flujo-de-usuario)
- [Manejo de Errores](#manejo-de-errores)
- [Testing](#testing)

---

## Overview de la Funcionalidad

### 🎯 Objetivo

Permitir a los usuarios **finalizar rondas activas** desde la pantalla de walk, con integración automática del sistema de tracking Android.

### ✨ Características Implementadas

- ✅ **Botón de finalización** en pantalla de ronda activa
- ✅ **Estados diferentes** según progreso (completa vs incompleta)
- ✅ **Diálogos de confirmación** con opción de agregar notas
- ✅ **Integración automática** con tracking Android
- ✅ **Manejo de errores** con Sentry y notificaciones
- ✅ **Navegación automática** después de finalizar

### 🔗 Endpoint API

```typescript
POST /mobile/rounds/:id/end
Body: { notes?: string }
Response: { ok: boolean, data: { id, status: 'COMPLETED', endISO }, serverTimeISO }
```

---

## Implementación Técnica

### 🗂️ Archivos Creados/Modificados

#### **Nuevo Hook: `useEndRoundWithTracking`**

```typescript
// src/hooks/useEndRoundWithTracking.ts
export function useEndRoundWithTracking({
  roundId,
  roundName, 
  isCompleted,
  completionPercentage
}) {
  // Combina:
  // 1. useEndRound (API)
  // 2. useAndroidUserTracking (detener tracking)
  // 3. Navigation y notificaciones
}
```

#### **Componente Auxiliar: `EndRoundFAB`**

```typescript
// src/components/atoms/EndRoundFAB/index.tsx
export const EndRoundFAB: React.FC<EndRoundFABProps> = ({
  isCompleted,
  isLoading,
  onPress
}) => {
  // FAB adaptativo según estado de la ronda
};
```

#### **Modificación Principal: `walk.tsx`**

```typescript
// src/screens/Rounds/walk.tsx
import {useEndRoundWithTracking} from '@/hooks/useEndRoundWithTracking';

const {
  showEndRoundDialog,
  isEndingRound,
} = useEndRoundWithTracking({
  roundId,
  roundName,
  isCompleted,
  completionPercentage: pct,
});
```

### 🔄 Flujo de Integración

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     USUARIO         │    │    PANTALLA WALK    │    │   HOOK INTEGRADO    │
│   Toca "Finalizar"  │───▶│  showEndRoundDialog │───▶│ useEndRoundWithTracking│
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
                                                                │
                           ┌─────────────────────┐              │
                           │   1. endRound API   │◀─────────────┤
                           └─────────────────────┘              │
                                                                │
                           ┌─────────────────────┐              │
                           │ 2. stopPatrolTracking│◀─────────────┤
                           └─────────────────────┘              │
                                                                │
                           ┌─────────────────────┐              │
                           │ 3. navigation.goBack│◀─────────────┘
                           └─────────────────────┘
```

---

## Integración con Tracking

### 🔗 Conexión Automática

El hook `useEndRoundWithTracking` detecta automáticamente si el tracking está activo y lo detiene:

```typescript
// 1. Finalizar ronda en API
await endRound({ roundId, notes });

// 2. Detener tracking si está activo
if (isTrackingActive) {
  stopPatrolTracking();
  addAppBreadcrumb({
    category: 'tracking.stop',
    data: { reason: 'round_ended', roundId },
    message: 'Tracking detenido automáticamente por fin de ronda',
  });
}
```

### ⚠️ Información al Usuario

El diálogo de confirmación informa al usuario sobre el tracking:

```typescript
const trackingMessage = isTrackingActive 
  ? '\n\n⚠️ Esto también detendrá el tracking de ubicación.'
  : '';

Alert.alert(title, message + trackingMessage, [...]);
```

### 📊 Breadcrumbs de Sentry

Se registran eventos detallados para debugging:

```typescript
addAppBreadcrumb({
  category: 'rounds.end',
  data: { 
    roundId, 
    roundName,
    completionPercentage,
    hasNotes: !!notes,
    wasTracking: isTrackingActive  // 👈 Info de tracking
  },
  message: 'Iniciando finalización de ronda con tracking',
});
```

---

## Flujo de Usuario

### 🎯 Escenario 1: Ronda Completa (100%)

1. **Usuario ve botón verde** "✅ Finalizar"
2. **Toca el botón** → Diálogo: "La ronda está completa. ¿Deseas finalizarla?"
3. **Opciones**:
   - "Cancelar" → Vuelve a la ronda
   - "Agregar Notas" → Prompt para notas → Finalizar
   - "Finalizar" → Finalizar inmediatamente
4. **Resultado**: Ronda marcada como `COMPLETED`, tracking detenido, navegación atrás

### ⚠️ Escenario 2: Ronda Incompleta (<100%)

1. **Usuario ve botón amarillo** "⏹️ Terminar"
2. **Toca el botón** → Diálogo: "La ronda no está completa (X%). ¿Deseas terminarla de todas formas?"
3. **Opciones**:
   - "Cancelar" → Vuelve a la ronda
   - "Agregar Notas" → Prompt para notas → Terminar
   - "Terminar Ahora" (destructive) → Terminar inmediatamente
4. **Resultado**: Ronda marcada como `COMPLETED`, tracking detenido, navegación atrás

### 📱 UI Visual

```
┌─────────────────────────────────────┐
│ Ronda en curso                      │
│ 8/10 completados · 80%              │
│                    ┌──────────────┐ │
│                    │ ⏹️ Terminar  │ │  ← Amarillo (incompleta)
│                    └──────────────┘ │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Ronda en curso                      │
│ 10/10 completados · 100%            │
│                    ┌──────────────┐ │
│                    │ ✅ Finalizar │ │  ← Verde (completa)
│                    └──────────────┘ │
└─────────────────────────────────────┘
```

---

## Manejo de Errores

### 🛡️ Validaciones

```typescript
// 1. Verificar que existe ronda activa
if (!roundId) {
  showErrorToast('No hay ronda activa para terminar');
  return false;
}

// 2. Prevenir múltiples diálogos
if (isEndingRound) return;

// 3. Try-catch completo
try {
  await endRound({ roundId, notes });
  // ... resto de la lógica
} catch (error) {
  // Log detallado + notificación + Sentry
}
```

### 📊 Logging con Sentry

```typescript
Sentry.captureException(error, {
  tags: { 
    feature: 'rounds', 
    action: 'end_with_tracking',
    completion: isCompleted ? 'complete' : 'incomplete'
  },
  extra: { 
    roundId, 
    roundName,
    completionPercentage,
    notes,
    isTrackingActive  // 👈 Estado del tracking
  }
});
```

### 🔄 Recuperación Gradual

- Si falla la API → Error, no navega
- Si falla detener tracking → Warning, continúa con navegación
- Si falla navegación → Usuario queda en pantalla, puede intentar nuevamente

---

## Testing

### 🧪 Casos de Prueba

#### **Test 1: Ronda Completa**

```typescript
describe('Finalizar ronda completa', () => {
  it('should end round and stop tracking', async () => {
    // Setup: Ronda al 100%, tracking activo
    // Action: Tocar botón "Finalizar"
    // Assert: API llamada, tracking detenido, navegación atrás
  });
});
```

#### **Test 2: Ronda Incompleta**

```typescript  
describe('Terminar ronda incompleta', () => {
  it('should show destructive confirmation', async () => {
    // Setup: Ronda al 60%, tracking activo
    // Action: Tocar botón "Terminar"
    // Assert: Diálogo con estilo destructive
  });
});
```

#### **Test 3: Sin Tracking**

```typescript
describe('Finalizar sin tracking activo', () => {
  it('should not try to stop tracking', async () => {
    // Setup: Ronda completa, sin tracking
    // Action: Finalizar ronda
    // Assert: Solo API, no llama stopPatrolTracking
  });
});
```

#### **Test 4: Error de API**

```typescript
describe('Error al finalizar', () => {
  it('should handle API error gracefully', async () => {
    // Setup: Mock API error
    // Action: Intentar finalizar
    // Assert: Error toast, usuario queda en pantalla
  });
});
```

### 🔍 Testing Manual

1. **Iniciar ronda y tracking**

   ```bash
   # 1. Navegar a pantalla de walk
   # 2. Iniciar tracking Android
   # 3. Completar algunos checkpoints
   ```

2. **Probar finalización completa**

   ```bash
   # 1. Completar todos los checkpoints (100%)
   # 2. Verificar botón verde "✅ Finalizar"
   # 3. Tocar botón → Confirmar
   # 4. Verificar: ronda finalizada, tracking detenido
   ```

3. **Probar terminación incompleta**

   ```bash
   # 1. Completar solo algunos checkpoints (<100%)
   # 2. Verificar botón amarillo "⏹️ Terminar"
   # 3. Tocar botón → Confirmar (destructive)
   # 4. Verificar: ronda terminada, tracking detenido
   ```

4. **Probar con notas**

   ```bash
   # 1. Tocar "Agregar Notas"
   # 2. Escribir notas de finalización
   # 3. Confirmar → Verificar notas se envían
   ```

---

## Próximos Pasos Posibles

### 🚀 Mejoras Futuras

1. **Auto-finalización**: Finalizar automáticamente cuando se complete al 100%
2. **Confirmación por tiempo**: Auto-finalizar después de X minutos completa
3. **Estadísticas**: Mostrar tiempo total, distancia recorrida
4. **Reportes**: Generar reporte PDF de la ronda completada
5. **Notificaciones push**: Notificar a supervisores cuando se complete

### 🔧 Configuración Avanzada

```typescript
// Configuración opcional para comportamiento
const ROUND_CONFIG = {
  autoFinishWhenComplete: false,    // Auto-finalizar al 100%
  autoFinishDelayMs: 300000,       // 5 minutos de delay
  requireNotesForIncomplete: true,  // Forzar notas si <100%
  confirmStopTracking: true,       // Confirmar detener tracking
};
```

---

## Resumen

La funcionalidad de finalización de rondas está **completamente implementada** e integrada con el sistema de tracking Android:

✅ **API Integration**: Uso correcto del endpoint `POST /rounds/:id/end`
✅ **Tracking Integration**: Detención automática del tracking Android  
✅ **User Experience**: Botones adaptativos y diálogos informativos
✅ **Error Handling**: Manejo robusto con Sentry y notificaciones
✅ **Navigation**: Flujo completo de ida y vuelta

La implementación está **lista para producción** y proporciona una experiencia fluida para los usuarios finales que realizan rondas. 🎉
