import {FlashList,type ListRenderItemInfo} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React,{useCallback,useMemo} from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	View,
} from 'react-native';

import {CSafeAreaView,Header} from '@/components/atoms';
import {useAnnouncements} from '@/hooks/announcements/useGetAnnouncement';
import {Paths} from '@/navigation/paths';
import type {RootStackParamList} from '@/navigation/types';
import type {AnnouncementListItem} from '@/types/announcements';
import {AnnouncementItem} from '@/components/molecules';
import {colors,darkTheme} from '@/assets/theme';


export default function AnnouncementsListScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isError,
		isFetchingNextPage,
		isLoading,
		isRefetching,
		refetch,
	} = useAnnouncements({limit: 10});

	const items = useMemo<AnnouncementListItem[]>(
		() => data?.pages.flatMap((p) => (p?.items ?? []) as AnnouncementListItem[]) ?? [],
		[data],
	);

	const handleOpen = useCallback(
		(item: AnnouncementListItem) => {
			navigation.navigate(Paths.Announcement,{id: item.id});
		},
		[navigation],
	);

	const handleEndReached = useCallback(() => {
		if (!hasNextPage || isFetchingNextPage) {
			return;
		}
		fetchNextPage();
	},[fetchNextPage,hasNextPage,isFetchingNextPage]);

	const renderItem = useCallback(
		({item}: ListRenderItemInfo<AnnouncementListItem>) => (
			<AnnouncementItem item={item} onPress={() => {
				handleOpen(item)
			}} />
		),
		[handleOpen],
	);

	const keyExtractor = useCallback(
		(item: AnnouncementListItem) => item.id.toString(),
		[],
	);

	return (
		<CSafeAreaView style={styles.safe}>
			<Header
				onBackPress={() => navigation.goBack()}
				title="Anuncios"
			/>
			<View style={styles.container}>

				{isLoading ? (
					<View style={styles.loaderWrap}>
						<ActivityIndicator color="#4DE1FF" size="small" />
					</View>
				) : (
					<FlashList
						contentContainerStyle={[
							styles.listContent,
							items.length === 0 && styles.listEmptyContent,
						]}
						data={items}
						ItemSeparatorComponent={() => <View style={styles.separator} />}
						keyExtractor={keyExtractor}
						ListEmptyComponent={
							<View style={styles.emptyWrap}>
								<Text style={styles.emptyTitle}>
									{isError ? 'No pudimos cargar los anuncios' : 'Sin anuncios'}
								</Text>
								<Text style={styles.emptyText}>
									{isError
										? 'Desliza hacia abajo para reintentar.'
										: 'Vuelve más tarde para ver nuevas publicaciones.'}
								</Text>
							</View>
						}
						ListFooterComponent={
							isFetchingNextPage ? (
								<View style={styles.footerLoader}>
									<ActivityIndicator color="#4DE1FF" size="small" />
								</View>
							) : null
						}
						onEndReached={handleEndReached}
						onEndReachedThreshold={0.4}
						onRefresh={() => {
							void refetch();
						}}
						refreshing={isRefetching}
						renderItem={renderItem}
						showsVerticalScrollIndicator={false}
					/>
				)}
			</View>
		</CSafeAreaView>
	);
}

const styles = StyleSheet.create({
	badge: {
		alignSelf: 'flex-start',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	badgeSuccess: {backgroundColor: 'rgba(16,185,129,0.15)'},
	badgeText: {color: '#C7F9E3',fontSize: 12,fontWeight: '600'},
	badgeWarning: {backgroundColor: 'rgba(245,158,11,0.15)'},
	card: {
		backgroundColor: '#131A20',
		borderColor: 'rgba(255,255,255,0.06)',
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: 'hidden',
	},
	cardBody: {padding: 12},
	cardHeader: {alignItems: 'center',flexDirection: 'row',gap: 8},
	cardPressed: {opacity: 0.92},
	chip: {
		backgroundColor: '#1B232B',
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	chipsRow: {flexDirection: 'row',gap: 8,marginTop: 8},
	chipText: {color: '#9BA7B4',fontSize: 12},
	container: {flex: 1,paddingHorizontal: 16},
	content: {
		color: '#C8D2DE',
		fontSize: 14,
		lineHeight: 20,
		marginTop: 8,
	},
	cover: {
		aspectRatio: 16 / 9,
		backgroundColor: '#1B232B',
		width: '100%',
	},
	coverPlaceholder: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	coverPlaceholderText: {color: '#6B7380',fontSize: 13},
	dot: {color: '#394452'},
	emptyText: {color: '#9BA7B4'},
	emptyTitle: {color: '#EAF0F5',fontSize: 16,fontWeight: '700'},
	emptyWrap: {alignItems: 'center',gap: 6,paddingVertical: 48},
	footerLoader: {alignItems: 'center',paddingVertical: 16},
	listContent: {paddingBottom: 24},
	listEmptyContent: {flex: 1,justifyContent: 'center'},
	loaderWrap: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingVertical: 48,
	},
	metaRow: {
		alignItems: 'center',
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 10,
	},
	metaText: {color: '#8C99A7',fontSize: 12},
	safe: {backgroundColor: darkTheme.background,flex: 1},
	separator: {height: 12},
	title: {color: '#EAF0F5',flex: 1,fontSize: 16,fontWeight: '700'},
});
