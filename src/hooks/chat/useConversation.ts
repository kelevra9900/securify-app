/* eslint-disable @typescript-eslint/no-explicit-any */
import type {InfiniteData} from '@tanstack/react-query';
import type {MessagesPage,WsMessage} from '@/data/services/chat';

import {useInfiniteQuery,useQueryClient} from '@tanstack/react-query';
import {useCallback,useEffect,useMemo} from 'react';

import {getConversationMessages} from '@/data/services/chat';
import {useGetCurrentUser} from '@/hooks/user/current_user';

import {type ServerToClientEvents,useChatSocket} from './useChatSocket';

export const QUERY_KEY = (id: number) => ['chat','conversation',id] as const;
const mkClientId = () => `c${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

export function useConversation(conversationId: number) {
  const {connected,emit,on} = useChatSocket();
  const qc = useQueryClient();
  const {data: me} = useGetCurrentUser();

  const q = useInfiniteQuery<
    MessagesPage,
    Error,
    InfiniteData<MessagesPage,number | undefined>,
    ReturnType<typeof QUERY_KEY>,
    number | undefined
  >({
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
    () => q.data?.pages.flatMap((p) => p.items).reverse() ?? [],
    [q.data],
  );

  // Unirse al room + escuchar mensajes en tiempo real
  useEffect(() => {
    if (!connected) {
      return;
    }

    emit('join_conversation',{conversationId});

    const onNewMessage: ServerToClientEvents['message:new'] = (msg) => {
      if (msg.conversationId !== conversationId) {
        return;
      }
      qc.setQueryData<InfiniteData<MessagesPage>>(
        QUERY_KEY(conversationId),
        (prev) => {
          if (!prev) {
            return prev;
          }
          const first = prev.pages[0];
          if (!first) {
            return prev;
          }
          const optimisticIndex: any = msg.clientId ? first.items.findIndex((m) => m.clientId === msg.clientId) : -1;

          if (optimisticIndex !== -1) {
            const newItems: any = [...first.items];
            newItems[optimisticIndex] = msg;
            const updatedFirst: MessagesPage = {...first,items: newItems};
            return {...prev,pages: [updatedFirst,...prev.pages.slice(1)]};
          }
          if (first.items.some((m) => m.id === msg.id && m.id > 0)) {
            return prev;
          }

          const updatedFirst: MessagesPage = {
            ...first,
            items: [msg as any,...first.items],
          };
          return {...prev,pages: [updatedFirst,...prev.pages.slice(1)]};
        },
      );
    };

    const onMessageAck: ServerToClientEvents['message:ack'] = (ack) => {
      if (ack.conversationId !== conversationId || !ack.clientId) {return;}

      qc.setQueryData<InfiniteData<MessagesPage>>(
        QUERY_KEY(conversationId),
        (prev: any) => {
          if (!prev) {return prev;}

          const newPages = prev.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.clientId === ack.clientId
                ? {...item,clientId: null,id: ack.messageId}
                : item,
            ),
          }));

          return {...prev,pages: newPages};
        },
      );
    };

    const offNew = on('message:new',onNewMessage);
    const offAck = on('message:ack',onMessageAck);

    return () => {
      offNew();
      offAck();
    };
  },[connected,conversationId,qc,emit,on]);

  const send = useCallback((text: string) => {
    const content = text.trim();
    if (!content || !me?.user.id) {
      return;
    }
    const clientId = mkClientId();

    const optimisticMessage: WsMessage = {
      clientId,
      content,
      conversationId,
      createdAt: new Date().toISOString(),
      fromUserId: me.user.id,
      id: -Date.now(), // ID temporal negativo
      toUserId: null,
    };

    qc.setQueryData<InfiniteData<MessagesPage>>(QUERY_KEY(conversationId),(prev) => {
      if (!prev) {return prev;}
      const first = prev.pages[0];
      const updatedFirst: MessagesPage = {...first,items: [optimisticMessage,...first.items]};
      return {...prev,pages: [updatedFirst,...prev.pages.slice(1)]};
    });

    emit('send_message',{clientId,conversationId,message: content});
  },[conversationId,emit,qc,me?.user.id]);

  return {
    ...q,
    messages,
    send,
  };
}
