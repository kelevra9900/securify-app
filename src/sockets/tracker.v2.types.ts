import type {SocketEventsMap,SocketHandler} from "./events.base";

// ============================================================================
// ESTRUCTURAS DE DATOS V2
// ============================================================================

export interface LocationV2 {
	accuracy?: number;
	latitude: number;
	longitude: number;
}

export interface LocationUpdateV2 {
	location: LocationV2;
	timestamp: string;
	userId: number;
}

export interface BatchUpdateV2 {
	batchSize: number;
	serverTime: string;
	updates: LocationUpdateV2[];
}

export interface ZoneV2 {
	latitude: number;
	longitude: number;
	radius: number;
}

export interface ZoneEntryV2 {
	distance: number;
	location: LocationV2;
	timestamp: string;
	userId: number;
	zone: ZoneV2;
}

export interface TrackUserV2 {
	documentStatus?: string;
	email: string;
	icon?: string;
	id: number;
	jobPosition?: string;
	lastSeen: string;
	latitude?: number;
	longitude?: number;
	name: string;
	online: boolean;
}

export interface UsersListV2 {
	environmentId: number;
	timestamp: string;
	users: TrackUserV2[];
}

export interface ConnectedDataV2 {
	environmentId: number;
	sectorId: number;
	serverTime: string;
	userId: number;
}

export interface SubscribedDataV2 {
	environmentId: number;
	sectorId: number;
	timestamp: string;
}

// ============================================================================
// PAYLOADS DE EVENTOS (CLIENT -> SERVER)
// ============================================================================

export interface LocationUpdatePayloadV2 {
	accuracy?: number;
	latitude: number;
	longitude: number;
}

export interface BatchLocationPayloadV2 {
	locations: Array<{
		accuracy?: number;
		latitude: number;
		longitude: number;
		userId: number;
	}>;
}

export interface UserWatchPayloadV2 {
	userId: number;
}

export interface ZoneWatchPayloadV2 {
	latitude: number;
	longitude: number;
	radius: number;
}

// ============================================================================
// RESPUESTAS DEL SERVIDOR
// ============================================================================

export interface BaseResponseV2 {
	ok: boolean;
	timestamp?: string;
}

export interface LocationUpdateResponseV2 extends BaseResponseV2 {
	timestamp: string;
}

export interface BatchLocationResponseV2 extends BaseResponseV2 {
	results: Array<{
		error?: string;
		success: boolean;
		userId: number;
	}>;
}

export interface UserWatchResponseV2 extends BaseResponseV2 {
	userId: number;
}

export interface ZoneWatchResponseV2 extends BaseResponseV2 {
	zone: ZoneV2;
}

// ============================================================================
// ERRORES V2
// ============================================================================

export interface TrackerErrorV2 {
	code: 'forbidden' | 'internal_error' | 'rate_limited' | 'unauthorized';
	message?: string;
	retryAfterMs?: number;
}

// ============================================================================
// EVENTOS QUE ESCUCHA EL CLIENTE (SERVER -> CLIENT)
// ============================================================================

export interface TrackerV2ListenEvents extends SocketEventsMap {
	// Conexión y suscripción
	"tracking:connected": SocketHandler<[ConnectedDataV2]>;
	"tracking:subscribed": SocketHandler<[SubscribedDataV2]>;

	// Actualizaciones de ubicación
	"tracking:batch:update": SocketHandler<[BatchUpdateV2]>;
	"tracking:location:updated": SocketHandler<[LocationUpdateV2]>;

	// Zonas geográficas
	"tracking:zone:user_entered": SocketHandler<[ZoneEntryV2]>;

	// Lista de usuarios
	"tracking:users:list": SocketHandler<[UsersListV2]>;

	// Errores
	"error": SocketHandler<[TrackerErrorV2]>;
}

// ============================================================================
// EVENTOS QUE EMITE EL CLIENTE (CLIENT -> SERVER) 
// ============================================================================

export interface TrackerV2EmitEvents extends SocketEventsMap {
	// Suscripción
	"tracking:subscribe": SocketHandler<[],BaseResponseV2>;
	"tracking:unsubscribe": SocketHandler<[],BaseResponseV2>;

	// Actualizaciones de ubicación
	"tracking:location:update": SocketHandler<[LocationUpdatePayloadV2],LocationUpdateResponseV2>;
	"tracking:location:update_batch": SocketHandler<[BatchLocationPayloadV2],BatchLocationResponseV2>;

	// Watch usuarios
	"tracking:user:unwatch": SocketHandler<[UserWatchPayloadV2],BaseResponseV2>;
	"tracking:user:watch": SocketHandler<[UserWatchPayloadV2],UserWatchResponseV2>;

	// Watch zonas
	"tracking:zone:unwatch": SocketHandler<[ZoneWatchPayloadV2],BaseResponseV2>;
	"tracking:zone:watch": SocketHandler<[ZoneWatchPayloadV2],ZoneWatchResponseV2>;

	// Lista de usuarios
	"tracking:users:request": SocketHandler<[],void>;
}

// ============================================================================
// CONFIGURACIÓN Y UTILIDADES
// ============================================================================

export interface TrackingMetricsV2 {
	avgLatency: number;
	lastBatchSize: number;
	lastBatchTime: number;
	reconnects: number;
	totalUpdates: number;
	updatesPerSecond: number;
}

export interface TrackerV2Config {
	batchInterval: number;
	enableMetrics: boolean;
	locationMinInterval: number;
	maxRetries: number;
	namespace: string;
	retryDelay: number;
}

export const DEFAULT_TRACKER_V2_CONFIG: TrackerV2Config = {
	batchInterval: 200,
	enableMetrics: true,
	locationMinInterval: 2000,
	maxRetries: 3,
	namespace: '/tracker/v2',
	retryDelay: 1000,
};


