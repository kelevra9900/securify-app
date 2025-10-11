// src/hooks/chat/useTyping.ts

import {useCallback,useEffect,useRef,useState} from 'react';
import {useChatSocket} from './useChatSocket';

type TypingPayload = {conversationId: number; userId?: number};

export function useTyping(conversationId?: null | number) {
	const {emit,on} = useChatSocket();
	const [peerTyping,setPeerTyping] = useState(false);

	// control local para no spamear eventos
	const isTypingRef = useRef(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	// cuánto esperar sin teclear para mandar stop
	const IDLE_MS = 1200;

	const start = useCallback(() => {
		if (!conversationId) {return;}
		// sólo en el flanco de subida
		if (!isTypingRef.current) {
			emit('typing:start',{conversationId});
			isTypingRef.current = true;
		}
		// reprograma el stop por inactividad
		if (timerRef.current) {clearTimeout(timerRef.current);}
		timerRef.current = setTimeout(() => {
			if (!conversationId) {return;}
			if (isTypingRef.current) {
				emit('typing:stop',{conversationId});
				isTypingRef.current = false;
			}
		},IDLE_MS);
	},[conversationId,emit]);

	const stop = useCallback(() => {
		if (!conversationId) {return;}
		if (timerRef.current) {clearTimeout(timerRef.current);}
		if (isTypingRef.current) {
			emit('typing:stop',{conversationId});
			isTypingRef.current = false;
		}
	},[conversationId,emit]);

	// escucha al peer (el backend hace broadcast, no te llega tu propio typing)
	useEffect(() => {
		if (!conversationId) {return;}

		const offStart = on('typing:start',(p: TypingPayload) => {
			if (p.conversationId === conversationId) {setPeerTyping(true);}
		});
		const offStop = on('typing:stop',(p: TypingPayload) => {
			if (p.conversationId === conversationId) {setPeerTyping(false);}
		});

		return () => {
			offStart?.();
			offStop?.();
			stop();
		};
	},[conversationId,on,stop]);

	return {peerTyping,start,stop};
}
