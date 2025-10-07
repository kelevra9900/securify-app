/* eslint-disable @typescript-eslint/no-explicit-any */
import React,{useCallback,useMemo,useState} from 'react';
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
import {useConversation} from '@/hooks/chat/useConversation';
import type {Row} from '@/utils/chat';
import {buildRows} from '@/utils/chat';
import {useGetCurrentUser} from '@/hooks/user/current_user';

type RouteParams = {conversationId: number; title?: string};

export default function ChatDetailScreen() {
	const {theme} = useTheme();
	const route = useRoute() as unknown as {params: RouteParams};
	const navigation = useNavigation();
	const {data: profile} = useGetCurrentUser();

	const conversationId = route?.params?.conversationId;
	const displayName = route?.params?.title ?? 'Chat';



	// Altura real del input para reservar espacio (con lista invertida, usamos paddingTop)
	const insets = useSafeAreaInsets();
	const INPUT_MIN_H = moderateScale(50);
	const WRAPPER_VPAD = 12;
	const INPUT_TOTAL = INPUT_MIN_H + WRAPPER_VPAD + insets.bottom + 6;

	// Hook centralizado para la lógica de la conversación
	const {
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		messages: datasetDESC, // ya viene en orden DESC (nuevo -> viejo)
		send,
	} = useConversation(conversationId);

	// Construye filas con separadores de fecha (indicamos inverted:true)
	const rows: Row[] = useMemo(
		() => buildRows(datasetDESC,{inverted: false}),
		[datasetDESC],
	);

	const [text,setText] = useState('');

	const handleSend = useCallback(() => {
		send(text);
		setText('');
	},[send,text]);

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
						/>						<TouchableOpacity disabled={!text.trim()} onPress={handleSend}>
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
