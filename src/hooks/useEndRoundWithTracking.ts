import {useCallback,useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import {addAppBreadcrumb} from '@/conf/sentry.conf';
import {showErrorToast} from '@/utils/toast';
import {useEndRound} from '@/hooks/rounds';
import {useAndroidUserTracking} from '@/hooks/useAndroidUserTracking';

interface UseEndRoundWithTrackingProps {
	completionPercentage: number;
	isCompleted: boolean;
	roundId?: number;
	roundName?: string;
}

/**
 * Hook integrado para finalizar rondas y detener tracking
 * 
 * Combina la lógica de:
 * - Finalización de ronda via API
 * - Detener tracking Android automáticamente  
 * - Navegación y notificaciones
 * - Manejo de errores
 * 
 * @example
 * ```tsx
 * const {
 *   handleEndRound,
 *   showEndRoundDialog,
 *   isEndingRound
 * } = useEndRoundWithTracking({
 *   roundId,
 *   roundName,
 *   isCompleted: progress >= 100,
 *   completionPercentage: progress
 * });
 * ```
 */
export function useEndRoundWithTracking({
	completionPercentage,
	isCompleted,
	roundId,
	roundName,
}: UseEndRoundWithTrackingProps) {
	const {isPending: isEndingRound,mutateAsync: endRound} = useEndRound();
	const navigation = useNavigation();
	const [showDialog,setShowDialog] = useState(false);

	// Hook de tracking Android para detenerlo automáticamente
	const {
		isTrackingActive,
		stopPatrolTracking,
	} = useAndroidUserTracking();

	// Función principal para terminar la ronda
	const handleEndRound = useCallback(async (notes?: string) => {
		console.log('[DEBUG EndRound] handleEndRound called',{notes,roundId,roundName});
		if (!roundId) {
			console.log('[DEBUG EndRound] No roundId available');
			showErrorToast('No hay ronda activa para terminar');
			return false;
		}

		try {
			addAppBreadcrumb({
				category: 'rounds.end',
				data: {
					completionPercentage,
					hasNotes: !!notes,
					roundId,
					roundName,
					wasTracking: isTrackingActive
				},
				message: 'Iniciando finalización de ronda con tracking',
			});

			// 1. Terminar la ronda en el backend
			await endRound({notes,roundId});

			// 2. Detener tracking Android si está activo
			if (isTrackingActive) {
				try {
					stopPatrolTracking();
					addAppBreadcrumb({
						category: 'tracking.stop',
						data: {reason: 'round_ended',roundId},
						message: 'Tracking detenido automáticamente por fin de ronda',
					});
				} catch (trackingError) {
					// No fallar la finalización de ronda por errores de tracking
					Sentry.captureException(trackingError,{
						tags: {action: 'stop_on_round_end',feature: 'tracking'}
					});
				}
			}

			// 3. Cerrar diálogo y navegar
			setShowDialog(false);
			navigation.goBack();

			return true;

		} catch (error) {
			// Log error for debugging

			const errorMessage = error instanceof Error
				? error.message
				: 'Error desconocido al terminar la ronda';

			showErrorToast(`Error: ${errorMessage}`);

			Sentry.captureException(error,{
				extra: {
					completionPercentage,
					isTrackingActive,
					notes,
					roundId,
					roundName
				},
				tags: {
					action: 'end_with_tracking',
					completion: isCompleted ? 'complete' : 'incomplete',
					feature: 'rounds'
				}
			});

			return false;
		}
	},[completionPercentage,endRound,isCompleted,isTrackingActive,navigation,roundId,roundName,stopPatrolTracking]);

	// Función para mostrar diálogo de confirmación  
	const showEndRoundDialog = useCallback(() => {
		console.log('[DEBUG EndRound] showEndRoundDialog called',{isEndingRound,roundId,roundName});
		if (isEndingRound) {
			console.log('[DEBUG EndRound] Prevented - isEndingRound is true');
			return; // Prevenir múltiples diálogos
		}
		console.log('[DEBUG EndRound] Setting showDialog to true');
		setShowDialog(true);
	},[isEndingRound,roundId,roundName]);

	// Función para cerrar diálogo
	const hideEndRoundDialog = useCallback(() => {
		setShowDialog(false);
	},[]);

	// Función rápida para finalizar sin notas ni confirmación
	const quickEndRound = useCallback(() => {
		handleEndRound();
	},[handleEndRound]);

	return {
		// Estado
		canEnd: !!roundId,
		isEndingRound,
		willStopTracking: isTrackingActive,

		// Diálogo
		hideEndRoundDialog,
		showDialog,
		showEndRoundDialog,

		// Funciones principales
		handleEndRound,
		quickEndRound,

		// Estado de tracking
		isTrackingActive,
	};
}