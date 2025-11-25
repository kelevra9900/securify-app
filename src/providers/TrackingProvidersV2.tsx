import React from 'react';
import {useSelector} from 'react-redux';
import type {RootState} from '@/store';

// Providers v1 (existente)
import {TrackSocketProvider} from '@/sockets/TrackSocketProvider';

// Providers v2 (nuevos)
import {TrackSocketV2Provider} from '@/sockets/TrackSocketV2Provider';
import type {TrackerV2Config} from '@/sockets/tracker.v2.types';

// Config
import {SOCKET_BASE_URL} from '@/utils/sockets/config';

/**
 * Provider que combina las versiones v1 y v2 del sistema de tracking
 * 
 * Estructura de providers anidados:
 * 1. TrackSocketProvider (v1) - Para compatibilidad y tracking nativo
 * 2. TrackSocketV2Provider (v2) - Para nuevas funcionalidades y tiempo real
 * 
 * Esto permite migración gradual y uso de ambas APIs simultáneamente.
 */

interface TrackingProvidersV2Props {
	children: React.ReactNode;
	/** Configuración personalizada para WebSocket v2 */
	v2Config?: Partial<TrackerV2Config>;
	/** Habilitar provider v1 para compatibilidad */
	enableV1?: boolean;
	/** Habilitar provider v2 para nuevas funcionalidades */
	enableV2?: boolean;
	/** Callbacks para debugging */
	onV1Connected?: () => void;
	onV1Disconnected?: () => void;
	onV2Connected?: () => void;
	onV2Disconnected?: () => void;
	onV2Error?: (error: any) => void;
}

export const TrackingProvidersV2: React.FC<TrackingProvidersV2Props> = ({
	children,
	v2Config,
	enableV1 = true,
	enableV2 = true,
	onV1Connected,
	onV1Disconnected,
	onV2Connected,
	onV2Disconnected,
	onV2Error,
}) => {
	// ============================================================================
	// ESTADO DEL USUARIO
	// ============================================================================

	const token = useSelector((state: RootState) => state.auth.token);

	// ============================================================================
	// CONFIGURACIÓN V2
	// ============================================================================

	const defaultV2Config: Partial<TrackerV2Config> = {
		namespace: '/tracker/v2',
		batchInterval: 200,
		locationMinInterval: 2000,
		enableMetrics: __DEV__, // Solo métricas en desarrollo
	};

	const finalV2Config = {
		...defaultV2Config,
		...v2Config,
	};

	// ============================================================================
	// RENDER CONDICIONAL DE PROVIDERS
	// ============================================================================

	let content = children;

	// Envolver con provider v2 si está habilitado
	if (enableV2 && token) {
		content = (
			<TrackSocketV2Provider
				token={token}
				config={finalV2Config}
				onConnected={onV2Connected}
				onDisconnected={onV2Disconnected}
				onError={onV2Error}
			>
				{content}
			</TrackSocketV2Provider>
		);
	}

	// Envolver con provider v1 si está habilitado (mantener compatibilidad)
	if (enableV1 && token) {
		content = (
			<TrackSocketProvider
				token={token}
			>
				{content}
			</TrackSocketProvider>
		);
	}

	return <>{content}</>;
};

// ============================================================================
// CONFIGURACIONES PREDEFINIDAS
// ============================================================================

/** Configuración optimizada para producción */
export const PRODUCTION_V2_CONFIG: Partial<TrackerV2Config> = {
	batchInterval: 200,
	locationMinInterval: 3000, // 3 segundos en producción
	enableMetrics: false,
	maxRetries: 5,
	retryDelay: 2000,
};

/** Configuración para desarrollo y testing */
export const DEVELOPMENT_V2_CONFIG: Partial<TrackerV2Config> = {
	batchInterval: 100, // Más frecuente para testing
	locationMinInterval: 1000, // 1 segundo en desarrollo
	enableMetrics: true,
	maxRetries: 3,
	retryDelay: 1000,
};

