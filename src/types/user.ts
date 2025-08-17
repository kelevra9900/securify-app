/* eslint-disable @typescript-eslint/no-explicit-any */
import {instance} from "@/data/instance";
import {END_POINTS} from "@/utils/constants";
import type {AxiosError,AxiosRequestConfig} from "axios";

/* ================================
 * Tipos (tus tipos tal cual)
 * ================================ */
export type Role =
	| 'ADMIN'
	| 'CHIEF_SECURITY'
	| 'COORDINATOR'
	| 'OPERATOR'
	| 'SECURITY_ANALYST'
	| 'SUPER_ADMIN'
	| 'USER';

export interface JobPositionLite {
	icon: null | string;
	id: number;
	name: string;
}

export interface UserLite {
	banned: boolean | null;
	email: string;
	emailVerified: boolean;
	environmentId: null | number;
	firstName: string;
	id: number;
	image: null | string;
	jobPosition: JobPositionLite | null;
	lastName: string;
	role: Role | string;
	username: string;
}

export interface EnvironmentBrand {
	id: number;
	logo: null | string;
	name: string;
	primaryColor: string;
	secondaryColor: string;
}

export interface ClientContext {
	locale: string;
	platform: 'android' | 'ios' | string;
	timezone: string;
}

export interface FeatureFlags {
	chatV2: boolean;
	faceLogin: boolean;
	overtimeRequests: boolean;
}

export interface Permissions {
	canCheckIn: boolean;
	canCreateAlert: boolean;
	canRequestOvertime: boolean;
	canSeeAnnouncements: boolean;
	isAdmin: boolean;
}

export interface SessionMeta {
	serverTime: string;
	tokenExp?: number;
}

export interface CurrentUserData {
	client: ClientContext;
	environment: EnvironmentBrand | null;
	features: FeatureFlags;
	permissions: Permissions;
	session: SessionMeta;
	user: UserLite;
}

export type CurrentUserResponse =
	| {data: CurrentUserData; etag?: string; ok: true;}
	| {error: {code: string; message: string; status: number}; ok: false;};

/* Helpers para narrow de tipos */
type CurrentUserSuccess = Extract<CurrentUserResponse,{ok: true}>;
type CurrentUserError = Extract<CurrentUserResponse,{ok: false}>;

/* ================================
 * Normalizador de errores de Axios
 * ================================ */
function toCurrentUserError(e: unknown): CurrentUserError {
	const ax = e as AxiosError<any>;
	const status = ax.response?.status ?? 500;
	// Si tu backend devuelve { ok:false, error:{...} } en el body, úsalo:
	const apiErr = ax.response?.data?.error;
	if (apiErr && typeof apiErr === 'object') {
		return {
			error: {
				code: String(apiErr.code ?? 'UNKNOWN_ERROR'),
				message: String(apiErr.message ?? 'Unexpected error'),
				status: Number(apiErr.status ?? status),
			},ok: false
		};
	}
	// Fallback genérico
	return {
		error: {
			code: 'HTTP_ERROR',
			message: ax.message || 'Network / HTTP error',
			status,
		},ok: false
	};
}

/* ==========================================================
 * GET /v2/mobile/user  →  CurrentUserResponse (tipado)
 * - Lee ETag del header si viene y lo inyecta al body (opcional)
 * - Si Axios lanza (4xx/5xx), devuelve CurrentUserResponse ok:false
 * - Puedes pasar config para cancelar o sobreescribir headers puntuales
 * ========================================================== */
export async function getCurrentUser(
	config?: AxiosRequestConfig,
): Promise<CurrentUserResponse> {
	try {
		const resp = await instance.get<CurrentUserSuccess>(END_POINTS.user,config);
		const etagHeader = (resp.headers as any)?.etag as string | undefined;
		if (etagHeader && resp.data?.ok) {
			return {...resp.data,etag: etagHeader};
		}
		return resp.data;
	} catch (error) {
		return toCurrentUserError(error);
	}
}

/* =========================================
 * (Opcional) guard utilitario para el caller
 * ========================================= */
export function isOkCurrentUser(
	r: CurrentUserResponse,
): r is CurrentUserSuccess {
	return (r as any)?.ok === true;
}

/* =========================================
 * (Opcional) ejemplo de uso
 * =========================================
 *
 * const res = await getCurrentUser();
 * if (isOkCurrentUser(res)) {
 *   dispatch(setUser(res.data.user));
 * } else {
 *   Alert.alert('Error', `${res.error.status} - ${res.error.message}`);
 * }
 */