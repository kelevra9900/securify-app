// Handlers bivariantes (compatibles con TS y Socket.IO)
export type SocketHandler<Args extends readonly unknown[] = readonly unknown[]> = {
	bivarianceHack(...args: Args): void;
}["bivarianceHack"];

// 👇 NO opcional (cumple Record<string, (...args:any[])=>void>)
export interface SocketEventsMap {
	[event: string]: SocketHandler;
}
