import {flashSuccess} from '@/utils/flashMessageHelper';

export const usePanicFAB = () => {

	const triggerSOS = () => {
		flashSuccess('¡SOS enviado!','Un supervisor ha sido notificado.');
	};

	return {triggerSOS};
};