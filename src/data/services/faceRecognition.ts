import type {RecognizeFacePayload} from "@/hooks/mutations/useFaceRecognition";
import {instance} from "../instance";
import type {BiometricsResponse} from "@/types/biometrics";

export const recognizeFace = async (
	payload: RecognizeFacePayload
): Promise<BiometricsResponse> => {
	const formData = new FormData();

	formData.append('file',payload.file);
	formData.append('latitude',payload.latitude.toString());
	formData.append('longitude',payload.longitude.toString());

	const response = await instance.post<BiometricsResponse>(
		'/auth/biometrics',
		formData,
		{
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		}
	);

	return response.data;
};