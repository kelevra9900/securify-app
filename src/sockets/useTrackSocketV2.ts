/* eslint-disable no-console */
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {AppState} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import type {Socket} from "socket.io-client";
import {createNamespaceSocket} from "./factory";
import type {
	BatchLocationPayloadV2,
	BatchUpdateV2,
	ConnectedDataV2,
	DEFAULT_TRACKER_V2_CONFIG,
	LocationUpdatePayloadV2,
	LocationUpdateV2,
	SubscribedDataV2,
	TrackerErrorV2,
	TrackerV2Config,
	TrackerV2EmitEvents,
	TrackerV2ListenEvents,
	TrackingMetricsV2,
	TrackUserV2,
	UsersListV2,
	UserWatchPayloadV2,
	ZoneEntryV2,
	ZoneV2,
	ZoneWatchPayloadV2,
} from "./tracker.v2.types";

/**
 * Hook avanzado para WebSocket Tracker API v2
 * 
 * Características principales:
 * ✅ Namespace /tracker/v2
 * ✅ Batch updates cada 200ms
 * ✅ Watch usuarios específicos
 * ✅ Watch zonas geográficas (geofencing)
 * ✅ Rate limiting inteligente
 * ✅ Métricas de rendimiento
 * ✅ Auto-reconexión robusta
 * ✅ Manejo de errores avanzado
 */
