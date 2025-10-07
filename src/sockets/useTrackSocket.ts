/* eslint-disable no-console */
import {useEffect,useMemo,useRef,useState} from "react";
import {AppState} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {createNamespaceSocket} from "./factory";
import type {LocationPayload,TrackerEmitEvents,TrackerListenEvents} from "./tracker.types";

/**
 * Hook para /tracker: conecta, reconecta y expone helpers.
 * IMPORTANTE: usa /tracker (NO /track)
 */
export function useTrackSocket(token: null | string) {
	const socket = useMemo(() => {
		if (!token) {return null;}
		return createNamespaceSocket<TrackerListenEvents,TrackerEmitEvents>("/tracker",token);
	},[token]);

	const [connected,setConnected] = useState<boolean>(false);
	const lastEmitRef = useRef<number>(0);
	const lastRealtimeEmitRef = useRef<number>(0);

	// Diagnóstico y ciclo de vida
	useEffect(() => {
		if (!socket) {return;}

		const onConnect = () => {
			setConnected(true);
			console.log("[/tracker] ✅ connected:",socket.id);
		};
		const onDisconnect = (reason?: string) => {
			setConnected(false);
			console.log("[/tracker] 🔴 disconnected:",reason);
		};
		const onConnectError = (err: unknown) => {
			// registra el contenido útil del error (401, CORS, path, etc.)
			const anyErr = err as {data?: unknown; description?: string; message?: string;};
			console.log("[/tracker] ❌ connect_error:",anyErr?.message ?? anyErr?.description ?? anyErr);
			if (anyErr?.data) {console.log("[/tracker] error.data:",anyErr.data);}
		};

		socket.on("connect",onConnect);
		socket.on("disconnect",onDisconnect);
		socket.on("connect_error",onConnectError);

		if (!socket.connected) {socket.connect();}

		// Reconexión al volver a foreground
		const appSub = AppState.addEventListener("change",(s) => {
			if (s === "active" && !socket.connected) {socket.connect();}
		});

		// Reconexión según red
		const netSub = NetInfo.addEventListener((state) => {
			if (state.isConnected && !socket.connected) {socket.connect();}
			if (!state.isConnected && socket.connected) {socket.disconnect();}
		});

		return () => {
			socket.off("connect",onConnect);
			socket.off("disconnect",onDisconnect);
			socket.off("connect_error",onConnectError);
			appSub.remove();
			netSub();
			socket.removeAllListeners();
			socket.disconnect();
		};
	},[socket]);

	// Emisión con throttle (cliente)
	function sendLocation(latitude: number,longitude: number,minIntervalMs = 1500) {
		if (!socket || !connected) {return;}
		const now = Date.now();
		if (now - lastEmitRef.current < minIntervalMs) {return;}
		lastEmitRef.current = now;

		const payload: LocationPayload = {latitude,longitude};
		console.log("Send location to historical",payload)
		socket.emit("save_location",payload);
	}

	function sendRealtimeLocation(
		latitude: number,
		longitude: number,
		minIntervalMs = 500,
	) {
		if (!socket || !connected) {return;}
		const now = Date.now();
		if (now - lastRealtimeEmitRef.current < minIntervalMs) {return;}
		lastRealtimeEmitRef.current = now;

		const payload: LocationPayload = {latitude,longitude};
		socket.emit("update_location",payload);
	}

	return {connected,sendLocation,sendRealtimeLocation,socket};
}
