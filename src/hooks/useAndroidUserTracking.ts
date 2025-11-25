/* eslint-disable no-console */
import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import {useSelector} from 'react-redux';
import type {RootState} from '@/store';
import {useUserTrackerV2} from '@/sockets/useUserTrackerV2';
import {getCurrentPositionNative,startTracking,stopTracking,updateTracking} from '@/utils/tracking';
import {showErrorToast,showInfoToast} from '@/utils/toast';
import type {
	NativeTrackingIntegration,
} from '@/sockets/tracker.user.types';
import {
	ANDROID_BATTERY_SAVER_CONFIG,
	ANDROID_USER_CONFIG,
} from '@/sockets/tracker.user.types';

type TrackingMode = 'battery_saver' | 'manual_only' | 'normal';

/**
 * Hook especializado para usuarios Android
 * 
 * Combina:
 * 1. **Tracking nativo Android** en segundo plano (TrackingService)
 * 2. **WebSocket v2** para confirmaciones inmediatas en foreground  
 * 3. **Gestión inteligente** según estado de la app y batería
 * 
 * Diseñado para usuarios finales que envían su ubicación durante rondas/patrullaje.
 * 
 * @example
 * ```tsx
 * function PatrolScreen() {
 *   const {
 *     isTrackingActive,
 *     trackingMode,
 *     startPatrolTracking,
 *     stopPatrolTracking,
 *     sendManualLocation,
 *     metrics
 *   } = useAndroidUserTracking();
 *   
 *   return (
 *     <View>
 *       <Button
 *         title={isTrackingActive ? "Finalizar Patrullaje" : "Iniciar Patrullaje"}
 *         onPress={isTrackingActive ? stopPatrolTracking : startPatrolTracking}
 *       />
 *       <Text>Modo: {trackingMode}</Text>
 *       <Text>Ubicaciones enviadas: {metrics.locationsSubmitted}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useAndroidUserTracking(initialMode: TrackingMode = 'normal') {
	// ============================================================================
	// VERIFICACIÓN DE PLATAFORMA
	// ============================================================================

	if (Platform.OS !== 'android') {
		console.warn('[AndroidUserTracking] Este hook solo funciona en Android');
		return createNoopAndroidTracking();
	}

	// ============================================================================
	// ESTADO Y CONFIGURACIÓN
	// ============================================================================

	const token = useSelector((state: RootState) => state.auth.token);
	// const user = useSelector((state: RootState) => state.auth.user);

	const [trackingMode,setTrackingMode] = useState<TrackingMode>(initialMode);
	const [isTrackingActive,setIsTrackingActive] = useState(false);
	const [lastManualLocation,setLastManualLocation] = useState<{lat: number; lng: number} | null>(null);

	const isTrackingActiveRef = useRef(false);
	const manualLocationIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// ============================================================================
	// WEBSOCKET V2 (PARA CONFIRMACIONES)
	// ============================================================================

	const webSocketConfig = {
		enableMetrics: __DEV__,
		enableRetry: true,
		heartbeatInterval: trackingMode === 'battery_saver' ? 60_000 : 30_000,
		locationMinInterval: trackingMode === 'battery_saver' ? 10_000 : 3000,
	};

	const {
		canSendLocation,
		getMetrics: wsGetMetrics,
		isConnected: wsConnected,
		sendCurrentLocation: wsSendCurrentLocation,
		sendLocation: wsSendLocation,
	} = useUserTrackerV2(token,webSocketConfig);

	// ============================================================================
	// CONFIGURACIÓN NATIVA SEGÚN MODO
	// ============================================================================

	const getNativeConfig = useCallback((): NativeTrackingIntegration => {
		switch (trackingMode) {
			case 'battery_saver':
				return ANDROID_BATTERY_SAVER_CONFIG;
			case 'manual_only':
				return {
					enableNativeBackground: false,
					enableRealtimeConfirmation: true,
					nativeConfig: ANDROID_USER_CONFIG.nativeConfig,
				};
			default:
				return ANDROID_USER_CONFIG;
		}
	},[trackingMode]);

	// ============================================================================
	// FUNCIONES DE TRACKING NATIVO
	// ============================================================================

	const startNativeTracking = useCallback(async (): Promise<boolean> => {
		if (!token || trackingMode === 'manual_only') {return true;}

		const config = getNativeConfig();
		if (!config.enableNativeBackground) {return true;}

		try {
			console.log('[AndroidUserTracking] 🚀 Iniciando tracking nativo...');

			const result = await startTracking({
				eventName: 'save_location', // Historial
				namespace: '/tracker/v2', // v1 para historial en background
				realtimeEventName: 'tracking:location:update', // Tiempo real desde nativo
				socketUrl: __DEV__ ? 'http://localhost:3000' : 'https://api.trablisa.com',
				token,

				// Configuración Android específica
				fastestMs: config.nativeConfig.fastestMs,
				intervalMs: config.nativeConfig.intervalMs,
				minDistanceMeters: config.nativeConfig.minDistanceMeters,

				// Para tiempo real desde WebSocket v2 también
				realtimeMinDistanceMeters: 25, // Más sensible para v2
			});

			if (result.ok) {
				console.log('[AndroidUserTracking] ✅ Tracking nativo iniciado');
				showInfoToast(`Tracking ${trackingMode} activado`);
				return true;
			} else {
				console.error('[AndroidUserTracking] ❌ Error:',result.reason);
				showErrorToast(`Error: ${result.reason}`);
				return false;
			}
		} catch (error) {
			console.error('[AndroidUserTracking] ❌ Exception:',error);
			showErrorToast('Error al iniciar tracking nativo');
			return false;
		}
	},[token,trackingMode,getNativeConfig]);

	const stopNativeTracking = useCallback(() => {
		try {
			stopTracking();
			console.log('[AndroidUserTracking] ✅ Tracking nativo detenido');
		} catch (error) {
			console.error('[AndroidUserTracking] Error deteniendo tracking nativo:',error);
		}
	},[]);

	const updateNativeTracking = useCallback(() => {
		if (!isTrackingActiveRef.current) {return;}

		const config = getNativeConfig();
		if (!config.enableNativeBackground) {return;}

		try {
			updateTracking({
				fastestMs: config.nativeConfig.fastestMs,
				intervalMs: config.nativeConfig.intervalMs,
				minDistanceMeters: config.nativeConfig.minDistanceMeters,
			});
			console.log('[AndroidUserTracking] 🔄 Configuración nativa actualizada');
		} catch (error) {
			console.error('[AndroidUserTracking] Error actualizando tracking:',error);
		}
	},[getNativeConfig]);

	// ============================================================================
	// UBICACIÓN MANUAL INMEDIATA
	// ============================================================================

	const sendManualLocation = useCallback(async (): Promise<boolean> => {
		console.log('[AndroidUserTracking] 📍 Enviando ubicación manual...');

		try {
			const location = await getCurrentPositionNative({
				enableHighAccuracy: true,
				timeoutMs: 8000,
			});

			setLastManualLocation({
				lat: location.latitude,
				lng: location.longitude,
			});

			// Enviar por WebSocket v2 para confirmación inmediata (si está conectado)
			if (canSendLocation) {
				const success = await wsSendLocation(
					location.latitude,
					location.longitude,
					location.accuracy,
					location.speed,
					location.bearing
				);

				if (success) {
					console.log('[AndroidUserTracking] ✅ Ubicación manual enviada via WebSocket v2');
					showInfoToast('Ubicación enviada');
					return true;
				}
			}

			// Si WebSocket no está disponible, solo actualizar estado local
			console.log('[AndroidUserTracking] ⚠️ WebSocket no disponible, ubicación obtenida pero no enviada');
			showInfoToast('Ubicación obtenida (será enviada por sistema nativo)');
			return false;

		} catch (error) {
			console.error('[AndroidUserTracking] ❌ Error obteniendo ubicación:',error);
			showErrorToast('Error obteniendo ubicación');
			return false;
		}
	},[canSendLocation,wsSendLocation]);

	// ============================================================================
	// UBICACIÓN PERIÓDICA EN FOREGROUND
	// ============================================================================

	const startPeriodicLocationSending = useCallback(() => {
		if (manualLocationIntervalRef.current) {return;}

		const interval = trackingMode === 'battery_saver' ? 60_000 : 30_000; // 1 min / 30 seg

		manualLocationIntervalRef.current = setInterval(async () => {
			// Solo enviar si la app está en foreground y WebSocket conectado
			if (AppState.currentState === 'active' && canSendLocation) {
				await wsSendCurrentLocation();
			}
		},interval);

		console.log(`[AndroidUserTracking] 🔄 Ubicación periódica iniciada (${interval}ms)`);
	},[trackingMode,canSendLocation,wsSendCurrentLocation]);

	const stopPeriodicLocationSending = useCallback(() => {
		if (manualLocationIntervalRef.current) {
			clearInterval(manualLocationIntervalRef.current);
			manualLocationIntervalRef.current = null;
			console.log('[AndroidUserTracking] ⏹️ Ubicación periódica detenida');
		}
	},[]);

	// ============================================================================
	// FUNCIONES PRINCIPALES
	// ============================================================================

	const startPatrolTracking = useCallback(async (): Promise<boolean> => {
		if (isTrackingActiveRef.current) {
			console.warn('[AndroidUserTracking] Tracking ya está activo');
			return false;
		}

		console.log('[AndroidUserTracking] 🚀 Iniciando patrullaje...');

		// 1. Iniciar tracking nativo
		const nativeSuccess = await startNativeTracking();

		// 2. Iniciar ubicación periódica en foreground
		if (trackingMode !== 'manual_only') {
			startPeriodicLocationSending();
		}

		// 3. Enviar ubicación inicial
		await sendManualLocation();

		isTrackingActiveRef.current = true;
		setIsTrackingActive(true);

		console.log('[AndroidUserTracking] ✅ Patrullaje iniciado');
		return nativeSuccess;
	},[startNativeTracking,startPeriodicLocationSending,sendManualLocation,trackingMode]);

	const stopPatrolTracking = useCallback(() => {
		if (!isTrackingActiveRef.current) {
			console.warn('[AndroidUserTracking] Tracking no está activo');
			return;
		}

		console.log('[AndroidUserTracking] 🛑 Deteniendo patrullaje...');

		// 1. Detener tracking nativo
		stopNativeTracking();

		// 2. Detener ubicación periódica
		stopPeriodicLocationSending();

		isTrackingActiveRef.current = false;
		setIsTrackingActive(false);

		console.log('[AndroidUserTracking] ✅ Patrullaje detenido');
		showInfoToast('Patrullaje finalizado');
	},[stopNativeTracking,stopPeriodicLocationSending]);

	const changeTrackingMode = useCallback((newMode: TrackingMode) => {
		const wasActive = isTrackingActiveRef.current;

		if (wasActive) {
			stopPatrolTracking();
		}

		setTrackingMode(newMode);

		if (wasActive) {
			// Reanudar con el nuevo modo después de un breve delay
			setTimeout(() => {
				startPatrolTracking();
			},1000);
		}
	},[startPatrolTracking,stopPatrolTracking]);

	// ============================================================================
	// MANEJO DE ESTADO DE LA APP
	// ============================================================================

	useEffect(() => {
		const subscription = AppState.addEventListener('change',(nextAppState) => {
			if (!isTrackingActiveRef.current) {return;}

			if (nextAppState === 'active') {
				console.log('[AndroidUserTracking] 📱 App activa, iniciando ubicación periódica');
				startPeriodicLocationSending();
				// Enviar ubicación inmediata al volver
				setTimeout(() => sendManualLocation(),2000);
			} else if (nextAppState === 'background') {
				console.log('[AndroidUserTracking] 📱 App en background, deteniendo ubicación periódica');
				stopPeriodicLocationSending();
			}
		});

		return () => subscription.remove();
	},[startPeriodicLocationSending,stopPeriodicLocationSending,sendManualLocation]);

	// ============================================================================
	// ACTUALIZAR CONFIGURACIÓN AL CAMBIAR MODO
	// ============================================================================

	useEffect(() => {
		updateNativeTracking();
	},[trackingMode,updateNativeTracking]);

	// ============================================================================
	// LIMPIEZA AL DESMONTAR
	// ============================================================================

	useEffect(() => {
		return () => {
			if (isTrackingActiveRef.current) {
				stopPatrolTracking();
			}
		};
	},[stopPatrolTracking]);

	// ============================================================================
	// MÉTRICAS COMBINADAS
	// ============================================================================

	const getCombinedMetrics = useCallback(() => {
		const wsMetrics = wsGetMetrics();

		return {
			...wsMetrics,
			canSendLocation,
			isNativeActive: isTrackingActiveRef.current,
			lastManualLocation,
			trackingMode,
			wsConnected,
		};
	},[wsGetMetrics,trackingMode,wsConnected,lastManualLocation,canSendLocation]);

	// ============================================================================
	// RETURN DEL HOOK
	// ============================================================================

	return {
		// Estado principal
		canSendLocation,
		currentUser: null, // user,
		isTrackingActive,
		lastManualLocation,
		trackingMode,
		wsConnected,

		// Funciones principales
		changeTrackingMode,
		sendManualLocation,
		startPatrolTracking,
		stopPatrolTracking,

		// Métricas y debugging
		metrics: getCombinedMetrics(),

		// Estado de conexión
		connectionStatus: {
			canSendLocation,
			isNativeActive: isTrackingActiveRef.current,
			wsConnected,
		},
	};
}

// ============================================================================
// NOOP PARA PLATAFORMAS NO ANDROID
// ============================================================================

function createNoopAndroidTracking() {
	return {
		canSendLocation: false,
		changeTrackingMode: () => {
			console.warn('[AndroidUserTracking] No soportado en esta plataforma');
		},
		connectionStatus: {
			canSendLocation: false,
			isNativeActive: false,
			wsConnected: false,
		},
		currentUser: null,
		isTrackingActive: false,
		lastManualLocation: null,

		metrics: {
			avgLatency: 0,
			canSendLocation: false,
			errors: 0,
			isNativeActive: false,
			lastLocationTime: 0,
			lastManualLocation: null,
			locationsConfirmed: 0,
			locationsSubmitted: 0,
			reconnects: 0,
			trackingMode: 'manual_only' as TrackingMode,
			wsConnected: false,
		},
		sendManualLocation: async () => {
			console.warn('[AndroidUserTracking] No soportado en esta plataforma');
			return false;
		},
		startPatrolTracking: async () => {
			console.warn('[AndroidUserTracking] No soportado en esta plataforma');
			return false;
		},
		stopPatrolTracking: () => {
			console.warn('[AndroidUserTracking] No soportado en esta plataforma');
		},

		trackingMode: 'manual_only' as TrackingMode,

		wsConnected: false,
	};
}

// ============================================================================
// EXPORTS DE TIPOS
// ============================================================================

export type {TrackingMode};
