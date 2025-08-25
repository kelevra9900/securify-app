import type {UseMutationResult} from '@tanstack/react-query';
import {useMutation} from '@tanstack/react-query';
import {useDispatch} from 'react-redux';

import {recognizeFace} from '@/data/services/faceRecognition';
import {flashError,flashSuccess} from '@/utils/flashMessageHelper';
import {type BiometricsResponse,isBiometricsOk} from '@/types/biometrics';
import {setCredentials} from '@/store/reducers/auth';
import type {AxiosError} from 'axios';


export interface RecognizeFacePayload {
	file: File;
	latitude?: number;
	longitude?: number;
}

export const useFaceRecognition = (): UseMutationResult<
	BiometricsResponse,
	AxiosError,
	RecognizeFacePayload
> => {
	const dispatch = useDispatch();

	return useMutation({
		mutationFn: recognizeFace,
		onError: (error) => {
			// eslint-disable-next-line no-console
			console.log('🚨 [On SignIn Error]',{
				code: error.code,
				data: (error.response as any)?.data?.error,
				message: error.message,
				status: error.response?.status,
			});
			flashError('No se pudo reconocer tu rostro',error.message);
		},
		onSuccess: (data) => {
			if (isBiometricsOk(data)) {
				dispatch(setCredentials({token: data.jwt}));
				flashSuccess('Inicio de sesión exitoso');
			} else {
				// matched === false
				flashError('Acceso denegado',data.message);
			}
		},
	});
}