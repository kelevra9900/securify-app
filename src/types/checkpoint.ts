export type CheckpointLog = {
	checkpointId: string;
	checkpointName: string;
	guardId?: string;       // <- hazlos opcionales
	guardName?: string;     // <- hazlos opcionales
	id: string;
	status: 'completed' | 'pending';
	timestamp?: string;     // si también puede faltar
};

export type Checkpoint = {
	checkedAt: string;
	environmentId: number;
	id: number;
	latitude: number;
	location: string;
	longitude: number;
	roundId: number;
}