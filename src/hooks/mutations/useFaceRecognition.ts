/* eslint-disable @typescript-eslint/no-explicit-any */
import type {UseMutationResult} from '@tanstack/react-query';
import type {AxiosError} from 'axios';
import type {BiometricsResponse} from '@/types/biometrics';

import * as Sentry from '@sentry/react-native';
import {useMutation} from '@tanstack/react-query';
import {useDispatch} from 'react-redux';

import {recognizeFace,recognizeFaceLogout} from '@/data/services/faceRecognition';
import {setCredentials} from '@/store/reducers/auth';
import {isBiometricsOk} from '@/types/biometrics';
import {flashError,flashSuccess} from '@/utils/flashMessageHelper';
import {isOnline} from '@/utils/network';

export interface RecognizeFacePayload {
  file: any;
  latitude?: number;
  longitude?: number;
  refreshToken?: string | undefined
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
      const {ok} = await isOnline();
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
      const status = error.response?.status;
      const responseData = (error.response?.data ?? {}) as any;
      const serverMessage =
        responseData?.message ?? responseData?.error ?? undefined;
      const effectiveServerMessage =
        serverMessage ??
        (typeof responseData === 'string' ? responseData : undefined);
      const normalizedCode =
        status && error.code?.startsWith('ERR_')
          ? `HTTP_${status}`
          : (error.code ?? (status ? `HTTP_${status}` : 'UNKNOWN'));
      // eslint-disable-next-line no-console
      console.log('🚨 [FaceRecognition Error]',{
        code: normalizedCode,
        data: responseData,
        message: error.message,
        status,
      });
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        scope.setTag('feature','face_recognition');
        scope.setFingerprint(['face-recognition',String(status ?? 'unknown')]);
        scope.setExtras({
          code: normalizedCode,
          message: error.message,
          server_error: effectiveServerMessage ?? responseData,
          status,
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
      if (normalizedCode === 'OFFLINE' || normalizedCode === 'ERR_NETWORK') {
        flashError('Sin conexión','Verifica tu conexión a Internet.');
      } else if (status === 409) {
        flashError(
          'Acceso denegado',
          effectiveServerMessage ??
          'Tu rostro no coincide con nuestros registros.',
        );
      } else {
        flashError(
          'No se pudo reconocer tu rostro',
          effectiveServerMessage ?? error.message,
        );
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
        dispatch(setCredentials({refreshToken: data.refreshToken,token: data.jwt}));
        flashSuccess('Inicio de sesión exitoso');
      } else {
        // matched === false
        flashError('Acceso denegado',data.message);
      }
    },
  });
};


export const useFaceRecognitionLogout = (): UseMutationResult<
  BiometricsResponse,
  AxiosError,
  RecognizeFacePayload
> => {
  return useMutation({
    mutationFn: async (payload) => {
      const {ok} = await isOnline();
      if (!ok) {
        const offlineErr: Partial<AxiosError> = {
          code: 'OFFLINE',
          message: 'Sin conexión a Internet',
        } as any;
        throw offlineErr;
      }
      return recognizeFaceLogout(payload)
    },
    onError: (error,variables) => {
      const status = error.response?.status;
      const responseData = (error.response?.data ?? {}) as any;
      const serverMessage =
        responseData?.message ?? responseData?.error ?? undefined;
      const effectiveServerMessage =
        serverMessage ??
        (typeof responseData === 'string' ? responseData : undefined);
      const normalizedCode =
        status && error.code?.startsWith('ERR_')
          ? `HTTP_${status}`
          : (error.code ?? (status ? `HTTP_${status}` : 'UNKNOWN'));
      // eslint-disable-next-line no-console
      console.log('🚨 [FaceRecognition Error]',{
        code: normalizedCode,
        data: responseData,
        message: error.message,
        status,
      });
      Sentry.withScope((scope) => {
        scope.setLevel('error');
        scope.setTag('feature','face_recognition_logout');
        scope.setFingerprint(['face-face_recognition_logout',String(status ?? 'unknown')]);
        scope.setExtras({
          code: normalizedCode,
          message: error.message,
          server_error: effectiveServerMessage ?? responseData,
          status,
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
      if (normalizedCode === 'OFFLINE' || normalizedCode === 'ERR_NETWORK') {
        flashError('Sin conexión','Verifica tu conexión a Internet.');
      } else if (status === 409) {
        flashError(
          'Acceso denegado',
          effectiveServerMessage ??
          'Tu rostro no coincide con nuestros registros.',
        );
      } else {
        flashError(
          'No se pudo reconocer tu rostro',
          effectiveServerMessage ?? error.message,
        );
      }
    },
  })
}