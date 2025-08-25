export const SOCKET_BASE_URL = 'https://9f443bb1a570.ngrok-free.app'

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
