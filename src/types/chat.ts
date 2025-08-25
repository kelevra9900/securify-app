export type ClientToServerEvents = {
	'get_user_conversations': () => void;
	'join_room': (payload: {conversationId: number}) => void;
	'send_message': (payload: {conversationId: number; message: string; toUserId?: number}) => void;
};

export type ServerToClientEvents = {
	'error': (payload: {message: string}) => void;
	'receive_message': (payload: {
		conversationId: number;
		message: {
			content: string;
			conversationId: number;
			createdAt: string; // ISO
			fromUser?: {id: number; username?: string};
			fromUserId: number;
			id: number;
			toUserId: number;
		};
	}) => void;

	'user_conversations': (
		payload: Array<{
			conversationId: number;
			isGroup: boolean;
			lastMessage: {
				content: string;
				createdAt: string; // ISO
				fromUser?: {firstName?: string; id: number; image?: null | string; lastName?: string;};
				id: number;
			} | null;
			otherParticipant: {firstName?: string; id: number; image?: null | string; lastName?: string;} | null;
		}>
	) => void;
};
