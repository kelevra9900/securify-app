import type {UseMutationResult} from '@tanstack/react-query';
import {useMutation} from '@tanstack/react-query';
import {useDispatch} from 'react-redux';

import {recognizeFace} from '@/data/services/faceRecognition';
import {flashError,flashSuccess} from '@/utils/flashMessageHelper';
import type {BiometricsResponse} from '@/types/biometrics';
import {setCredentials} from '@/store/reducers/auth';

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
	const dispatch = useDispatch();

	return useMutation({
		mutationFn: recognizeFace,
		onError: (error: Error) => {
			flashError('No se pudo reconocer tu rostro',error.message);
		},
		onSuccess: (data) => {
			if ('jwt' in data) {
				dispatch(setCredentials({token: data.jwt}));
				flashSuccess('Inicio de sesión exitoso');
			} else {
				flashError('Acceso denegado',data.message);
			}
		},
	});
};
