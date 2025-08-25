// src/lib/socket/chat.ts
import type {Socket} from 'socket.io-client';
import {io} from 'socket.io-client';
import Config from 'react-native-config';
import {API_URL} from '@/utils/constants';

function getWsOrigin() {
	try {
		const base = API_URL || Config.API_URL || '';
		const u = new URL(base);
		return u.origin;
	} catch {
		return (API_URL || Config.API_URL || '').replace(/\/+$/,'');
	}
}

export type ChatSocket = Socket<{
	join_conversation: (payload: {conversationId: number}) => void;
	send_message: (payload: {conversationId: number; message: string}) => void;

	// eventos entrantes (server -> client)
	message: (msg: {
		content: string;
		conversationId: number;
		createdAt: string;
		fromUser?: {firstName?: null | string; id: number; image?: null | string; lastName?: null | string;};
		fromUserId: number;
		id: number;
		toUserId: number;
	}) => void;
}>;

let socketRef: ChatSocket | null = null;

/** Devuelve (y crea si falta) el socket del chat */
export function getChatSocket(getToken: () => string | undefined): ChatSocket {
	if (socketRef && socketRef.connected) {return socketRef;}

	// Si ya existía pero desconectado, reciclamos la instancia para no duplicar listeners
	if (socketRef && !socketRef.connected) {return socketRef;}

	const origin = getWsOrigin();
	const namespaceUrl = `${origin}/v2/chat`; // <- tu namespace

	socketRef = io(namespaceUrl,{
		autoConnect: false,
		forceNew: false,
		reconnection: true,
		reconnectionAttempts: Infinity,
		reconnectionDelay: 800,
		reconnectionDelayMax: 5000,
		timeout: 10_000,
		transports: ['websocket'],  // evita polling en RN

		// Handshake auth
		auth: () => {
			const token = getToken();
			return token ? {token} : {};
		},

		// Si tu server usa un path custom: path: '/socket.io',
		// extraHeaders no es necesario en RN si usas auth en handshake
	}) as ChatSocket;

	return socketRef;
}

/** Cierra y limpia la instancia global (opcional en logout) */
export function disposeChatSocket() {
	if (socketRef) {
		socketRef.removeAllListeners();
		socketRef.disconnect();
		socketRef = null;
	}
}
