import {useCallback,useEffect,useState} from 'react';

import {useGetCurrentUser} from '@/hooks/user/current_user';

import {type ServerToClientEvents,useChatSocket} from './useChatSocket';

export type ConversationListItem = {
  conversationId: number;
  isGroup: boolean;
  lastMessage: {
    content: string;
    createdAt: string; // ISO
    fromUser?: {
      firstName?: string;
      id: number;
      image?: null | string;
      lastName?: string;
    };
    id: number;
  } | null;
  otherParticipant: {
    firstName?: string;
    id: number;
    image?: null | string;
    lastName?: string;
  } | null;
  // UI-only:
  unread?: boolean;
};

export function useConversationList() {
  const {connected,emit,on} = useChatSocket();
  const {data: me} = useGetCurrentUser();
  const myId = me?.user.id;

  const [loading,setLoading] = useState(true);
  const [items,setItems] = useState<ConversationListItem[]>([]);
  const [error,setError] = useState<null | string>(null);

  const requestList = useCallback(() => {
    if (!connected) {
      return;
    }
    setLoading(true);
    setError(null);
    emit('get_user_conversations');
  },[connected,emit]);

  useEffect(() => {
    if (!connected) {
      return;
    }
    requestList();

    const onList = (list: ConversationListItem[]) => {
      const enriched = list.map((c) => {
        const fromId = c.lastMessage?.fromUser?.id;
        return {
          ...c,
          unread: fromId != null && myId != null && fromId !== myId,
        };
      });

      setItems(enriched);
      setLoading(false);
      enriched.forEach((c) => {
        emit('join_conversation',{conversationId: c.conversationId});
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onError = (e: any) => {
      setError(
        typeof e?.message === 'string'
          ? e.message
          : 'No se pudo cargar conversaciones',
      );
      setLoading(false);
    };

    const offList = on('user_conversations',onList);
    const offError = on('error',onError);

    return () => {offList(); offError();};
  },[connected,myId,requestList,on,emit]);

  // Mensajes en tiempo real: atualiza último mensaje y reordena
  useEffect(() => {
    if (!connected) {
      return;
    }

    const onNewMessage: ServerToClientEvents['message:new'] = (msg) => {
      setItems((prev) => {
        const idx = prev.findIndex(
          (c) => c.conversationId === msg.conversationId,
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lastMsg: any = {
          content: msg.content,
          createdAt: msg.createdAt,
          fromUser: msg.fromUser ?? undefined,
          id: msg.id,
        };

        // si no existía (ej. conversación recién creada), agrega
        if (idx === -1) {
          const newItem: ConversationListItem = {
            conversationId: msg.conversationId,
            isGroup: false, // si necesitas, puedes pedir al backend que lo incluya en el evento
            lastMessage: lastMsg,
            otherParticipant: null,
            unread: myId != null && msg.fromUserId !== myId,
          };
          return [newItem,...prev];
        }

        // actualiza y reordena (al inicio)
        const updated = [...prev];
        const curr = updated[idx];
        const unread = myId != null && msg.fromUserId !== myId;

        updated[idx] = {...curr,lastMessage: lastMsg,unread};
        // mueve a la primera posición
        const [it] = updated.splice(idx,1);
        return [it,...updated];
      });
    };

    const offNewMessage = on('message:new',onNewMessage);

    return () => {offNewMessage();};
  },[connected,myId,on]);

  const refresh = useCallback(() => requestList(),[requestList]);

  return {error,items,loading,refresh};
}
