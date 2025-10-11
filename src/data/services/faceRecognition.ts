/* eslint-disable @typescript-eslint/no-explicit-any */
import type {RecognizeFacePayload} from "@/hooks/mutations/useFaceRecognition";
import {instance} from "../instance";
import type {BiometricsResponse} from "@/types/biometrics";

export const recognizeFace = async (
	payload: RecognizeFacePayload
): Promise<BiometricsResponse> => {
	const form = new FormData();
	const rawUri = (payload.file)?.uri as string | undefined;
	const normalizedUri = rawUri
		? rawUri.startsWith('file://') || rawUri.startsWith('content://')
			? rawUri
			: `file://${rawUri}`
		: undefined;

	if (!normalizedUri) {
		throw new Error('Invalid file uri for face recognition');
	}

	form.append('file',{
		name: (payload.file as any)?.name ?? `face_${Date.now()}.jpg`,
		type: (payload.file as any)?.type ?? 'image/jpeg',
		uri: normalizedUri as any,
	} as any);

	if (typeof payload.latitude === 'number') {
		form.append('latitude',String(payload.latitude));
	}
	if (typeof payload.longitude === 'number') {
		form.append('longitude',String(payload.longitude));
	}

	// Usa EXACTAMENTE la ruta que te funciona en Swagger:
	const {data} = await instance.post<BiometricsResponse>(
		'mobile/auth/biometrics',
		form,
		{
			transformRequest: v => v,
		},
	);
	return data;
};


export const recognizeFaceLogout = async (
	payload: RecognizeFacePayload
) => {
	const form = new FormData();
	const rawUri = (payload.file)?.uri as string | undefined;
	const normalizedUri = rawUri
		? rawUri.startsWith('file://') || rawUri.startsWith('content://')
			? rawUri
			: `file://${rawUri}`
		: undefined;

	if (!normalizedUri) {
		throw new Error('Invalid file uri for face recognition');
	}

	form.append('refreshToken',payload.refreshToken)

	form.append('file',{
		name: (payload.file as any)?.name ?? `face_${Date.now()}.jpg`,
		type: (payload.file as any)?.type ?? 'image/jpeg',
		uri: normalizedUri as any,
	} as any);

	if (typeof payload.latitude === 'number') {
		form.append('latitude',String(payload.latitude));
	}
	if (typeof payload.longitude === 'number') {
		form.append('longitude',String(payload.longitude));
	}

	// Usa EXACTAMENTE la ruta que te funciona en Swagger:
	const {data} = await instance.post<BiometricsResponse>(
		'auth/logout',
		form,
		{
			transformRequest: v => v,
		},
	);
	return data;
}