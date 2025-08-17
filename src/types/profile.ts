// src/types/profile.ts
import type {
	EnvironmentBrand,
	HomeData,
	LastCheckpoint,
	Sector,
	Shift,
	UserSummary,
} from '@/types/home';

export interface ProfileState {
	environment: EnvironmentBrand | null;
	isLoaded: boolean;
	lastCheckpoint: LastCheckpoint | null;
	sector: null | Sector;
	serverTime?: string;
	shift: null | Shift;
	user: null | UserSummary;
}

export type SetFromHomePayload = {data: HomeData; serverTime?: string};
