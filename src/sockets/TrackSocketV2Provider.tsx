import React,{createContext,useCallback,useContext} from "react";
import {useTrackSocketV2} from "./useTrackSocketV2";
import type {TrackerV2Config} from "./tracker.v2.types";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

type TrackSocketV2ContextType = null | ReturnType<typeof useTrackSocketV2>;

// ============================================================================
// CONTEXT
// ============================================================================

const TrackSocketV2Context = createContext<TrackSocketV2ContextType>(null);

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface TrackSocketV2ProviderProps {
	children: React.ReactNode;
	config?: Partial<TrackerV2Config>;
	onConnected?: () => void;
	onDisconnected?: () => void;
	onError?: (error: any) => void;
	token: null | string;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider para WebSocket Tracker API v2
 * 
 * Proporciona acceso global al hook useTrackSocketV2 y sus funcionalidades:
 * - Conexión automática al namespace /tracker/v2
 * - Manejo de batch updates cada 200ms
 * - Watch de usuarios específicos y zonas geográficas
 * - Reconexión automática
 * - Métricas de rendimiento
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { token } = useAuth();
 *   
 *   return (
 *     <TrackSocketV2Provider 
 *       token={token}
 *       config={{ locationMinInterval: 1000 }}
 *       onConnected={() => console.log('Tracker v2 conectado!')}
 *     >
 *       <MapScreen />
 *     </TrackSocketV2Provider>
 *   );
 * }
 * ```
 */
export const TrackSocketV2Provider: React.FC<TrackSocketV2ProviderProps> = ({
	children,
	config,
	onConnected,
	onDisconnected,
	onError,
	token,
}) => {
	// ============================================================================
	// HOOK PRINCIPAL
	// ============================================================================

	const trackSocket = useTrackSocketV2(token,config);

	// ============================================================================
	// CALLBACKS PARA EVENTOS
	// ============================================================================

	// Efecto para manejar cambios de conexión
	React.useEffect(() => {
		if (trackSocket.isConnected && onConnected) {
			onConnected();
		} else if (!trackSocket.isConnected && onDisconnected) {
			onDisconnected();
		}
	},[trackSocket.isConnected,onConnected,onDisconnected]);

	// Efecto para manejar errores
	React.useEffect(() => {
		if (trackSocket.lastError && onError) {
			onError(trackSocket.lastError);
		}
	},[trackSocket.lastError,onError]);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<TrackSocketV2Context.Provider value={trackSocket}>
			{children}
		</TrackSocketV2Context.Provider>
	);
};

// ============================================================================
// HOOK DE CONTEXTO
// ============================================================================

/**
 * Hook para acceder al contexto de TrackSocket v2
 * 
 * @throws {Error} Si se usa fuera del TrackSocketV2Provider
 * 
 * @returns {ReturnType<typeof useTrackSocketV2>} Todas las funciones y estado del tracker v2
 * 
 * @example
 * ```tsx
 * function MapScreen() {
 *   const {
 *     isConnected,
 *     batchUpdates,
 *     usersList,
 *     sendLocation,
 *     watchUser,
 *     clearBatchUpdates
 *   } = useTrackSocketV2Context();
 *   
 *   // Aplicar batch updates al mapa
 *   useEffect(() => {
 *     if (batchUpdates.length > 0) {
 *       updateMapMarkers(batchUpdates);
 *       clearBatchUpdates();
 *     }
 *   }, [batchUpdates]);
 *   
 *   return <Map users={usersList} />;
 * }
 * ```
 */
export function useTrackSocketV2Context() {
	const context = useContext(TrackSocketV2Context);

	if (!context) {
		throw new Error(
			"useTrackSocketV2Context debe usarse dentro de TrackSocketV2Provider. " +
			"Asegúrate de envolver tu componente con <TrackSocketV2Provider>."
		);
	}

	return context;
}

// ============================================================================
// HOOKS DE CONVENIENCIA
// ============================================================================

/**
 * Hook para obtener solo el estado de conexión
 */
export function useTrackConnectionV2() {
	const {connectionData,isConnected,isSubscribed,lastError} = useTrackSocketV2Context();

	return {
		connectionData,
		isConnected,
		isReady: isConnected && isSubscribed,
		isSubscribed,
		lastError,
	};
}

/**
 * Hook para obtener y manejar la lista de usuarios
 */
export function useTrackUsersV2() {
	const {
		batchUpdates,
		clearBatchUpdates,
		requestUsersList,
		usersList,
		usersMap
	} = useTrackSocketV2Context();

	const refreshUsers = useCallback(() => {
		requestUsersList();
	},[requestUsersList]);

	return {
		batchUpdates,
		clearBatchUpdates,
		refreshUsers,
		users: usersList,
		usersMap,
	};
}

/**
 * Hook para el manejo de ubicaciones
 */
export function useTrackLocationV2() {
	const {
		isConnected,
		lastError,
		sendBatchLocations,
		sendLocation
	} = useTrackSocketV2Context();

	const canSendLocation = isConnected && !lastError;

	const sendCurrentLocation = useCallback(async () => {
		return new Promise<boolean>((resolve) => {
			if (!canSendLocation) {
				resolve(false);
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(position) => {
					const success = sendLocation(
						position.coords.latitude,
						position.coords.longitude,
						position.coords.accuracy
					);
					resolve(success);
				},
				(error) => {
					console.error("[TrackSocketV2] Error obteniendo ubicación:",error);
					resolve(false);
				},
				{
					enableHighAccuracy: true,
					maximumAge: 5000,
					timeout: 10_000,
				}
			);
		});
	},[canSendLocation,sendLocation]);

	return {
		canSendLocation,
		sendBatchLocations,
		sendCurrentLocation,
		sendLocation,
	};
}

/**
 * Hook para el manejo de watch (usuarios y zonas)
 */
export function useTrackWatchV2() {
	const {
		unwatchUser,
		unwatchZone,
		watchedUsers,
		watchedZones,
		watchUser,
		watchZone,
	} = useTrackSocketV2Context();

	const isWatchingUser = useCallback((userId: number) => {
		return watchedUsers.includes(userId);
	},[watchedUsers]);

	const toggleUserWatch = useCallback((userId: number) => {
		if (isWatchingUser(userId)) {
			unwatchUser(userId);
		} else {
			watchUser(userId);
		}
	},[isWatchingUser,watchUser,unwatchUser]);

	const isWatchingZone = useCallback((lat: number,lng: number,radius: number) => {
		return watchedZones.some(zone =>
			zone.latitude === lat &&
			zone.longitude === lng &&
			zone.radius === radius
		);
	},[watchedZones]);

	return {
		// Usuarios
		isWatchingUser,
		toggleUserWatch,
		unwatchUser,
		watchedUsers,
		watchUser,

		// Zonas
		isWatchingZone,
		unwatchZone,
		watchedZones,
		watchZone,
	};
}

/**
 * Hook para métricas y debugging
 */
export function useTrackMetricsV2() {
	const {getMetrics,socket} = useTrackSocketV2Context();

	const [metrics,setMetrics] = React.useState(() => getMetrics());

	// Actualizar métricas cada segundo
	React.useEffect(() => {
		const interval = setInterval(() => {
			setMetrics(getMetrics());
		},1000);

		return () => clearInterval(interval);
	},[getMetrics]);

	const debugInfo = React.useMemo(() => ({
		connected: socket?.connected,
		disconnected: socket?.disconnected,
		socketId: socket?.id,
		transport: socket?.io?.engine?.transport?.name,
		...metrics,
	}),[socket,metrics]);

	return {
		debugInfo,
		metrics,
	};
}


