// src/hooks/chat/useConversationMessages.ts
import {useInfiniteQuery} from '@tanstack/react-query';
import {getConversationMessages,type MessagesPage} from '@/data/services/chat';

export const QUERY_KEY = (conversationId: number) =>
	['chat','conversation',conversationId] as const;

export function useConversationMessages(conversationId: number) {
	return useInfiniteQuery<MessagesPage,Error>({
		getNextPageParam: (last) => last.nextCursor ?? undefined,
		initialPageParam: undefined, // **requerido por RQ 5**
		queryFn: ({pageParam}) =>
			getConversationMessages(conversationId,{
				cursor: (pageParam as number | undefined) ?? undefined,
				limit: 30,
			}),
		queryKey: QUERY_KEY(conversationId),
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
		staleTime: 30_000,
	});
}