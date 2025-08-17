import {flashSuccess} from '@/utils/flashMessageHelper';
// import {useBackgroundLocationTracking} from '@/hooks/geolocation/useBackgroundLocationTracking';

export const usePanicFAB = () => {
	// const {startTracking} = useBackgroundLocationTracking();

	const triggerSOS = () => {
		flashSuccess('¡SOS enviado!','Un supervisor ha sido notificado.');
		// startTracking();
	};

	return {triggerSOS};
};