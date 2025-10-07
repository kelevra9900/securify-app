/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from '@sentry/react-native';
import type {UseMutationResult} from "@tanstack/react-query";
import {useMutation} from "@tanstack/react-query"

import {loginWithCredentials} from "@/data/services/authentication"
import {refreshToken} from "@/data/services/user"
import type {AxiosError} from 'axios';
import {flashError} from '@/utils/flashMessageHelper';

type LoginPayload = {
	identifier: string,
	password: string
}
export const useLoginWithCredentials = (): UseMutationResult<
	any,
	AxiosError,
	LoginPayload
> => {

	return useMutation({
		mutationFn: (payload: LoginPayload) => {
			return loginWithCredentials(payload)
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
			console.log('🚨 [LoginWithCredentials Error]',{
				code: normalizedCode,
				data: responseData,
				message: error.message,
				status,
			});
			Sentry.withScope((scope) => {
				scope.setLevel('error');
				scope.setTag('feature','login');
				scope.setFingerprint(['login',String(status ?? 'unknown')]);
				scope.setExtras({
					code: normalizedCode,
					message: error.message,
					server_error: effectiveServerMessage ?? responseData,
					status,
				});
				if (variables) {
					scope.setContext('request',{
						identifier: variables.identifier,
						password: variables.password,
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
					'Tus credenciales no coinciden con nuestros registros.',
				);
			} else {
				flashError(
					'No se pudo reconocer tu identidad',
					effectiveServerMessage ?? error.message,
				);
			}
		}
	})
}

export const useRefreshToken = (): UseMutationResult<
	any,
	AxiosError,
	void
> => {
	return useMutation({
		mutationFn: () => refreshToken(),
	})
}
