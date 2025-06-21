import type {UseMutationResult} from '@tanstack/react-query';
import {useMutation} from '@tanstack/react-query';
import {recognizeFace} from '@/data/services/faceRecognition';
import {flashError,flashSuccess} from '@/utils/flashMessageHelper';
import type {BiometricsResponse} from '@/types/biometrics';

export interface RecognizeFacePayload {
	file: File;
	latitude: number;
	longitude: number;
}

export const useFaceRecognition = (): UseMutationResult<
	BiometricsResponse,
	Error,
	RecognizeFacePayload
> => {
	return useMutation({
		mutationFn: recognizeFace,
		onError: (error: Error) => {
			// eslint-disable-next-line no-console
			console.error('Face recognition failed:',error);
			flashError('No se pudo reconocer tu rostro',error.message);
		},
		onSuccess: (data) => {
			flashSuccess('Reconocimiento exitoso',`Confianza: ${data.message}%`);
		},
	});
};