export function useTrackSocketV2(
	token: null | string,
	config: Partial<TrackerV2Config> = {}
) {
	const finalConfig = useMemo(() => ({
		...DEFAULT_TRACKER_V2_CONFIG,
		...config
	}),[config]);

	// ============================================================================
	// SOCKET Y CONEXIÓN
	// ============================================================================

	const socket = useMemo(() => {
		if (!token) {return null;}
		return createNamespaceSocket<TrackerV2ListenEvents,TrackerV2EmitEvents>(
			finalConfig.namespace,
			token
		) as Socket<TrackerV2ListenEvents,TrackerV2EmitEvents>;
	},[token,finalConfig.namespace]);

	const [isConnected,setIsConnected] = useState<boolean>(false);
	const [isSubscribed,setIsSubscribed] = useState<boolean>(false);
	const [connectionData,setConnectionData] = useState<ConnectedDataV2 | null>(null);
	const [lastError,setLastError] = useState<null | TrackerErrorV2>(null);

	// ============================================================================
	// ESTADO DE DATOS
	// ============================================================================

	const [batchUpdates,setBatchUpdates] = useState<LocationUpdateV2[]>([]);
	const [usersList,setUsersList] = useState<Map<number,TrackUserV2>>(new Map());
	const [watchedUsers,setWatchedUsers] = useState<Set<number>>(new Set());
	const [watchedZones,setWatchedZones] = useState<ZoneV2[]>([]);

	// ============================================================================
	// MÉTRICAS Y REFERENCIAS
	// ============================================================================

	const metricsRef = useRef<TrackingMetricsV2>({
		avgLatency: 0,
		lastBatchSize: 0,
		lastBatchTime: 0,
		reconnects: 0,
		totalUpdates: 0,
		updatesPerSecond: 0,
	});

	const lastLocationSentRef = useRef<number>(0);
	const reconnectAttemptsRef = useRef<number>(0);
	const pendingRetryRef = useRef<NodeJS.Timeout | null>(null);

	// ============================================================================
	// CONFIGURACIÓN DE SOCKET Y EVENTOS
	// ============================================================================

	useEffect(() => {
		if (!socket) {return;}

		// Eventos de conexión
		const onConnect = () => {
			console.log("[/tracker/v2] ✅ Conectado:",socket.id);
			setIsConnected(true);
			setLastError(null);
			reconnectAttemptsRef.current = 0;

			// Auto-suscribirse después de conectar
			socket.emit("tracking:subscribe",(response) => {
				if (response?.ok) {
					console.log("[/tracker/v2] 📡 Auto-suscrito exitosamente");
				}
			});
		};

		const onDisconnect = (reason?: string) => {
			console.log("[/tracker/v2] 🔴 Desconectado:",reason);
			setIsConnected(false);
			setIsSubscribed(false);
			metricsRef.current.reconnects++;
		};

		const onConnectError = (err: unknown) => {
			const anyErr = err as {data?: unknown; description?: string; message?: string};
			console.log("[/tracker/v2] ❌ Error de conexión:",anyErr?.message ?? anyErr?.description ?? anyErr);
			if (anyErr?.data) {
				console.log("[/tracker/v2] Error data:",anyErr.data);
			}
		};

		// Eventos específicos v2
		const onTrackingConnected = (data: ConnectedDataV2) => {
			console.log("[/tracker/v2] 🔌 Tracking conectado:",data);
			setConnectionData(data);
		};

		const onTrackingSubscribed = (data: SubscribedDataV2) => {
			console.log("[/tracker/v2] 📡 Suscrito a tracking:",data);
			setIsSubscribed(true);

			// Solicitar lista inicial de usuarios
			socket.emit("tracking:users:request");
		};

		const onBatchUpdate = (data: BatchUpdateV2) => {
			console.log(`[/tracker/v2] 📦 Batch update: ${data.batchSize} actualizaciones`);

			// Actualizar métricas
			metricsRef.current.totalUpdates += data.batchSize;
			metricsRef.current.lastBatchSize = data.batchSize;
			metricsRef.current.lastBatchTime = Date.now();

			// Calcular latencia
			const serverTime = new Date(data.serverTime).getTime();
			const clientTime = Date.now();
			const latency = clientTime - serverTime;
			metricsRef.current.avgLatency = (metricsRef.current.avgLatency + latency) / 2;

			// Guardar updates para el componente
			setBatchUpdates(prev => [...prev,...data.updates]);

			// Actualizar mapa de usuarios con las nuevas ubicaciones
			setUsersList(prev => {
				const newMap = new Map(prev);
				data.updates.forEach(update => {
					const user = newMap.get(update.userId);
					if (user) {
						newMap.set(update.userId,{
							...user,
							lastSeen: update.timestamp,
							latitude: update.location.latitude,
							longitude: update.location.longitude,
						});
					}
				});
				return newMap;
			});
		};

		const onLocationUpdated = (data: LocationUpdateV2) => {
			console.log(`[/tracker/v2] 📍 Usuario ${data.userId} actualizado:`,data.location);

			// Solo para usuarios que estamos watching específicamente
			if (watchedUsers.has(data.userId)) {
				setBatchUpdates(prev => [...prev,data]);
			}
		};

		const onZoneUserEntered = (data: ZoneEntryV2) => {
			console.log(`[/tracker/v2] 🗺️ Usuario ${data.userId} entró en zona:`,data.zone);
			// Aquí puedes agregar lógica para notificaciones push o alertas
		};

		const onUsersList = (data: UsersListV2) => {
			console.log(`[/tracker/v2] 📋 Lista completa: ${data.users.length} usuarios`);

			// Reemplazar mapa completo
			const newMap = new Map<number,TrackUserV2>();
			data.users.forEach(user => {
				newMap.set(user.id,user);
			});
			setUsersList(newMap);
		};

		const onError = (error: TrackerErrorV2) => {
			console.error("[/tracker/v2] ❌ Error del servidor:",error);
			setLastError(error);

			// Manejo de rate limiting
			if (error.code === 'rate_limited' && error.retryAfterMs) {
				console.log(`[/tracker/v2] ⏳ Rate limited, reintentando en ${error.retryAfterMs}ms`);

				if (pendingRetryRef.current) {
					clearTimeout(pendingRetryRef.current);
				}

				pendingRetryRef.current = setTimeout(() => {
					console.log("[/tracker/v2] 🔄 Reintentando después de rate limit");
					pendingRetryRef.current = null;
				},error.retryAfterMs);
			}
		};

		// Registrar todos los event listeners
		socket.on("connect",onConnect);
		socket.on("disconnect",onDisconnect);
		socket.on("connect_error",onConnectError);
		socket.on("tracking:connected",onTrackingConnected);
		socket.on("tracking:subscribed",onTrackingSubscribed);
		socket.on("tracking:batch:update",onBatchUpdate);
		socket.on("tracking:location:updated",onLocationUpdated);
		socket.on("tracking:zone:user_entered",onZoneUserEntered);
		socket.on("tracking:users:list",onUsersList);
		socket.on("error",onError);

		// Conectar si no está conectado
		if (!socket.connected) {
			socket.connect();
		}

		// Auto-reconexión en cambio de estado de la app
		const appStateSubscription = AppState.addEventListener("change",(nextAppState) => {
			if (nextAppState === "active" && !socket.connected) {
				console.log("[/tracker/v2] 📱 App activa, reconectando...");
				socket.connect();
			}
		});

		// Auto-reconexión según estado de la red
		const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
			if (state.isConnected && !socket.connected) {
				console.log("[/tracker/v2] 📶 Red disponible, reconectando...");
				socket.connect();
			} else if (!state.isConnected && socket.connected) {
				console.log("[/tracker/v2] 📵 Red perdida, desconectando...");
				socket.disconnect();
			}
		});

		return () => {
			// Cleanup
			socket.off("connect",onConnect);
			socket.off("disconnect",onDisconnect);
			socket.off("connect_error",onConnectError);
			socket.off("tracking:connected",onTrackingConnected);
			socket.off("tracking:subscribed",onTrackingSubscribed);
			socket.off("tracking:batch:update",onBatchUpdate);
			socket.off("tracking:location:updated",onLocationUpdated);
			socket.off("tracking:zone:user_entered",onZoneUserEntered);
			socket.off("tracking:users:list",onUsersList);
			socket.off("error",onError);

			appStateSubscription.remove();
			netInfoUnsubscribe();

			if (pendingRetryRef.current) {
				clearTimeout(pendingRetryRef.current);
			}

			socket.removeAllListeners();
			socket.disconnect();
		};
	},[socket,watchedUsers]);

	// ============================================================================
	// FUNCIONES PÚBLICAS
	// ============================================================================

	/**
	 * Enviar ubicación actual con throttling inteligente
	 */
	const sendLocation = useCallback((
		latitude: number,
		longitude: number,
		accuracy?: number
	) => {
		if (!socket || !isConnected) {
			console.warn("[/tracker/v2] ⚠️ Socket no conectado");
			return false;
		}

		// Throttling
		const now = Date.now();
		if (now - lastLocationSentRef.current < finalConfig.locationMinInterval) {
			return false;
		}

		lastLocationSentRef.current = now;

		const payload: LocationUpdatePayloadV2 = {
			accuracy,
			latitude,
			longitude,
		};

		console.log("[/tracker/v2] 📍 Enviando ubicación:",payload);

		socket.emit("tracking:location:update",payload,(response) => {
			if (response?.ok) {
				console.log("[/tracker/v2] ✅ Ubicación enviada:",response.timestamp);
			} else {
				console.error("[/tracker/v2] ❌ Error enviando ubicación:",response);
			}
		});

		return true;
	},[socket,isConnected,finalConfig.locationMinInterval]);

	/**
	 * Batch update de múltiples ubicaciones (solo admin)
	 */
	const sendBatchLocations = useCallback((locations: BatchLocationPayloadV2['locations']) => {
		if (!socket || !isConnected) {
			console.warn("[/tracker/v2] ⚠️ Socket no conectado para batch");
			return;
		}

		const payload: BatchLocationPayloadV2 = {locations};

		console.log(`[/tracker/v2] 📦 Enviando batch de ${locations.length} ubicaciones`);

		socket.emit("tracking:location:update_batch",payload,(response) => {
			if (response?.ok) {
				console.log("[/tracker/v2] ✅ Batch enviado:",response.results);
			} else {
				console.error("[/tracker/v2] ❌ Error enviando batch:",response);
			}
		});
	},[socket,isConnected]);

	/**
	 * Hacer watch de un usuario específico
	 */
	const watchUser = useCallback((userId: number) => {
		if (!socket || !isConnected) {
			console.warn("[/tracker/v2] ⚠️ Socket no conectado para watch user");
			return;
		}

		const payload: UserWatchPayloadV2 = {userId};

		console.log(`[/tracker/v2] 👁️ Watching usuario: ${userId}`);

		socket.emit("tracking:user:watch",payload,(response) => {
			if (response?.ok) {
				setWatchedUsers(prev => new Set(prev).add(userId));
				console.log(`[/tracker/v2] ✅ Watching usuario ${userId}`);
			} else {
				console.error(`[/tracker/v2] ❌ Error watching usuario ${userId}:`,response);
			}
		});
	},[socket,isConnected]);

	/**
	 * Dejar de hacer watch de un usuario
	 */
	const unwatchUser = useCallback((userId: number) => {
		if (!socket || !isConnected) {return;}

		const payload: UserWatchPayloadV2 = {userId};

		socket.emit("tracking:user:unwatch",payload,(response) => {
			if (response?.ok) {
				setWatchedUsers(prev => {
					const newSet = new Set(prev);
					newSet.delete(userId);
					return newSet;
				});
				console.log(`[/tracker/v2] ✅ Unwatch usuario ${userId}`);
			}
		});
	},[socket,isConnected]);

	/**
	 * Hacer watch de una zona geográfica
	 */
	const watchZone = useCallback((latitude: number,longitude: number,radius: number) => {
		if (!socket || !isConnected) {
			console.warn("[/tracker/v2] ⚠️ Socket no conectado para watch zone");
			return;
		}

		// Validar límites
		if (radius < 100 || radius > 50_000) {
			console.error("[/tracker/v2] ❌ Radio debe estar entre 100-50000 metros");
			return;
		}

		const payload: ZoneWatchPayloadV2 = {latitude,longitude,radius};

		console.log(`[/tracker/v2] 🗺️ Watching zona:`,payload);

		socket.emit("tracking:zone:watch",payload,(response) => {
			if (response?.ok) {
				setWatchedZones(prev => [...prev,response.zone]);
				console.log("[/tracker/v2] ✅ Watching zona:",response.zone);
			} else {
				console.error("[/tracker/v2] ❌ Error watching zona:",response);
			}
		});
	},[socket,isConnected]);

	/**
	 * Dejar de hacer watch de una zona
	 */
	const unwatchZone = useCallback((latitude: number,longitude: number,radius: number) => {
		if (!socket || !isConnected) {return;}

		const payload: ZoneWatchPayloadV2 = {latitude,longitude,radius};

		socket.emit("tracking:zone:unwatch",payload,(response) => {
			if (response?.ok) {
				setWatchedZones(prev =>
					prev.filter(zone =>
						zone.latitude !== latitude ||
						zone.longitude !== longitude ||
						zone.radius !== radius
					)
				);
				console.log("[/tracker/v2] ✅ Unwatch zona");
			}
		});
	},[socket,isConnected]);

	/**
	 * Solicitar lista completa de usuarios (útil para re-sync)
	 */
	const requestUsersList = useCallback(() => {
		if (!socket || !isConnected) {return;}

		console.log("[/tracker/v2] 📋 Solicitando lista completa de usuarios");
		socket.emit("tracking:users:request");
	},[socket,isConnected]);

	/**
	 * Limpiar batch updates procesados
	 */
	const clearBatchUpdates = useCallback(() => {
		setBatchUpdates([]);
	},[]);

	/**
	 * Obtener métricas actuales
	 */
	const getMetrics = useCallback((): TrackingMetricsV2 => {
		return {...metricsRef.current};
	},[]);

	/**
	 * Suscribirse manualmente (útil después de reconexión)
	 */
	const subscribe = useCallback(() => {
		if (!socket || !isConnected) {return;}

		socket.emit("tracking:subscribe",(response) => {
			if (response?.ok) {
				console.log("[/tracker/v2] 📡 Suscrito manualmente");
			}
		});
	},[socket,isConnected]);

	/**
	 * Desuscribirse
	 */
	const unsubscribe = useCallback(() => {
		if (!socket || !isConnected) {return;}

		socket.emit("tracking:unsubscribe",(response) => {
			if (response?.ok) {
				setIsSubscribed(false);
				console.log("[/tracker/v2] 📡 Desuscrito");
			}
		});
	},[socket,isConnected]);

	// ============================================================================
	// RETURN DEL HOOK
	// ============================================================================

	return {
		// Estado de conexión
		connectionData,
		isConnected,
		isSubscribed,
		lastError,

		// Datos
		batchUpdates,
		usersList: Array.from(usersList.values()),
		usersMap: usersList,
		watchedUsers: Array.from(watchedUsers),
		watchedZones,

		// Funciones principales
		sendBatchLocations,
		sendLocation,

		// Watch functions
		unwatchUser,
		unwatchZone,
		watchUser,
		watchZone,

		// Utilidades
		clearBatchUpdates,
		getMetrics,
		requestUsersList,
		subscribe,
		unsubscribe,

		// Socket raw para casos avanzados
		socket,
	};
}


