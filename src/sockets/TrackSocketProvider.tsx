import React,{createContext,useContext} from "react";
import {useTrackSocket} from "./useTrackSocket";

const TrackSocketContext = createContext<null | ReturnType<typeof useTrackSocket>>(null);

export const TrackSocketProvider: React.FC<{children: React.ReactNode; token: string;}> = ({
	children,
	token,
}) => {
	const socket = useTrackSocket(token);
	return <TrackSocketContext.Provider value={socket}>{children}</TrackSocketContext.Provider>;
};

export function useTrackSocketContext() {
	const ctx = useContext(TrackSocketContext);
	if (!ctx) {throw new Error("useTrackSocketContext must be used inside TrackSocketProvider");}
	return ctx;
}
