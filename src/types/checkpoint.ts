export interface CheckpointLog {
	checkpointId: string;
	checkpointName: string;
	evidences?: string[]; // URLs de imágenes o paths locales
	guardId: string;
	guardName: string;
	id: string;
	note?: string; // observación del guardia
	status: 'completed' | 'pending' | 'skipped';
	timestamp: string; // ISO string
}