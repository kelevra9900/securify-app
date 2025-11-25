/* eslint-disable no-console */
import {useCallback,useEffect,useRef} from 'react';
import {AppState} from 'react-native';
import {useSelector} from 'react-redux';
import type {RootState} from '@/store';
import {useTrackSocketV2Context} from '@/sockets/TrackSocketV2Provider';
import {getCurrentPositionNative,startTracking,stopTracking,updateTracking} from '@/utils/tracking';
import {showErrorToast,showInfoToast} from '@/utils/toast';

interface TrackingV2IntegrationConfig {
	/** Habilitar tracking nativo en segundo plano */
	enableNativeTracking: boolean;
	/** Habilitar WebSocket v2 para tiempo real */
	enableRealtimeTracking: boolean;
	/** Intervalo para envío manual de ubicaciones (ms) */
	manualLocationInterval?: number;
	/** Configuración para tracking nativo */
	nativeConfig?: {
		fastestMs?: number;
		intervalMs?: number;
		minDistanceMeters?: number;
	};
}

/**
 * Hook integrador que combina:
 * 1. Tracking nativo en segundo plano (v1)
 * 2. WebSocket v2 para tiempo real y mapas
 * 3. Manejo de ubicación manual
 * 
 * Este hook proporciona una integración completa entre el sistema
 * de tracking existente y la nueva API v2 del WebSocket Gateway.
 * 
 * @example
 * ```tsx
 * function MapScreen() {
 *   const {
 *     isTrackingActive,
 *     currentLocation,
 *     startIntegratedTracking,
 *     stopIntegratedTracking,
 *     sendManualLocation
 *   } = useTrackingV2Integration({
 *     enableNativeTracking: true,
 *     enableRealtimeTracking: true,
 *     manualLocationInterval: 30000 // 30 segundos
 *   });
 *   
 *   return (
 *     <View>
 *       <Button 
 *         onPress={startIntegratedTracking}
 *         title={isTrackingActive ? "Detener Tracking" : "Iniciar Tracking"}
 *       />
 *       {currentLocation && (
 *         <Text>Lat: {currentLocation.latitude}, Lng: {currentLocation.longitude}</Text>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function useTrackingV2Integration(config: TrackingV2IntegrationConfig) {
	// ============================================================================
	// ESTADO Y REFS
	// ============================================================================

	const token = useSelector((state: RootState) => state.auth.token);
	const user = useSelector((state: RootState) => state.auth.user);
	const isTrackingActiveRef = useRef<boolean>(false);
	const manualIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastLocationRef = useRef<{latitude: number; longitude: number} | null>(null);

	// ============================================================================
	// WEBSOCKET V2 CONTEXT
	// ============================================================================

	const {
		batchUpdates,
		clearBatchUpdates,
		getMetrics,
		isConnected,
		isSubscribed,
		sendLocation,
		unwatchUser,
		usersList,
		watchUser,
	} = useTrackSocketV2Context();

	// ============================================================================
	// FUNCIONES DE TRACKING NATIVO
	// ============================================================================

	const startNativeTracking = useCallback(async () => {
		if (!token || !config.enableNativeTracking) {return false;}

		try {
			const result = await startTracking({
				eventName: 'save_location',
				fastestMs: config.nativeConfig?.fastestMs ?? 10_000, // 10 segundos mínimo
				intervalMs: config.nativeConfig?.intervalMs ?? 30_000, // 30 segundos
				minDistanceMeters: config.nativeConfig?.minDistanceMeters ?? 50, // 50 metros
				namespace: '/tracker', // v1 para historial
				realtimeEventName: 'tracking:location:update',
				socketUrl: __DEV__ ? 'http://localhost:3000' : 'https://api.trablisa.com',
				token,
			});

			if (result.ok) {
				console.log('[TrackingV2Integration] ✅ Tracking nativo iniciado');
				showInfoToast('Tracking en segundo plano activado');
				return true;
			} else {
				console.log('[TrackingV2Integration] ❌ Error iniciando tracking nativo:',result.reason);
				showErrorToast(`Error: ${result.reason}`);
				return false;
			}
		} catch (error) {
			console.error('[TrackingV2Integration] Error:',error);
			showErrorToast('Error al iniciar tracking nativo');
			return false;
		}
	},[token,config]);

	const stopNativeTracking = useCallback(() => {
		try {
			stopTracking();
			console.log('[TrackingV2Integration] ✅ Tracking nativo detenido');
		} catch (error) {
			console.error('[TrackingV2Integration] Error deteniendo tracking nativo:',error);
		}
	},[]);

	// ============================================================================
	// FUNCIONES DE UBICACIÓN MANUAL
	// ============================================================================

	const sendManualLocation = useCallback(async (): Promise<boolean> => {
		if (!config.enableRealtimeTracking || !isConnected) {
			console.warn('[TrackingV2Integration] WebSocket no conectado para ubicación manual');
			return false;
		}

		try {
			const location = await getCurrentPositionNative({
				enableHighAccuracy: true,
				timeoutMs: 10_000,
			});

			const success = sendLocation(
				location.latitude,
				location.longitude,
				location.accuracy
			);

			if (success) {
				lastLocationRef.current = {
					latitude: location.latitude,
					longitude: location.longitude,
				};
				console.log('[TrackingV2Integration] ✅ Ubicación manual enviada via WebSocket v2');
				return true;
			} else {
				console.warn('[TrackingV2Integration] ⚠️ Ubicación manual no enviada (throttled)');
				return false;
			}
		} catch (error) {
			console.error('[TrackingV2Integration] Error obteniendo ubicación manual:',error);
			showErrorToast('Error obteniendo ubicación');
			return false;
		}
	},[config.enableRealtimeTracking,isConnected,sendLocation]);

	const startManualLocationInterval = useCallback(() => {
		if (!config.manualLocationInterval || manualIntervalRef.current) {return;}

		manualIntervalRef.current = setInterval(async () => {
			await sendManualLocation();
		},config.manualLocationInterval);

		console.log(`[TrackingV2Integration] 🔄 Intervalo manual iniciado (${config.manualLocationInterval}ms)`);
	},[config.manualLocationInterval,sendManualLocation]);

	const stopManualLocationInterval = useCallback(() => {
		if (manualIntervalRef.current) {
			clearInterval(manualIntervalRef.current);
			manualIntervalRef.current = null;
			console.log('[TrackingV2Integration] ⏹️ Intervalo manual detenido');
		}
	},[]);

	// ============================================================================
	// FUNCIONES PRINCIPALES
	// ============================================================================

	const startIntegratedTracking = useCallback(async (): Promise<boolean> => {
		if (isTrackingActiveRef.current) {
			console.warn('[TrackingV2Integration] Tracking ya está activo');
			return false;
		}

		console.log('[TrackingV2Integration] 🚀 Iniciando tracking integrado...');

		let nativeSuccess = true;
		if (config.enableNativeTracking) {
			nativeSuccess = await startNativeTracking();
		}

		// Iniciar intervalo manual independientemente del nativo
		if (config.enableRealtimeTracking && config.manualLocationInterval) {
			startManualLocationInterval();
		}

		// Enviar ubicación inicial
		if (config.enableRealtimeTracking) {
			await sendManualLocation();
		}

		isTrackingActiveRef.current = true;
		console.log('[TrackingV2Integration] ✅ Tracking integrado iniciado');

		return nativeSuccess; // Retorna si el tracking nativo tuvo éxito
	},[config,startNativeTracking,startManualLocationInterval,sendManualLocation]);

	const stopIntegratedTracking = useCallback(() => {
		if (!isTrackingActiveRef.current) {
			console.warn('[TrackingV2Integration] Tracking no está activo');
			return;
		}

		console.log('[TrackingV2Integration] 🛑 Deteniendo tracking integrado...');

		// Detener tracking nativo
		if (config.enableNativeTracking) {
			stopNativeTracking();
		}

		// Detener intervalo manual
		stopManualLocationInterval();

		isTrackingActiveRef.current = false;
		console.log('[TrackingV2Integration] ✅ Tracking integrado detenido');
	},[config.enableNativeTracking,stopNativeTracking,stopManualLocationInterval]);

	// ============================================================================
	// MANEJO AUTOMÁTICO DE ESTADO DE LA APP
	// ============================================================================

	useEffect(() => {
		const subscription = AppState.addEventListener('change',(nextAppState) => {
			if (nextAppState === 'active' && isTrackingActiveRef.current) {
				// Al volver a la app, enviar ubicación inmediata
				if (config.enableRealtimeTracking) {
					console.log('[TrackingV2Integration] 📱 App activa, enviando ubicación...');
					sendManualLocation();
				}
			}
		});

		return () => {
			subscription.remove();
		};
	},[config.enableRealtimeTracking,sendManualLocation]);

	// ============================================================================
	// LIMPIEZA AL DESMONTAR
	// ============================================================================

	useEffect(() => {
		return () => {
			stopIntegratedTracking();
		};
	},[stopIntegratedTracking]);

	// ============================================================================
	// FUNCIONES DE CONVENIENCIA PARA WATCH
	// ============================================================================

	const watchUserById = useCallback((userId: number) => {
		watchUser(userId);
		console.log(`[TrackingV2Integration] 👁️ Watching usuario: ${userId}`);
	},[watchUser]);

	const unwatchUserById = useCallback((userId: number) => {
		unwatchUser(userId);
		console.log(`[TrackingV2Integration] 👁️ Unwatch usuario: ${userId}`);
	},[unwatchUser]);

	// ============================================================================
	// ESTADOS COMPUTADOS
	// ============================================================================

	const connectionStatus = {
		isConnected,
		isReady: isConnected && isSubscribed,
		isSubscribed,
		isTrackingActive: isTrackingActiveRef.current,
	};

	const trackingMetrics = getMetrics();

	// ============================================================================
	// RETURN DEL HOOK
	// ============================================================================

	return {
		// Estado de conexión
		...connectionStatus,

		// Datos de ubicación
		batchUpdates,
		clearBatchUpdates,
		currentLocation: lastLocationRef.current,
		usersList,

		// Funciones principales
		sendManualLocation,
		startIntegratedTracking,
		stopIntegratedTracking,

		// Watch functions
		unwatchUser: unwatchUserById,
		watchUser: watchUserById,

		// Métricas y debugging
		metrics: trackingMetrics,

		// Info del usuario
		currentUser: user,

		// Configuración activa
		config,
	};
}

// ============================================================================
// EJEMPLO DE CONFIGURACIONES PREDEFINIDAS
// ============================================================================

/** Configuración para usuarios en rondas/patrullaje */
export const PATROL_TRACKING_CONFIG: TrackingV2IntegrationConfig = {
	enableNativeTracking: true,
	enableRealtimeTracking: true,
	manualLocationInterval: 15_000, // 15 segundos
	nativeConfig: {
		fastestMs: 10_000, // Mínimo 10 segundos entre updates
		intervalMs: 30_000, // 30 segundos para historial
		minDistanceMeters: 25, // 25 metros mínimo
	},
};

/** Configuración para supervisores/control */
export const SUPERVISOR_TRACKING_CONFIG: TrackingV2IntegrationConfig = {
	enableNativeTracking: false, // Solo reciben, no envían
	enableRealtimeTracking: true,
	manualLocationInterval: 60_000, // 1 minuto si necesitan enviar ubicación
	nativeConfig: {
		fastestMs: 30_000, // Mínimo 30 segundos
		intervalMs: 60_000, // 1 minuto
		minDistanceMeters: 100, // 100 metros
	},
};

/** Configuración para modo ahorro de batería */
export const BATTERY_SAVER_CONFIG: TrackingV2IntegrationConfig = {
	enableNativeTracking: true,
	enableRealtimeTracking: false, // Solo nativo, no tiempo real
	nativeConfig: {
		fastestMs: 60_000, // Mínimo 1 minuto
		intervalMs: 120_000, // 2 minutos
		minDistanceMeters: 100, // 100 metros
	},
};


