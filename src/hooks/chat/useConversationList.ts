import {useCallback,useEffect,useState} from 'react';
import {useChatSocket} from './useChatSocket'; // el que ya montaste para /v2/chat
import {useGetCurrentUser} from '@/hooks/user/current_user';

export type ConversationListItem = {
	conversationId: number;
	isGroup: boolean;
	lastMessage: {
		content: string;
		createdAt: string; // ISO
		fromUser?: {firstName?: string; id: number; image?: null | string; lastName?: string;};
		id: number;
	} | null;
	otherParticipant: {firstName?: string; id: number; image?: null | string; lastName?: string;} | null;
	// UI-only:
	unread?: boolean;
};

type ConversationsPayload = Array<ConversationListItem>;

// evento del gateway cuando llega un mensaje nuevo
type ReceiveMessageEvent = {
	conversationId: number;
	message: {
		content: string;
		conversationId: number;
		createdAt: string; // ISO
		fromUser?: {id: number; username?: string};
		fromUserId: number;
		id: number;
		toUserId: number;
	};
};

export function useConversationList() {
	const {connected,socket} = useChatSocket(); // namespace /v2/chat
	const {data: me} = useGetCurrentUser(); // para determinar unread
	const myId = me?.user.id;

	const [loading,setLoading] = useState(true);
	const [items,setItems] = useState<ConversationListItem[]>([]);
	const [error,setError] = useState<null | string>(null);

	const requestList = useCallback(() => {
		if (!connected) {return;}
		setLoading(true);
		setError(null);
		socket.emit('get_user_conversations');
	},[connected,socket]);

	// Inicial + refresco por evento
	useEffect(() => {
		if (!connected) {return;}
		// pedir lista inicial
		requestList();

		const onList = (list: ConversationsPayload) => {
			// marca unread local si el último mensaje es de otro usuario
			const enriched = list.map((c) => {
				const fromId = c.lastMessage?.fromUser?.id;
				return {...c,unread: fromId != null && myId != null && fromId !== myId};
			});

			setItems(enriched);
			setLoading(false);

			// unirse a rooms para recibir receive_message
			enriched.forEach((c) => {
				socket.emit('join_room',{conversationId: c.conversationId});
			});
		};

		const onError = (e: any) => {
			setError(typeof e?.message === 'string' ? e.message : 'No se pudo cargar conversaciones');
			setLoading(false);
		};

		socket.on('user_conversations',onList);
		socket.on('error',onError);

		return () => {
			socket.off('user_conversations',onList);
			socket.off('error',onError);
		};
	},[connected,myId,requestList,socket]);

	// Mensajes en tiempo real: atualiza último mensaje y reordena
	useEffect(() => {
		if (!connected) {return;}

		const onReceive = (evt: ReceiveMessageEvent) => {
			setItems((prev) => {
				const idx = prev.findIndex((c) => c.conversationId === evt.conversationId);
				const lastMsg = {
					content: evt.message.content,
					createdAt: evt.message.createdAt,
					fromUser: evt.message.fromUser ? {id: evt.message.fromUser.id} : undefined,
					id: evt.message.id,
				};

				// si no existía (ej. conversación recién creada), agrega
				if (idx === -1) {
					const newItem: ConversationListItem = {
						conversationId: evt.conversationId,
						isGroup: false, // si necesitas, puedes pedir al backend que lo incluya en el evento
						lastMessage: lastMsg,
						otherParticipant: null,
						unread: myId != null && evt.message.fromUserId !== myId,
					};
					return [newItem,...prev];
				}

				// actualiza y reordena (al inicio)
				const updated = [...prev];
				const curr = updated[idx];
				const unread = myId != null && evt.message.fromUserId !== myId;

				updated[idx] = {...curr,lastMessage: lastMsg,unread};
				// mueve a la primera posición
				const [it] = updated.splice(idx,1);
				return [it,...updated];
			});
		};

		// OJO: tu gateway emite: io.to(...).emit('receive_message', { conversationId, message: {...} })
		socket.on('receive_message',onReceive);

		return () => {
			socket.off('receive_message',onReceive);
		};
	},[connected,myId,socket]);

	const refresh = useCallback(() => requestList(),[requestList]);

	return {error,items,loading,refresh};
}
