import {API_URL} from "../constants";

export const SOCKET_BASE_URL = API_URL

export const defaultSocketOptions = (token: string) => ({
	auth: {token},
	autoConnect: false,
	path: "/socket.io",
	reconnection: true,
	reconnectionAttempts: 10,
	reconnectionDelay: 1500,
	timeout: 20_000,
	transports: ["websocket","polling"],
	withCredentials: true,
});
