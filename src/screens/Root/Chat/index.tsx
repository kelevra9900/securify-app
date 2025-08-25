// src/screens/ChatScreen.tsx
import React,{useMemo} from 'react';
import {FlatList,StyleSheet,TouchableOpacity,View} from 'react-native';
import {MotiView} from 'moti';
import {ChevronRight,MessageCircle} from 'lucide-react-native';

import {CSafeAreaView,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';
import {useConversationList} from '@/hooks/chat/useConversationList';

function fmtTime(iso?: string) {
	if (!iso) {return '';}
	const d = new Date(iso);
	return d.toLocaleTimeString('es-MX',{hour: '2-digit',minute: '2-digit'});
}

export default function ChatScreen({navigation}: RootScreenProps<Paths.Chat>) {
	const {theme} = useTheme();
	const {error,items,loading,refresh} = useConversationList();

	const data = useMemo(() => items,[items]);

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<View style={styles.container}>
				<TextLabel color={theme.textPrimary} style={styles.title} type="B20">
					Mis conversaciones
				</TextLabel>

				{/* Skeleton */}
				{loading && (
					<View style={{paddingVertical: 16}}>
						{[0,1,2,3].map((i) => (
							<MotiView
								animate={{opacity: 1}}
								from={{opacity: 0.4}}
								key={i}
								style={[styles.skelItem,{backgroundColor: theme.cardBackground}]}
								transition={{duration: 700,loop: true,type: 'timing'}}
							>
								<View style={[styles.skelAvatar,{backgroundColor: theme.border}]} />
								<View style={{flex: 1,gap: 8}}>
									<View style={[styles.skelLine,{backgroundColor: theme.border,width: 180}]} />
									<View style={[styles.skelLine,{backgroundColor: theme.border,width: 120}]} />
								</View>
							</MotiView>
						))}
					</View>
				)}

				{!loading && error && (
					<View style={{alignItems: 'center',paddingVertical: 24}}>
						<TextLabel color={theme.textPrimary} type="R14">
							{error}
						</TextLabel>
						<TextLabel
							color={theme.highlight}
							onPress={refresh}
							style={{marginTop: 8,textDecorationLine: 'underline'}}
							type="R14"
						>
							Reintentar
						</TextLabel>
					</View>
				)}

				{!loading && !error && (
					<FlatList
						contentContainerStyle={{paddingVertical: 16}}
						data={data}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						keyExtractor={(item) => String(item.conversationId)}
						onRefresh={refresh}
						refreshing={false}
						renderItem={({index,item}) => {
							const name =
								item.isGroup
									? item.otherParticipant?.firstName ?? 'Grupo'
									: [item.otherParticipant?.firstName,item.otherParticipant?.lastName].filter(Boolean).join(' ') || 'Chat';

							const preview = item.lastMessage?.content ?? 'Sin mensajes';
							const time = fmtTime(item.lastMessage?.createdAt);

							return (
								<TouchableOpacity
									activeOpacity={0.85}
									id={`item-${index}`}
									onPress={() => {
										navigation.navigate(Paths.ChatDetail,{
											conversationId: item.conversationId,
											title: name,
										})
									}
									}
									style={[styles.item,{backgroundColor: theme.cardBackground}]}
								>
									<MotiView
										animate={{opacity: 1,translateY: 0}}
										from={{opacity: 0,translateY: 10}}
										style={styles.row}
										transition={{duration: 250,type: 'timing'}}
									>
										<View style={[styles.iconWrapper,{backgroundColor: theme.textSecondary + '22'}]}>
											<MessageCircle color={theme.background} size={20} />
										</View>

										<View style={styles.textWrapper}>
											<TextLabel color={theme.textPrimary} numberOfLines={1} type="B16">
												{name}
											</TextLabel>
											<TextLabel color={theme.textSecondary} numberOfLines={1} type="R14">
												{preview}
											</TextLabel>
										</View>

										<View style={styles.trailing}>
											{!!time && (
												<TextLabel color={theme.textSecondary} type="R12">
													{time}
												</TextLabel>
											)}
											{item.unread && <View style={styles.unreadDot} />}
											<ChevronRight color={theme.textSecondary} size={18} />
										</View>
									</MotiView>
								</TouchableOpacity>
							);
						}}
					/>
				)}
			</View>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {flex: 1,paddingHorizontal: 16},
	iconWrapper: {borderRadius: 8,marginRight: 12,padding: 8},
	item: {borderRadius: 12,padding: 12},
	row: {alignItems: 'center',flexDirection: 'row',width: '100%'},
	separator: {height: 12},
	textWrapper: {flex: 1},
	title: {marginBottom: 8,marginTop: 16},
	trailing: {alignItems: 'flex-end',gap: 4,justifyContent: 'space-between',marginLeft: 12},
	unreadDot: {alignSelf: 'flex-end',backgroundColor: '#5C6EF8',borderRadius: 4,height: 8,width: 8},

	// Skeleton
	skelAvatar: {borderRadius: 8,height: 36,marginRight: 12,width: 36},
	skelItem: {alignItems: 'center',borderRadius: 12,flexDirection: 'row',marginBottom: 12,padding: 12},
	skelLine: {borderRadius: 6,height: 10},
});
