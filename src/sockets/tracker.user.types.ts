import type {SocketEventsMap,SocketHandler} from "./events.base";

// ============================================================================
// TIPOS PARA USUARIOS FINALES - ENFOQUE EN ENVÍO DE UBICACIONES
// ============================================================================

export interface UserLocationV2 {
	accuracy?: number;
	bearing?: number;
	latitude: number;
	longitude: number;
	speed?: number;
	timestamp?: number;
}

export interface LocationUpdateResponseV2 {
	ok: boolean;
	timestamp: string;
	userId?: number;
}

export interface UserConnectionDataV2 {
	environmentId: number;
	sectorId?: number;
	serverTime: string;
	userId: number;
}

export interface TrackerErrorV2 {
	code: 'forbidden' | 'internal_error' | 'rate_limited' | 'unauthorized';
	message?: string;
	retryAfterMs?: number;
}

// ============================================================================
// EVENTOS SIMPLIFICADOS PARA USUARIOS FINALES
// ============================================================================

/** Eventos que escucha el cliente (Server → Client) */
export interface UserTrackerV2ListenEvents extends SocketEventsMap {
	// Conexión
	"tracking:connected": SocketHandler<[UserConnectionDataV2]>;

	// Confirmación de ubicaciones
	"tracking:location:received": SocketHandler<[{timestamp: string; userId: number}]>;

	// Errores
	"error": SocketHandler<[TrackerErrorV2]>;
}

/** Eventos que emite el cliente (Client → Server) */
export interface UserTrackerV2EmitEvents extends SocketEventsMap {
	// Envío de ubicación (función principal)
	"tracking:location:update": SocketHandler<[UserLocationV2]>;

	// Heartbeat para mantener conexión
	"tracking:heartbeat": SocketHandler<[]>;
}

// ============================================================================
// CONFIGURACIÓN OPTIMIZADA PARA USUARIOS
// ============================================================================

export interface UserTrackerV2Config {
	enableMetrics: boolean;       // Métricas de rendimiento
	enableRetry: boolean;         // Retry automático en errores
	heartbeatInterval: number;    // Interval de heartbeat
	locationMinInterval: number;  // Intervalo mínimo entre ubicaciones
	maxRetries: number;           // Máximo número de reintentos
	namespace: string;
	retryDelay: number;          // Delay entre reintentos
}

export const DEFAULT_USER_TRACKER_CONFIG: UserTrackerV2Config = {
	enableMetrics: __DEV__,      // Solo en desarrollo
	enableRetry: true,
	heartbeatInterval: 30_000,    // Heartbeat cada 30 segundos
	locationMinInterval: 3000,    // 3 segundos mínimo (menos agresivo)
	maxRetries: 3,
	namespace: '/tracker/v2',
	retryDelay: 2000,            // 2 segundos de delay
};

// ============================================================================
// MÉTRICAS SIMPLIFICADAS
// ============================================================================

export interface UserTrackingMetrics {
	avgLatency: number;
	errors: number;
	lastLocationTime: number;
	locationsConfirmed: number;
	locationsSubmitted: number;
	reconnects: number;
}

// ============================================================================
// INTEGRACIÓN CON SISTEMA NATIVO
// ============================================================================

export interface NativeTrackingIntegration {
	/** Habilitar tracking nativo en segundo plano */
	enableNativeBackground: boolean;
	/** Habilitar WebSocket para confirmaciones inmediatas */
	enableRealtimeConfirmation: boolean;
	/** Configuración del servicio nativo Android */
	nativeConfig: {
		fastestMs: number;         // Fastest interval
		intervalMs: number;        // Intervalo del LocationRequest
		minDistanceMeters: number; // Distancia mínima para actualizar
		priority: 'BALANCED' | 'HIGH_ACCURACY' | 'LOW_POWER';
	};
}

export const ANDROID_USER_CONFIG: NativeTrackingIntegration = {
	enableNativeBackground: true,
	enableRealtimeConfirmation: true,
	nativeConfig: {
		fastestMs: 10_000,          // Mínimo 10 segundos
		intervalMs: 30_000,         // 30 segundos para historial
		minDistanceMeters: 50,     // 50 metros mínimo
		priority: 'HIGH_ACCURACY',
	},
};

export const ANDROID_BATTERY_SAVER_CONFIG: NativeTrackingIntegration = {
	enableNativeBackground: true,
	enableRealtimeConfirmation: false, // Solo nativo, sin WebSocket
	nativeConfig: {
		fastestMs: 60_000,          // Mínimo 1 minuto
		intervalMs: 120_000,        // 2 minutos
		minDistanceMeters: 200,    // 200 metros
		priority: 'BALANCED',
	},
};