/** Configuración para modo ahorro de batería */
export const BATTERY_SAVER_V2_CONFIG: Partial<TrackerV2Config> = {
	batchInterval: 500, // Menos frecuente
	locationMinInterval: 10000, // 10 segundos
	enableMetrics: false,
	maxRetries: 2,
	retryDelay: 5000,
};

// ============================================================================
// HELPERS PARA INTEGRACIÓN
// ============================================================================

/**
 * Hook para obtener la configuración v2 según el entorno
 */
export function useTrackingV2Config(): Partial<TrackerV2Config> {
	return React.useMemo(() => {
		if (__DEV__) {
			return DEVELOPMENT_V2_CONFIG;
		}

		// En producción, podrías usar diferentes configs según el usuario
		// const user = useSelector((state: RootState) => state.auth.user);
		// if (user?.preferences?.batteryMode) {
		//   return BATTERY_SAVER_V2_CONFIG;
		// }

		return PRODUCTION_V2_CONFIG;
	},[]);
}

/**
 * Provider simplificado que usa configuración automática
 */
export const AutoTrackingProvidersV2: React.FC<{children: React.ReactNode}> = ({
	children,
}) => {
	const v2Config = useTrackingV2Config();

	return (
		<TrackingProvidersV2
			v2Config={v2Config}
			enableV1={true} // Mantener v1 por compatibilidad
			enableV2={true} // Habilitar v2 por defecto
		>
			{children}
		</TrackingProvidersV2>
	);
};

// ============================================================================
// EJEMPLO DE INTEGRACIÓN EN APPLICATION.TSX
// ============================================================================

/*
// ANTES: Application.tsx sin tracking v2
function ApplicationNavigator() {
  return (
	<SafeAreaProvider>
	  <ThemeProvider>
		<NavigationContainer>
		  <View style={{backgroundColor: colors.background, flex: 1}}>
			<AppInitializer />
			<Stack.Navigator>
			  // ... screens
			</Stack.Navigator>
		  </View>
		</NavigationContainer>
	  </ThemeProvider>
	</SafeAreaProvider>
  );
}

// DESPUÉS: Application.tsx con tracking v2
import {AutoTrackingProvidersV2} from '@/providers/TrackingProvidersV2';

function ApplicationNavigator() {
  return (
	<SafeAreaProvider>
	  <ThemeProvider>
		<AutoTrackingProvidersV2>
		  <NavigationContainer>
			<View style={{backgroundColor: colors.background, flex: 1}}>
			  <AppInitializer />
			  <Stack.Navigator>
				// ... screens
			  </Stack.Navigator>
			</View>
		  </NavigationContainer>
		</AutoTrackingProvidersV2>
	  </ThemeProvider>
	</SafeAreaProvider>
  );
}
*/

// ============================================================================
// DEBUGGING Y MONITOREO
// ============================================================================

/**
 * Provider con logging detallado para debugging
 */
export const DebugTrackingProvidersV2: React.FC<{children: React.ReactNode}> = ({
	children,
}) => {
	const handleV2Connected = React.useCallback(() => {
		console.log('[TrackingProviders] ✅ WebSocket v2 conectado');
	},[]);

	const handleV2Disconnected = React.useCallback(() => {
		console.log('[TrackingProviders] 🔴 WebSocket v2 desconectado');
	},[]);

	const handleV2Error = React.useCallback((error: any) => {
		console.error('[TrackingProviders] ❌ Error v2:',error);
	},[]);

	return (
		<TrackingProvidersV2
			v2Config={DEVELOPMENT_V2_CONFIG}
			enableV1={true}
			enableV2={true}
			onV2Connected={handleV2Connected}
			onV2Disconnected={handleV2Disconnected}
			onV2Error={handleV2Error}
		>
			{children}
		</TrackingProvidersV2>
	);
};

export default TrackingProvidersV2;


