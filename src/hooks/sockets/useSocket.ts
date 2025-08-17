/* eslint-disable no-console */
import {useEffect,useRef} from 'react';
import type {Socket} from 'socket.io-client';
import io from 'socket.io-client';

let socketInstance: null | Socket = null;

export const useSocket = () => {
	const socketRef = useRef<null | Socket>(null);

	useEffect(() => {
		if (!socketInstance) {
			socketInstance = io('http://localhost:1337',{
				auth: {token: 'TU_TOKEN'},
			});
			console.log('Socket conectado');
		}

		socketRef.current = socketInstance;

		return () => {
			console.log('Desmontando socket (pero no cerrando conexión)');
		};
	},[]);

	const emit = (event: string,payload: any) => {
		if (socketRef.current?.connected) {
			socketRef.current.emit(event,payload);
		} else {
			console.warn('Socket no conectado, no se puede emitir:',event);
		}
	};

	return {emit,socket: socketRef.current};
};
