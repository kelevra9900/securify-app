import {instance} from '@/data/instance';

export type WsMessage = {
	clientId: string;
	content: string;
	conversationId: number;
	createdAt: string;
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

export type MessagesPage = {
	hasMore: boolean;
	items: WsMessage[];
	nextCursor: null | number;
};


export async function getConversationMessages(conversationId: number,params: {cursor?: number; limit?: number} = {}) {
	const {data} = await instance.get<MessagesPage>(`chat/conversations/${conversationId}/messages`,{
		params,
	});
	return data;
}

export async function createOneToOne(participantId: number) {
	const {data} = await instance.post<{conversationId: number; isGroup: boolean; name: null | string}>(
		'chat/conversations/one-to-one',
		{participantId}
	);
	return data;
}

export async function createGroup(participantIds: number[],name?: string) {
	const {data} = await instance.post<{conversationId: number; isGroup: boolean; name: null | string}>(
		'chat/conversations/group',
		{name,participantIds}
	);
	return data;
}
