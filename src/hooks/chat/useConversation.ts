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
      getConversationMessages(conversationId,{cursor: pageParam,limit: 50}),
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const normalizeMsg = (m: any) => ({
    content: m.content ?? m.message ?? '',
    conversationId: m.conversationId ?? m.roomId,
    createdAt: (m.createdAt ?? m.timestamp ?? new Date().toISOString()),
    id: m.id,
    type: m.type ?? 'TEXT',
    // 👇 unifica emisor
    clientId: m.clientId ?? m.client_id ?? undefined,
    fromUserId: Number(
      m.fromUserId ??
      m.senderId ??
      m.from_user_id ??
      m.sender_id ??
      m.sender?.id
    ),
    seen: m.seen ?? false,
    sender: m.sender ?? m.fromUser ?? null, // opcional para avatar/nombre
    toUserId: m.toUserId ?? m.to_user_id ?? null,
  });


  const messages = useMemo<WsMessage[]>(
    () => {
      const flat = q.data?.pages.flatMap((p) => p.items).map(normalizeMsg).reverse() ?? [];
      const map = new Map<string,WsMessage>();
      for (const m of flat) {map.set(`${m.clientId ?? ''}|${m.id}`,m);}
      const unique = [...map.values()];
      return unique;
    },
    [q.data]
  );




  // Unirse al room + escuchar mensajes en tiempo real
  useEffect(() => {
    if (!connected) {
      return;
    }

    emit('join_conversation',{conversationId});

    const onNewMessage: ServerToClientEvents['message:new'] = (msg) => {
      if (msg.conversationId !== conversationId) {return;}

      qc.setQueryData<InfiniteData<MessagesPage>>(QUERY_KEY(conversationId),(prev) => {
        if (!prev) {return prev;}
        const pages = prev.pages.map(p => ({...p,items: [...p.items]}));

        if (msg.clientId) {
          for (const page of pages) {
            const i = page.items.findIndex(m => m.clientId === msg.clientId);
            if (i !== -1) {page.items[i] = msg as any; return {...prev,pages};}
          }
        }
        for (const page of pages) {
          if (page.items.some(m => m.id === msg.id && m.id > 0)) {return prev;}
        }
        pages[0].items = [...pages[0].items,msg as any];
        return {...prev,pages};
      });
    };



    const onMessageAck: ServerToClientEvents['message:ack'] = (ack) => {
      if (ack.conversationId !== conversationId || !ack.clientId) {return;}

      qc.setQueryData(QUERY_KEY(conversationId),(prev: any) => {
        if (!prev) {return prev;}
        const pages = prev.pages.map((p: any) => ({
          ...p,
          items: p.items.map((it: any) =>
            it.clientId === ack.clientId ? {...it,clientId: null,id: ack.messageId} : it
          ),
        }));
        return {...prev,pages};
      });
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
      const updatedFirst: MessagesPage = {...first,items: [...first.items,optimisticMessage]};
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
