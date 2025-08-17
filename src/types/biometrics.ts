// types/biometrics.ts
export type Role =
	| 'ADMIN'
	| 'CHIEF_SECURITY'
	| 'COORDINATOR'
	| 'OPERATOR'
	| 'SECURITY_ANALYST'
	| 'SUPER_ADMIN'
	| 'USER';

export interface BiometricsUser {
	email: string;
	id: number;
	name: string;
	role: Role | string;
}

export interface BiometricsOk {
	jwt: string;
	matched: true;
	message: string;
	role: Role | string;
	user: BiometricsUser;
}

export interface BiometricsFail {
	matched: false;
	message: string;
}

export type BiometricsResponse = BiometricsFail | BiometricsOk;

// Type guard útil:
export const isBiometricsOk = (r: BiometricsResponse): r is BiometricsOk =>
	r?.matched === true;
