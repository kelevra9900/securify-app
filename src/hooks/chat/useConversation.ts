// src/hooks/chat/useConversation.ts
import {useEffect,useMemo} from 'react';
import {type InfiniteData,useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {getConversationMessages,type MessagesPage,type WsMessage} from '@/data/services/chat';
import {useChatSocket} from './useChatSocket';

const QUERY_KEY = (id: number) => ['chat','conversation',id] as const;

export function useConversation(conversationId: number) {
	const {connected,socket} = useChatSocket();
	const qc = useQueryClient();

	const q = useInfiniteQuery<MessagesPage,Error,InfiniteData<MessagesPage,number | undefined>,ReturnType<typeof QUERY_KEY>,number | undefined>({
		queryKey: QUERY_KEY(conversationId),
		// ⬇️ requerido en v5 (usa undefined para primera página)
		getNextPageParam: (last) => last.nextCursor ?? undefined,
		initialPageParam: undefined,
		queryFn: ({pageParam}) =>
			getConversationMessages(conversationId,{cursor: pageParam,limit: 30}),
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
		staleTime: 30_000,
	});

	const messages = useMemo<WsMessage[]>(
		() => q.data?.pages.flatMap((p) => p.items) ?? [],
		[q.data]
	);

	// Unirse al room + escuchar mensajes en tiempo real
	useEffect(() => {
		if (!connected) {return;}

		socket.emit('join_conversation',{conversationId});

		// OJO: usa el nombre de evento que emite tu servidor.
		// Si tu gateway emite 'receive_message', cambia aquí:
		const onMessage = (msg: WsMessage) => {
			if (msg.conversationId !== conversationId) {return;}

			qc.setQueryData<InfiniteData<MessagesPage,number | undefined>>(QUERY_KEY(conversationId),(prev) => {
				if (!prev) {return prev;}
				const first = prev.pages[0];
				if (!first) {return prev;}

				// evita duplicados
				if (first.items.some((m) => m.id === msg.id)) {return prev;}

				const updatedFirst: MessagesPage = {...first,items: [msg,...first.items]};
				return {...prev,pages: [updatedFirst,...prev.pages.slice(1)]};
			});
		};

		socket.on('message',onMessage); // o 'receive_message' según backend

		return () => {
			socket.off('message',onMessage); // o 'receive_message'
		};
	},[connected,conversationId,qc,socket]);

	const send = (text: string) => {
		const content = text.trim();
		if (!content) {return;}
		socket.emit('send_message',{conversationId,message: content});
	};

	return {
		...q,
		messages,
		send,
	};
}
