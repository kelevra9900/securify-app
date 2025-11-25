import React,{createContext,useCallback,useContext} from 'react';
import {useSelector} from 'react-redux';
import {Platform} from 'react-native';
import type {RootState} from '@/store';
import {useUserTrackerV2} from '@/sockets/useUserTrackerV2';
import type {UserTrackerV2Config} from '@/sockets/tracker.user.types';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

type UserTrackingContextType = null | ReturnType<typeof useUserTrackerV2>;

// ============================================================================
// CONTEXT
// ============================================================================

const UserTrackingContext = createContext<UserTrackingContextType>(null);

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface UserTrackingProviderProps {
	children: React.ReactNode;
	/** Configuración personalizada para WebSocket v2 */
	config?: Partial<UserTrackerV2Config>;
	/** Solo habilitar en plataformas específicas */
	enabledPlatforms?: Array<'android' | 'ios'>;
	/** Callbacks para debugging */
	onConnected?: () => void;
	onDisconnected?: () => void;
	onError?: (error: any) => void;
	onLocationSent?: (location: {lat: number; lng: number}) => void;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider simplificado para usuarios finales
 * 
 * Proporciona acceso al WebSocket v2 optimizado para envío de ubicaciones.
 * Diseñado específicamente para usuarios que envían su ubicación durante rondas.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { token } = useAuth();
 *   
 *   return (
 *     <UserTrackingProvider 
 *       config={{ locationMinInterval: 5000 }}
 *       onLocationSent={(loc) => console.log('Ubicación enviada:', loc)}
 *     >
 *       <PatrolScreen />
 *     </UserTrackingProvider>
 *   );
 * }
 * ```
 */
export const UserTrackingProvider: React.FC<UserTrackingProviderProps> = ({
	children,
	config,
	enabledPlatforms = ['android'], // Por defecto solo Android
	onConnected,
	onDisconnected,
	onError,
	onLocationSent,
}) => {
	// ============================================================================
	// VERIFICAR PLATAFORMA
	// ============================================================================

	const isPlatformEnabled = enabledPlatforms.includes(Platform.OS as 'android' | 'ios');

	// ============================================================================
	// ESTADO DEL USUARIO
	// ============================================================================

	const token = useSelector((state: RootState) => state.auth.token);
	const user = useSelector((state: RootState) => state.auth.user);

	// ============================================================================
	// CONFIGURACIÓN AUTOMÁTICA SEGÚN USUARIO
	// ============================================================================

	const getUserConfig = React.useMemo((): Partial<UserTrackerV2Config> => {
		const baseConfig: Partial<UserTrackerV2Config> = {
			enableMetrics: __DEV__,
			enableRetry: true,
			heartbeatInterval: 30_000, // 30 segundos
			locationMinInterval: 3000, // 3 segundos por defecto
		};

		// Ajustes según rol del usuario (si tienes roles definidos)
		if (user?.role === 'GUARD' || user?.role === 'SECURITY') {
			return {
				...baseConfig,
				heartbeatInterval: 20_000,  // Heartbeat más frecuente
				locationMinInterval: 2000, // Más frecuente para guardias
			};
		}

		return {
			...baseConfig,
			...config, // Usuario puede override
		};
	},[user,config]);

	// ============================================================================
	// HOOK PRINCIPAL (SOLO SI PLATAFORMA ESTÁ HABILITADA)
	// ============================================================================

	const userTracker = useUserTrackerV2(
		isPlatformEnabled ? token : null,
		getUserConfig
	);

	// ============================================================================
	// CALLBACKS PARA EVENTOS
	// ============================================================================

	// Efecto para manejar cambios de conexión
	React.useEffect(() => {
		if (!isPlatformEnabled) {return;}

		if (userTracker.isConnected && onConnected) {
			onConnected();
		} else if (!userTracker.isConnected && onDisconnected) {
			onDisconnected();
		}
	},[userTracker.isConnected,onConnected,onDisconnected,isPlatformEnabled]);

	// Efecto para manejar errores
	React.useEffect(() => {
		if (!isPlatformEnabled) {return;}

		if (userTracker.lastError && onError) {
			onError(userTracker.lastError);
		}
	},[userTracker.lastError,onError,isPlatformEnabled]);

	// Wrapper de sendLocation para callback
	const sendLocationWithCallback = React.useCallback(async (
		lat: number,
		lng: number,
		accuracy?: number,
		speed?: number,
		bearing?: number
	): Promise<boolean> => {
		if (!isPlatformEnabled) {return false;}

		const success = await userTracker.sendLocation(lat,lng,accuracy,speed,bearing);

		if (success && onLocationSent) {
			onLocationSent({lat,lng});
		}

		return success;
	},[userTracker.sendLocation,onLocationSent,isPlatformEnabled]);

	// ============================================================================
	// CONTEXT VALUE
	// ============================================================================

	const contextValue = React.useMemo(() => {
		if (!isPlatformEnabled) {
			return null; // Context será null en plataformas no soportadas
		}

		return {
			...userTracker,
			sendLocation: sendLocationWithCallback,
		};
	},[userTracker,sendLocationWithCallback,isPlatformEnabled]);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<UserTrackingContext.Provider value={contextValue}>
			{children}
		</UserTrackingContext.Provider>
	);
};

// ============================================================================
// HOOK DE CONTEXTO
// ============================================================================

/**
 * Hook para acceder al contexto de UserTracking
 * 
 * @throws {Error} Si se usa fuera del UserTrackingProvider o en plataforma no soportada
 * 
 * @returns {ReturnType<typeof useUserTrackerV2>} Funciones y estado del tracker
 * 
 * @example
 * ```tsx
 * function PatrolScreen() {
 *   const {
 *     isConnected,
 *     canSendLocation,
 *     sendLocation,
 *     sendCurrentLocation,
 *     getMetrics
 *   } = useUserTrackingContext();
 *   
 *   const handleSendLocation = async () => {
 *     if (canSendLocation) {
 *       await sendCurrentLocation();
 *     }
 *   };
 *   
 *   return (
 *     <Button onPress={handleSendLocation} title="Enviar Ubicación" />
 *   );
 * }
 * ```
 */
export function useUserTrackingContext() {
	const context = useContext(UserTrackingContext);

	if (context === undefined) {
		throw new Error(
			"useUserTrackingContext debe usarse dentro de UserTrackingProvider. " +
			"Asegúrate de envolver tu componente con <UserTrackingProvider>."
		);
	}

	if (context === null) {
		throw new Error(
			"useUserTrackingContext no está disponible en esta plataforma. " +
			`Plataforma actual: ${Platform.OS}. ` +
			"El provider está configurado para funcionar solo en plataformas específicas."
		);
	}

	return context;
}

// ============================================================================
// HOOK OPCIONAL QUE NO FALLA
// ============================================================================

/**
 * Hook opcional que retorna null si no está disponible
 * Útil para componentes que pueden funcionar con o sin tracking
 */
export function useOptionalUserTracking() {
	const context = useContext(UserTrackingContext);
	return context; // Puede ser null
}

// ============================================================================
// PROVIDER SIMPLIFICADO PARA ANDROID
// ============================================================================

/**
 * Provider preconfigurado específicamente para Android
 */
export const AndroidUserTrackingProvider: React.FC<{
	children: React.ReactNode;
	onLocationSent?: (location: {lat: number; lng: number}) => void;
}> = ({children,onLocationSent}) => {
	const handleConnected = React.useCallback(() => {
		console.log('[AndroidUserTracking] ✅ WebSocket conectado');
	},[]);

	const handleDisconnected = React.useCallback(() => {
		console.log('[AndroidUserTracking] 🔴 WebSocket desconectado');
	},[]);

	const handleError = React.useCallback((error: any) => {
		console.error('[AndroidUserTracking] ❌ Error:',error);
	},[]);

	return (
		<UserTrackingProvider
			config={{
				enableMetrics: __DEV__,
				enableRetry: true,
				heartbeatInterval: 30_000,
				locationMinInterval: 3000,
			}}
			enabledPlatforms={['android']}
			onConnected={handleConnected}
			onDisconnected={handleDisconnected}
			onError={handleError}
			onLocationSent={onLocationSent}
		>
			{children}
		</UserTrackingProvider>
	);
};

export default UserTrackingProvider;


