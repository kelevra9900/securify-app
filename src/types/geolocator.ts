export interface Coordinates {
	accuracy: number;
	altitude: null | number;
	heading: null | number;
	latitude: number;
	longitude: number;
	speed: null | number;
}

export interface Position {
	coords: Coordinates;
	timestamp: number;
}

export interface PositionError {
	code: number;
	message: string;
}
