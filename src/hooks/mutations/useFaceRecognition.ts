import type {UseMutationResult} from '@tanstack/react-query';
import {useMutation} from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import {useDispatch} from 'react-redux';

import {recognizeFace} from '@/data/services/faceRecognition';
import {flashError,flashSuccess} from '@/utils/flashMessageHelper';
import {type BiometricsResponse,isBiometricsOk} from '@/types/biometrics';
import {setCredentials} from '@/store/reducers/auth';
import type {AxiosError} from 'axios';
import { isOnline } from '@/utils/network';


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
		// Verifica conexión antes de llamar al backend
		mutationFn: async (payload) => {
			const { ok } = await isOnline();
			if (!ok) {
				const offlineErr: Partial<AxiosError> = {
					code: 'OFFLINE',
					message: 'Sin conexión a Internet',
				} as any;
				throw offlineErr;
			}
			return recognizeFace(payload);
		},
		onError: (error,variables) => {
			// eslint-disable-next-line no-console
			console.log('🚨 [FaceRecognition Error]',{
				code: error.code,
				data: (error.response as any)?.data?.error,
				message: error.message,
				status: error.response?.status,
			});
			Sentry.withScope(scope => {
				scope.setLevel('error');
				scope.setTag('feature','face_recognition');
				scope.setFingerprint(['face-recognition',String(error.response?.status ?? 'unknown')]);
				scope.setExtras({
					code: error.code,
					message: error.message,
					server_error: (error.response as any)?.data?.error,
					status: error.response?.status,
				});
				if (variables) {
					scope.setContext('request',{
						hasFile: Boolean(variables.file),
						latitude: variables.latitude,
						longitude: variables.longitude,
					});
				}
				Sentry.captureException(error);
			});
			if (error.code === 'OFFLINE' || error.code === 'ERR_NETWORK') {
				flashError('Sin conexión', 'Verifica tu conexión a Internet.');
			} else {
				flashError('No se pudo reconocer tu rostro',error.message);
			}
		},
		onMutate: (variables) => {
			Sentry.addBreadcrumb({
				category: 'action',
				data: {
					feature: 'face_recognition',
					hasFile: Boolean(variables?.file),
					latitude: variables?.latitude,
					longitude: variables?.longitude,
				},
				level: 'info',
				message: 'Face recognition request started',
			});
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
