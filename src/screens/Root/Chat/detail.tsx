import React,{useRef,useState} from 'react';
import {
	FlatList,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import {ArrowLeft,SendHorizonal} from 'lucide-react-native';
import {CSafeAreaView,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import {useNavigation,useRoute} from '@react-navigation/native';
import {moderateScale} from '@/constants';

type Message = {
	content: string;
	createdAt: string;
	id: string;
	senderId: string;
};

const mockMessages: Message[] = [
	{content: 'Hola, ¿en qué puedo ayudarte?',createdAt: '13:00',id: '1',senderId: 'admin'},
	{content: 'Tuve un problema en la puerta 3',createdAt: '13:01',id: '2',senderId: 'user'},
	{content: 'Gracias, ya lo revisamos.',createdAt: '13:05',id: '3',senderId: 'admin'},
];

export default function ChatDetailScreen() {
	const {theme} = useTheme();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const route = useRoute<any>();
	const navigation = useNavigation();
	const [messages,setMessages] = useState<Message[]>(mockMessages);
	const [text,setText] = useState('');
	const flatListRef = useRef<FlatList>(null);

	const currentUserId = 'user';

	const handleSend = () => {
		if (!text.trim()) {return;}
		const newMessage: Message = {
			content: text,
			createdAt: new Date().toLocaleTimeString([],{hour: '2-digit',minute: '2-digit'}),
			id: Date.now().toString(),
			senderId: currentUserId,
		};
		setMessages((prev) => [...prev,newMessage]);
		setText('');
		setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}),100);
	};

	return (
		<CSafeAreaView edges={['top','bottom']} style={{backgroundColor: theme.background}}>
			<View style={[styles.container,{backgroundColor: theme.background}]}>
				{/* Header */}
				<View style={styles.header}>
					<ArrowLeft color={theme.textPrimary} onPress={navigation.goBack} size={24} />
					<TextLabel color={theme.textPrimary} style={{marginLeft: 12}} type="B16">
						{route.params?.name || 'Chat'}
					</TextLabel>
				</View>

				{/* Mensajes */}
				<FlatList
					contentContainerStyle={{padding: 16,paddingBottom: 80}}
					data={messages}
					keyExtractor={(item) => item.id}
					ref={flatListRef}
					renderItem={({item}) => {
						const isMe = item.senderId === currentUserId;
						return (
							<View style={[styles.bubbleWrapper,{alignItems: isMe ? 'flex-end' : 'flex-start'}]}>
								<View style={[
									styles.bubble,
									{
										backgroundColor: isMe ? '#5C6EF8' : theme.cardBackground,
										borderTopLeftRadius: isMe ? 12 : 0,
										borderTopRightRadius: isMe ? 0 : 12,
									},
								]}>
									<TextLabel color={isMe ? '#fff' : theme.textPrimary} type='B12'>{item.content}</TextLabel>
									<TextLabel
										color={isMe ? '#dcdcdc' : theme.textSecondary}
										style={{alignSelf: 'flex-end',marginTop: 4}}
										type="R10"
									>
										{item.createdAt}
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
							placeholder="Escribe un mensaje..."
							placeholderTextColor={theme.textSecondary}
							style={[styles.input,{color: theme.textPrimary}]}
							value={text}
						/>
						<TouchableOpacity onPress={handleSend}>
							<SendHorizonal color={theme.textPrimary} size={22} />
						</TouchableOpacity>
					</View>
				</KeyboardAvoidingView>
			</View>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	bubble: {
		borderRadius: 16,
		maxWidth: '80%',
		padding: 12,
	},
	bubbleWrapper: {
		marginBottom: 12,
	},
	container: {flex: 1},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		padding: 16,
	},
	input: {
		flex: 1,
		fontSize: 16,
		marginRight: 8,
	},
	inputBox: {
		alignItems: 'center',
		borderRadius: 12,
		flexDirection: 'row',
		minHeight: moderateScale(50),
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	inputWrapper: {
		bottom: 0,
		left: 0,
		padding: 12,
		position: 'absolute',
		right: 0,
	},
	list: {flex: 1},
});
