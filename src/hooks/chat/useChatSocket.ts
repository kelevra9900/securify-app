/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/chat/useChatSocket.ts
import {useCallback,useEffect,useRef,useState} from 'react';
import {io,type Socket} from 'socket.io-client';
import {useSelector} from 'react-redux';
import {API_URL} from '@/utils/constants';
import type {RootState} from '@/store';
import type {ConversationListItem} from './useConversationList';

// --- TIPOS DE EVENTOS (Sincronizados con el Gateway de NestJS) ---

type WsMessage = {
  clientId?: null | string;
  content: string;
  conversationId: number;
  createdAt: string; // ISO
  fromUser?: {
    firstName?: null | string;
    id: number;
    image?: null | string;
    lastName?: null | string;
  };
  fromUserId: number;
  id: number;
  toUserId: null | number;
};

/** Eventos que el cliente (esta app) envía al servidor. */
export type ClientToServerEvents = {
  get_user_conversations: () => void;
  join_conversation: (p: {conversationId: number},ack?: (res: {ok: boolean}) => void) => void;
  leave_conversation: (p: {conversationId: number},ack?: (res: {ok: boolean}) => void) => void;
  'message:read': (p: {conversationId: number; messageId?: number; messageIds?: number[]},ack?: (res: {ok: boolean}) => void) => void;
  'presence:update': (p: {lastSeen?: string; online?: boolean; status?: 'offline' | 'online'},ack?: (res: any) => void) => void;
  send_message: (p: {clientId?: string; conversationId: number; message: string},ack?: (res: {deliveredAt: string; messageId: number; ok: boolean;}) => void) => void;
  'typing:start': (p: {conversationId: number}) => void;
  'typing:stop': (p: {conversationId: number}) => void;
};

/** Eventos que el servidor envía al cliente (esta app). */
export type ServerToClientEvents = {
  connect: () => void;
  connect_error: (err: Error) => void;
  disconnect: () => void;
  error: (p: {code?: string; message: string} | string) => void;

  'message:ack': (p: {clientId: null | string; conversationId: number; deliveredAt: string; messageId: number;}) => void;
  'message:new': (msg: WsMessage) => void;
  'message:read': (p: {conversationId: number; messageIds: number[]; readAt: string; userId: number;}) => void;
  'presence:update': (p: {lastSeen: string; online: boolean; userId: number;}) => void;
  'typing:start': (p: {conversationId: number; userId: number}) => void;
  'typing:stop': (p: {conversationId: number; userId: number}) => void;
  user_conversations: (list: ConversationListItem[]) => void;
};

export function useChatSocket() {
  const socketRef = useRef<null | Socket<ClientToServerEvents,ServerToClientEvents>>(null);
  const [connected,setConnected] = useState(false);
  const token = useSelector((s: RootState) => s.auth.token);

  useEffect(() => {
    // crea NUEVA instancia al cambiar token
    const s: Socket<ClientToServerEvents,ServerToClientEvents> = io(`${API_URL}/v2/chat`,{
      auth: {token},
      forceNew: true,
      transports: ['websocket'],
    });

    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect',onConnect);
    s.on('disconnect',onDisconnect);
    s.on('connect_error',(e) => console.log('[chat:error]',e)); // opcional

    return () => {
      s.off('connect',onConnect);
      s.off('disconnect',onDisconnect);
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
    };
  },[token]);

  // Helpers tipados
  const emit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<NonNullable<ClientToServerEvents[E]>>
  ) => {
    if (socketRef.current) {
      // El casting es seguro gracias a la definición de los tipos de eventos
      (socketRef.current.emit as (...args: any[]) => void)(event,...args);
    }
  },[]);

  const on = useCallback(<E extends keyof ServerToClientEvents>(
    event: E,
    handler: (...args: Parameters<NonNullable<ServerToClientEvents[E]>>) => void,
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event as any,handler);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event as any,handler);
      }
    };
  },[]);



  return {
    connected,
    emit,                      // usa esto en lugar de socket.emit(...)
    on,                        // suscripción tipada
  };
}
