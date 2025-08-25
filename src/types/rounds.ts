export type RoundListItem = {
	checkpoints: Checkpoint[],
	endISO: null | string;
	id: number;
	name: string;
	startISO: string;
	status: 'ACTIVE' | 'COMPLETED' | 'IN_PROGRESS' | 'VERIFIED';
	totalCheckpoints: number;
};

export type Checkpoint = {
	id: number;
	location: string,
}

export type RoundDetail = {
	checkpoints: {id: number; latitude: number; location: string; longitude: number;}[];
	endISO: null | string;
	id: number;
	logs: {checkpointId: number; timestampISO: string;}[];
	name: string;
	remainingMinutes: null | number;
	startISO: string;
};

export type PastRound = {
	date: string;                          // ya formateada en pantalla (ej: "21 junio, 06:00 AM")
	id: string;
	name: string;
	status: 'completed' | 'incomplete';
};

export function mapPastStatus(s: RoundListItem['status']): PastRound['status'] {
	return s === 'COMPLETED' || s === 'VERIFIED' ? 'completed' : 'incomplete';
}