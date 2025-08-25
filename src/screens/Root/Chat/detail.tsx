/* eslint-disable @typescript-eslint/no-explicit-any */
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {
	ActivityIndicator,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import {ArrowLeft,SendHorizonal} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {CSafeAreaView,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import {useNavigation,useRoute} from '@react-navigation/native';
import {moderateScale} from '@/constants';
import {useChatSocket} from '@/hooks/chat/useChatSocket';
import {useConversationMessages} from '@/hooks/chat/useConversationMessages';
import type {WsMessage} from '@/data/services/chat';
import {useSelector} from 'react-redux';
import type {RootState} from '@/store';
import type {Row} from '@/utils/chat';
import {buildRows} from '@/utils/chat';
import {useQueryClient} from '@tanstack/react-query';
import {useGetCurrentUser} from '@/hooks/user/current_user';

type RouteParams = {conversationId: number; title?: string};

type ApiMsg = {
	clientId: string;
	content: string;
	conversationId: number;
	createdAt?: string; // viene en ISO; lo marcamos optional por seguridad
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

function mapApiToWs(m: ApiMsg): WsMessage {
	return {
		clientId: m.clientId,
		content: m.content,
		conversationId: m.conversationId,
		createdAt: m.createdAt ?? new Date().toISOString(), // asegura string
		fromUser: m.fromUser
			? {
				firstName: m.fromUser.firstName ?? undefined,
				id: m.fromUser.id,
				image: m.fromUser.image ?? null,
				lastName: m.fromUser.lastName ?? undefined,
			}
			: undefined,
		fromUserId: m.fromUserId,
		id: m.id,
		toUserId: m.toUserId ?? null,
	};
}

export default function ChatDetailScreen() {
	const {theme} = useTheme();
	const route = useRoute() as unknown as {params: RouteParams};
	const navigation = useNavigation();
	const {connected,emit,on} = useChatSocket();

	const {data: profile} = useGetCurrentUser();

	const conversationId = route?.params?.conversationId;
	const displayName = route?.params?.title ?? 'Chat';

	// Altura real del input para reservar espacio (con lista invertida, usamos paddingTop)
	const insets = useSafeAreaInsets();
	const INPUT_MIN_H = moderateScale(50);
	const WRAPPER_VPAD = 12;
	const INPUT_TOTAL = INPUT_MIN_H + WRAPPER_VPAD + insets.bottom + 6;

	// Historial paginado desde API
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useConversationMessages(conversationId);

	// Normaliza historial en DESC (nuevo -> viejo). No lo inviertas.
	const historyDESC: WsMessage[] = useMemo(
		() => (data?.pages.flatMap(p => (p.items as ApiMsg[]) ?? []) ?? []).map(mapApiToWs),
		[data],
	);

	// Live messages (nuevos). Los ponemos AL FRENTE para DESC.
	const [live,setLive] = useState<WsMessage[]>([]);
	const liveIds = useRef<Set<number>>(new Set());

	// Para dedupe rápido contra historial
	const historyIds = useMemo(() => new Set(historyDESC.map(m => m.id)),[historyDESC]);

	// Dataset final en DESC: primero live (más recientes), luego historial.
	const datasetDESC = useMemo<WsMessage[]>(
		() => [...live,...historyDESC],
		[live,historyDESC],
	);

	// Construye filas con separadores de fecha (indicamos inverted:true)
	const rows: Row[] = useMemo(
		() => buildRows(datasetDESC,{inverted: true}),
		[datasetDESC],
	);



	const qc = useQueryClient();

	const bumpConversations = useCallback((m: WsMessage) => {
		qc.setQueryData(['chat','conversations'],(prev: any) => {
			if (!prev) {return prev;}

			// soporta tanto array plano como {data: [...]}
			const list: any[] = Array.isArray(prev) ? prev : (prev.data ?? []);
			const idx = list.findIndex(c => c.conversationId === m.conversationId);

			const latest = {
				content: m.content,
				createdAt: m.createdAt,
				fromUser: m.fromUser
					? {firstName: m.fromUser.firstName,id: m.fromUser.id,image: m.fromUser.image ?? null,lastName: m.fromUser.lastName}
					: undefined,
				id: m.id,
			};

			let next: any[];
			if (idx === -1) {
				// si por alguna razón no está, lo agregamos al tope
				next = [{conversationId: m.conversationId,isGroup: false,lastMessage: latest,otherParticipant: null},...list];
			} else {
				const updated = {...list[idx],lastMessage: latest};
				next = [updated,...list.slice(0,idx),...list.slice(idx + 1)];
			}

			return Array.isArray(prev) ? next : {...prev,data: next};
		});
	},[qc]);

	// Unirse a la sala una vez
	useEffect(() => {
		if (!connected || !conversationId) {return;}
		emit('join_conversation',{conversationId},() => { });
	},[connected,conversationId,emit]);

	// Suscripción a mensajes en vivo
	// === listener de mensajes ===
	useEffect(() => {
		setLive([]); liveIds.current.clear();

		const off = on('message',(msg) => {
			if (msg.conversationId !== conversationId) {return;}

			const fixed = mapApiToWs(msg as any);
			fixed.clientId = (msg as any).clientId;

			if (fixed.clientId) {
				setLive(prev => {
					const idx = prev.findIndex(m => m.clientId === fixed.clientId);
					if (idx !== -1) {
						const copy = [...prev];
						copy[idx] = fixed;            // reemplaza optimista
						return copy;
					}
					return [fixed,...prev];
				});
			} else {
				setLive(prev => [fixed,...prev]);
			}

			// 👇 mueve la conversación al tope y actualiza lastMessage
			bumpConversations(fixed);
		});

		return off;
	},[conversationId,on,historyIds,bumpConversations]);

	// Envío optimista
	const [text,setText] = useState('');


	const handleSend = useCallback(() => {
		const raw = text.trim();
		if (!raw || !conversationId) {return;}
		const mkClientId = () => `c${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
		const clientId = mkClientId();

		const optimistic: WsMessage = {
			clientId,
			content: raw,
			conversationId,
			createdAt: new Date().toISOString(),
			fromUserId: profile?.user.id ?? 0,
			id: -Date.now(), // id temporal
			toUserId: null,
		};

		// DESC + inverted: al frente
		setLive(prev => [optimistic,...prev]);
		setText('');

		emit('send_message',{clientId,conversationId,message: raw},() => { });
		// opcional: refetch suave para asegurar consistencia con backend
		setTimeout(() => {
			qc.invalidateQueries({queryKey: ['chat','conversations']});
		},300);

	},[text,conversationId,emit,qc,profile?.user.id]);


	// Loader inicial
	if (isLoading) {
		return (
			<CSafeAreaView edges={['top','bottom']} style={{backgroundColor: theme.background}}>
				<View style={[styles.header,{borderBottomColor: theme.cardBackground}]}>
					<ArrowLeft color={theme.textPrimary} onPress={navigation.goBack as any} size={24} />
					<TextLabel color={theme.textPrimary} style={{marginLeft: 12}} type="B16">
						{displayName}
					</TextLabel>
				</View>
				<View style={{flex: 1,padding: 16}}>
					<ActivityIndicator />
				</View>
			</CSafeAreaView>
		);
	}

	return (
		<CSafeAreaView edges={['top','bottom']} style={{backgroundColor: theme.background}}>
			<View style={[styles.container,{backgroundColor: theme.background}]}>
				{/* Header */}
				<View style={[styles.header,{borderBottomColor: theme.cardBackground}]}>
					<ArrowLeft color={theme.textPrimary} onPress={navigation.goBack as any} size={24} />
					<TextLabel color={theme.textPrimary} style={{marginLeft: 12}} type="B16">
						{displayName}
					</TextLabel>
				</View>

				{/* Lista invertida (último mensaje queda abajo visible) */}
				<FlatList
					contentContainerStyle={{
						paddingBottom: 16,
						paddingHorizontal: 16,
						paddingTop: INPUT_TOTAL, // con inverted, esto es el "fondo" visual (no tapa el input)
					}}
					data={rows}
					inverted
					keyboardShouldPersistTaps="handled"
					keyExtractor={(r) => r.key}
					ListFooterComponent={
						isFetchingNextPage ? (
							<View style={{paddingVertical: 12}}>
								<ActivityIndicator />
							</View>
						) : null
					}
					maintainVisibleContentPosition={{minIndexForVisible: 0}}
					onEndReached={() => {
						if (hasNextPage && !isFetchingNextPage) {fetchNextPage();}
					}}
					onEndReachedThreshold={0.2}
					renderItem={({item}) => {
						if (item.kind === 'separator') {
							return (
								<View style={styles.sepWrapper}>
									<View style={styles.sepChip}>
										<TextLabel color="#fff" type="R12">
											{item.label}
										</TextLabel>
									</View>
								</View>
							);
						}

						// item.kind === 'msg'
						const msg = item.msg;
						const isMe = msg.fromUserId === profile?.user.id;
						const created = new Date(msg.createdAt ?? Date.now());
						const time = created.toLocaleTimeString([],{hour: '2-digit',minute: '2-digit'});

						return (
							<View style={[styles.bubbleWrapper,{alignItems: isMe ? 'flex-end' : 'flex-start'}]}>
								<View
									style={[
										styles.bubble,
										{
											backgroundColor: isMe ? '#5C6EF8' : theme.cardBackground,
											borderTopLeftRadius: isMe ? 12 : 0,
											borderTopRightRadius: isMe ? 0 : 12,
										},
									]}
								>
									<TextLabel color={isMe ? '#fff' : theme.textPrimary} type="B12">
										{msg.content}
									</TextLabel>
									<TextLabel
										color={isMe ? '#dcdcdc' : theme.textSecondary}
										style={{alignSelf: 'flex-end',marginTop: 4}}
										type="R10"
									>
										{time}
									</TextLabel>
								</View>
							</View>
						);
					}}
					style={styles.list}
				/>

				{/* Input */}
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
					style={styles.inputWrapper}
				>
					<View style={[styles.inputBox,{backgroundColor: theme.cardBackground}]}>
						<TextInput
							onChangeText={setText}
							onSubmitEditing={handleSend}
							placeholder="Escribe un mensaje..."
							placeholderTextColor={theme.textSecondary}
							returnKeyType="send"
							style={[styles.input,{color: theme.textPrimary}]}
							value={text}
						/>
						<TouchableOpacity disabled={!text.trim() || !connected} onPress={handleSend}>
							<SendHorizonal color={theme.textPrimary} size={22} />
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</View>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	bubble: {borderRadius: 16,maxWidth: '80%',padding: 12},
	bubbleWrapper: {marginBottom: 15},
	container: {flex: 1},

	header: {
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		padding: 16,
	},
	input: {flex: 1,fontSize: 16,marginRight: 8},

	inputBox: {
		alignItems: 'center',
		borderRadius: 12,
		flexDirection: 'row',
		minHeight: moderateScale(50),
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	inputWrapper: {bottom: 0,left: 0,padding: 12,position: 'absolute',right: 0},
	list: {flex: 1},

	sepChip: {
		backgroundColor: 'rgba(255,255,255,0.15)',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	sepWrapper: {alignItems: 'center',marginVertical: 6},
});
