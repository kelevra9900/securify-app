import React from 'react';
import {
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import {MotiView} from 'moti';
import {ChevronRight,MessageCircle} from 'lucide-react-native';

import {CSafeAreaView,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';

// Simulado temporal
const chatList = [
	{
		id: '1',
		lastMessage: 'Por favor revisa tu horario.',
		name: 'Supervisor Juan',
		unread: true,
		updatedAt: '13:40',
	},
	{
		id: '2',
		lastMessage: 'Gracias por tu reporte.',
		name: 'Administradora Marta',
		unread: false,
		updatedAt: '10:20',
	},
];

export default function ChatScreen({navigation}: RootScreenProps<Paths.Chat>) {
	const {theme} = useTheme();

	const handleChatPress = () => {
		navigation.navigate(Paths.ChatDetail);
	};

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<View style={styles.container}>
				<TextLabel color={theme.textPrimary} style={styles.title} type="B20">
					Mis conversaciones
				</TextLabel>

				<FlatList
					contentContainerStyle={{paddingVertical: 16}}
					data={chatList}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
					keyExtractor={(item) => item.id}
					renderItem={({item}) => (
						<TouchableOpacity onPress={handleChatPress}
							style={[styles.item,{backgroundColor: theme.cardBackground}]}>
							<MotiView
								animate={{opacity: 1,translateY: 0}}
								from={{opacity: 0,translateY: 10}}
								style={styles.row}
								transition={{duration: 300,type: 'timing'}}
							>
								<View style={styles.iconWrapper}>
									<MessageCircle color={theme.background} size={20} />
								</View>
								<View style={styles.textWrapper}>
									<TextLabel color={theme.textPrimary} type="B16">
										{item.name}
									</TextLabel>
									<TextLabel color={theme.textSecondary} numberOfLines={1} type="R14">
										{item.lastMessage}
									</TextLabel>
								</View>
								<View style={styles.trailing}>
									<TextLabel color={theme.textSecondary} type="R12">
										{item.updatedAt}
									</TextLabel>
									{item.unread && <View style={styles.unreadDot} />}
									<ChevronRight color={theme.textSecondary} size={18} />
								</View>
							</MotiView>
						</TouchableOpacity>
					)}
				/>
			</View>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	iconWrapper: {
		backgroundColor: '#eef2ff',
		borderRadius: 8,
		marginRight: 12,
		padding: 8,
	},
	item: {
		borderRadius: 12,
		padding: 12,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		width: '100%',
	},
	separator: {
		height: 12,
	},
	textWrapper: {
		flex: 1,
	},
	title: {
		marginBottom: 8,
		marginTop: 16,
	},
	trailing: {
		alignItems: 'flex-end',
		gap: 4,
		justifyContent: 'space-between',
		marginLeft: 12,
	},
	unreadDot: {
		alignSelf: 'flex-end',
		backgroundColor: '#5C6EF8',
		borderRadius: 4,
		height: 8,
		width: 8,
	},
});
