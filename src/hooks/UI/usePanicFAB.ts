import {flashSuccess} from '@/utils/flashMessageHelper';

export const usePanicFAB = () => {
	const triggerSOS = () => {
		console.log('Mensaje SOS enviado');
		flashSuccess('¡SOS enviado!','Un supervisor ha sido notificado.');
	};

	return {triggerSOS};
};
