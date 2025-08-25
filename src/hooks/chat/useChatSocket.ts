/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/chat/useChatSocket.ts
import {useCallback, useEffect, useRef, useState} from 'react';
import {io, type Socket} from 'socket.io-client';
import {useSelector} from 'react-redux';
import {API_URL} from '@/utils/constants';
import type {RootState} from '@/store';

// TIPOS CORRECTOS
export type ClientToServerEvents = {
  'join_conversation': (payload: {conversationId: number}, ack?: (res: any) => void) => void;
  'send_message': (p: {clientId?: string; conversationId: number; message: string;},ack?: (res: any) => void) => void;
  // opcional si usas socket para listar conversaciones (si no, hazlo por HTTP):
  'get_user_conversations'?: () => void;
};

export type ServerToClientEvents = {
  'error': (p: {code?: string; message: string}) => void;
  'message': (msg: {
    clientId?: string;        // 👈 echo del server
    content: string;
    conversationId: number;
    createdAt: string;        // ISO
    fromUser?: {firstName?: null | string; id: number; image?: null | string; lastName?: null | string;};
    fromUserId: number;
    id: number;
    toUserId: null | number;
  }) => void;
};

export function useChatSocket() {
  const socketRef = useRef<null | Socket<ClientToServerEvents, ServerToClientEvents>>(null);
  const [connected, setConnected] = useState(false);
  const token = useSelector((s: RootState) => s.auth.token);

  useEffect(() => {
    // crea NUEVA instancia al cambiar token
    const s: Socket<ClientToServerEvents, ServerToClientEvents> = io(`${API_URL}/v2/chat`, {
      auth: { token },
      forceNew: true,
      transports: ['websocket'],
    });

    socketRef.current = s;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', (e) => console.log('[chat:error]', e)); // opcional

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Helpers tipados
  const emit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<NonNullable<ClientToServerEvents[E]>>
  ) => {
    socketRef.current?.emit(event as any, ...(args as any));
  }, []);

  const on = useCallback<<E extends keyof ServerToClientEvents>(
    event: E,
    cb: ServerToClientEvents[E]
  ) => (() => void)>((event, cb) => {
    const s = socketRef.current;
    if (!s) {return () => {};}
    s.on(event as any, cb as any);
    return () => s.off(event as any, cb as any);
  }, []);


  return {
    connected,
    emit,                      // usa esto en lugar de socket.emit(...)
    on,                        // suscripción tipada
    socket: socketRef.current, // por si lo necesitas
  };
}
