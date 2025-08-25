import type {Socket} from "socket.io-client";
import {io} from "socket.io-client";
import type {SocketEventsMap} from "./events.base";
import {defaultSocketOptions,SOCKET_BASE_URL} from "@/utils/sockets/config";

/** Crea un socket tipado para un namespace */
export function createNamespaceSocket<
	ListenEvents extends SocketEventsMap,
	EmitEvents extends SocketEventsMap
>(namespace: string,token: string): Socket<ListenEvents,EmitEvents> {
	return io(`${SOCKET_BASE_URL}${namespace}`,defaultSocketOptions(token));
}
