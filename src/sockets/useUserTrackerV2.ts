/* eslint-disable no-console */
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import type {Socket} from 'socket.io-client';
import {createNamespaceSocket} from './factory';
import {getCurrentPositionNative} from '@/utils/tracking';
import type {
	TrackerErrorV2,
	UserConnectionDataV2,
	UserLocationV2,
	UserTrackerV2Config,
	UserTrackerV2EmitEvents,
	UserTrackerV2ListenEvents,
	UserTrackingMetrics,
} from './tracker.user.types';
import {DEFAULT_USER_TRACKER_CONFIG} from './tracker.user.types';

/**
 * Hook simplificado de WebSocket Tracker v2 para USUARIOS FINALES
 * 
 * Enfocado en:
 * ✅ Envío eficiente de ubicación del usuario
 * ✅ Integración con tracking nativo Android
 * ✅ Rate limiting inteligente
 * ✅ Retry automático en errores
 * ✅ Heartbeat para mantener conexión
 * ✅ Métricas básicas de rendimiento
 * 
 * NO incluye:
 * ❌ Watch de otros usuarios (funcionalidad de admin)
 * ❌ Geofencing
 * ❌ Batch updates de múltiples usuarios
 * ❌ Lista de usuarios online
 */
export function useUserTrackerV2(
	token: null | string,
	config: Partial<UserTrackerV2Config> = {}
) {
	const finalConfig = useMemo(() => ({
		...DEFAULT_USER_TRACKER_CONFIG,
		...config,
	}),[config]);

	// ============================================================================
	// ESTADO DE CONEXIÓN
	// ============================================================================

	const socket = useMemo(() => {
		if (!token) {return null;}
		return createNamespaceSocket<UserTrackerV2ListenEvents,UserTrackerV2EmitEvents>(
			finalConfig.namespace,
			token
		) as Socket<UserTrackerV2ListenEvents,UserTrackerV2EmitEvents>;
	},[token,finalConfig.namespace]);

	const [isConnected,setIsConnected] = useState(false);
	const [connectionData,setConnectionData] = useState<null | UserConnectionDataV2>(null);
	const [lastError,setLastError] = useState<null | TrackerErrorV2>(null);

	// ============================================================================
	// MÉTRICAS Y REFERENCIAS
	// ============================================================================

	const metricsRef = useRef<UserTrackingMetrics>({
		avgLatency: 0,
		errors: 0,
		lastLocationTime: 0,
		locationsConfirmed: 0,
		locationsSubmitted: 0,
		reconnects: 0,
	});

	const lastLocationSentRef = useRef<number>(0);
	const pendingRetryRef = useRef<NodeJS.Timeout | null>(null);
	const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef<number>(0);

	// ============================================================================
	// CONFIGURACIÓN DE SOCKET
	// ============================================================================

	useEffect(() => {
		if (!socket) {return;}

		// Eventos de conexión básicos
		const onConnect = () => {
			console.log('[UserTracker v2] ✅ Conectado:',socket.id);
			setIsConnected(true);
			setLastError(null);
			reconnectAttemptsRef.current = 0;

			// Iniciar heartbeat
			startHeartbeat();
		};

		const onDisconnect = (reason?: string) => {
			console.log('[UserTracker v2] 🔴 Desconectado:',reason);
			setIsConnected(false);
			metricsRef.current.reconnects++;

			// Detener heartbeat
			stopHeartbeat();
		};

		const onConnectError = (err: unknown) => {
			const anyErr = err as {data?: unknown; description?: string; message?: string};
			console.log('[UserTracker v2] ❌ Error de conexión:',anyErr?.message ?? anyErr?.description ?? anyErr);
			metricsRef.current.errors++;
		};

		// Eventos específicos v2
		const onTrackingConnected = (data: UserConnectionDataV2) => {
			console.log('[UserTracker v2] 🔌 Usuario conectado:',data);
			setConnectionData(data);
		};

		const onLocationReceived = (data: {timestamp: string; userId: number}) => {
			console.log('[UserTracker v2] ✅ Ubicación confirmada:',data.timestamp);
			metricsRef.current.locationsConfirmed++;

			// Calcular latencia si tenemos el timestamp de envío
			const serverTime = new Date(data.timestamp).getTime();
			const now = Date.now();
			const latency = Math.max(0,now - serverTime);
			metricsRef.current.avgLatency = (metricsRef.current.avgLatency + latency) / 2;
		};

		const onError = (error: TrackerErrorV2) => {
			console.error('[UserTracker v2] ❌ Error del servidor:',error);
			setLastError(error);
			metricsRef.current.errors++;

			// Manejo de rate limiting
			if (error.code === 'rate_limited' && error.retryAfterMs && finalConfig.enableRetry) {
				console.log(`[UserTracker v2] ⏳ Rate limited, reintentando en ${error.retryAfterMs}ms`);

				if (pendingRetryRef.current) {
					clearTimeout(pendingRetryRef.current);
				}

				pendingRetryRef.current = setTimeout(() => {
					console.log('[UserTracker v2] 🔄 Reintentando después de rate limit');
					setLastError(null);
					pendingRetryRef.current = null;
				},error.retryAfterMs);
			}
		};

		// Registrar listeners
		socket.on('connect',onConnect);
		socket.on('disconnect',onDisconnect);
		socket.on('connect_error',onConnectError);
		socket.on('tracking:connected',onTrackingConnected);
		socket.on('tracking:location:received',onLocationReceived);
		socket.on('error',onError);

		// Conectar
		if (!socket.connected) {
			socket.connect();
		}

		// Auto-reconexión por estado de la app
		const appStateSubscription = AppState.addEventListener('change',(nextAppState) => {
			if (nextAppState === 'active' && !socket.connected) {
				console.log('[UserTracker v2] 📱 App activa, reconectando...');
				socket.connect();
			}
		});

		// Auto-reconexión por estado de la red (solo en Android)
		let netInfoUnsubscribe: (() => void) | undefined;
		if (Platform.OS === 'android') {
			netInfoUnsubscribe = NetInfo.addEventListener((state) => {
				if (state.isConnected && !socket.connected) {
					console.log('[UserTracker v2] 📶 Red disponible, reconectando...');
					socket.connect();
				} else if (!state.isConnected && socket.connected) {
					console.log('[UserTracker v2] 📵 Red perdida, desconectando...');
					socket.disconnect();
				}
			});
		}

		return () => {
			// Cleanup
			socket.off('connect',onConnect);
			socket.off('disconnect',onDisconnect);
			socket.off('connect_error',onConnectError);
			socket.off('tracking:connected',onTrackingConnected);
			socket.off('tracking:location:received',onLocationReceived);
			socket.off('error',onError);

			appStateSubscription.remove();
			if (netInfoUnsubscribe) {netInfoUnsubscribe();}

			stopHeartbeat();
			if (pendingRetryRef.current) {
				clearTimeout(pendingRetryRef.current);
			}

			socket.removeAllListeners();
			socket.disconnect();
		};
	},[socket,finalConfig]);

	// ============================================================================
	// FUNCIONES DE HEARTBEAT
	// ============================================================================

	const startHeartbeat = useCallback(() => {
		if (!finalConfig.heartbeatInterval || heartbeatIntervalRef.current) {return;}

		heartbeatIntervalRef.current = setInterval(() => {
			if (socket && socket.connected) {
				socket.emit('tracking:heartbeat');
			}
		},finalConfig.heartbeatInterval);

		console.log(`[UserTracker v2] 💓 Heartbeat iniciado (${finalConfig.heartbeatInterval}ms)`);
	},[socket,finalConfig.heartbeatInterval]);

	const stopHeartbeat = useCallback(() => {
		if (heartbeatIntervalRef.current) {
			clearInterval(heartbeatIntervalRef.current);
			heartbeatIntervalRef.current = null;
			console.log('[UserTracker v2] 💓 Heartbeat detenido');
		}
	},[]);

	// ============================================================================
	// FUNCIÓN PRINCIPAL: ENVIAR UBICACIÓN
	// ============================================================================

	const sendLocation = useCallback(async (
		latitude: number,
		longitude: number,
		accuracy?: number,
		speed?: number,
		bearing?: number
	): Promise<boolean> => {
		if (!socket || !isConnected) {
			console.warn('[UserTracker v2] ⚠️ Socket no conectado');
			return false;
		}

		// Throttling
		const now = Date.now();
		if (now - lastLocationSentRef.current < finalConfig.locationMinInterval) {
			console.log('[UserTracker v2] ⏳ Throttled, muy pronto desde última ubicación');
			return false;
		}

		lastLocationSentRef.current = now;

		const payload: UserLocationV2 = {
			accuracy,
			bearing,
			latitude,
			longitude,
			speed,
			timestamp: now,
		};

		console.log('[UserTracker v2] 📍 Enviando ubicación:',payload);

		return new Promise<boolean>((resolve) => {
			if (!socket) {
				resolve(false);
				return;
			}

			metricsRef.current.locationsSubmitted++;
			metricsRef.current.lastLocationTime = now;

			socket.emit('tracking:location:update',payload);

			// Simular respuesta exitosa (el servidor confirmará via tracking:location:received)
			console.log('[UserTracker v2] 📍 Ubicación enviada (esperando confirmación)');
			resolve(true);
		});
	},[socket,isConnected,finalConfig.locationMinInterval]);

	// ============================================================================
	// ENVÍO DE UBICACIÓN AUTOMÁTICA (ANDROID)
	// ============================================================================

	const sendCurrentLocation = useCallback(async (): Promise<boolean> => {
		if (Platform.OS !== 'android') {
			console.warn('[UserTracker v2] Solo soportado en Android');
			return false;
		}

		try {
			const location = await getCurrentPositionNative({
				enableHighAccuracy: true,
				timeoutMs: 10_000,
			});

			return await sendLocation(
				location.latitude,
				location.longitude,
				location.accuracy,
				location.speed,
				location.bearing
			);
		} catch (error) {
			console.error('[UserTracker v2] Error obteniendo ubicación:',error);
			return false;
		}
	},[sendLocation]);

	// ============================================================================
	// MÉTRICAS Y UTILIDADES
	// ============================================================================

	const getMetrics = useCallback((): UserTrackingMetrics => {
		return {...metricsRef.current};
	},[]);

	const resetMetrics = useCallback(() => {
		metricsRef.current = {
			avgLatency: 0,
			errors: 0,
			lastLocationTime: 0,
			locationsConfirmed: 0,
			locationsSubmitted: 0,
			reconnects: 0,
		};
	},[]);

	const getConnectionInfo = useCallback(() => {
		return {
			canSendLocation: isConnected && !lastError,
			connectionData,
			isConnected,
			lastError,
			socketId: socket?.id,
			transport: socket?.io?.engine?.transport?.name,
		};
	},[isConnected,socket,connectionData,lastError]);

	// ============================================================================
	// RETURN DEL HOOK
	// ============================================================================

	return {
		// Estado de conexión
		canSendLocation: isConnected && !lastError,
		connectionData,
		isConnected,
		lastError,

		// Funciones principales
		sendCurrentLocation,
		sendLocation,

		// Utilidades
		getConnectionInfo,
		getMetrics,
		resetMetrics,

		// Socket raw para casos avanzados
		socket,
	};
}
