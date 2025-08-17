import type {RecognizeFacePayload} from "@/hooks/mutations/useFaceRecognition";
import {instance} from "../instance";
import type {BiometricsResponse} from "@/types/biometrics";

export const recognizeFace = async (
	payload: RecognizeFacePayload
): Promise<BiometricsResponse> => {
	const form = new FormData();

	// 👇 Asegúrate que sea { uri, name, type }
	form.append('file',{
		name: payload.file.name ?? `face_${Date.now()}.jpg`,
		type: payload.file.type ?? 'image/jpeg',
		uri: payload.file.uri,
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
