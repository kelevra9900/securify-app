export interface BiometricsSuccessResponse {
	jwt: string;
	message: string;
	role: string;
	user: {
		email: string;
		name: string;
	}
}


export interface BiometricsErrorResponse {
	matched: boolean;
	message: string;
}

export type BiometricsResponse = BiometricsErrorResponse | BiometricsSuccessResponse;