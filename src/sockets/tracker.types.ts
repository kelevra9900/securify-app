import type {SocketEventsMap,SocketHandler} from "./events.base";

export interface TrackUser {
	firstName: string;
	id: number;
	jobPosition?: string;
	lastName: string;
}

export interface LocationPayload {
	latitude: number;
	longitude: number;
}

/** server -> client (NO incluimos connect/disconnect/connect_error) */
export interface TrackerListenEvents extends SocketEventsMap {
	"realtime_user_list": SocketHandler<[TrackUser[]]>;
	"tracker:location:skip": SocketHandler<[{reason: string}]>;
}

/** client -> server */
export interface TrackerEmitEvents extends SocketEventsMap {
	new_location: SocketHandler<[LocationPayload]>;
	update_location: SocketHandler<[LocationPayload]>;
}
