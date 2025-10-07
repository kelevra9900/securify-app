import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,FlatList,Pressable,StyleSheet,View} from 'react-native';
import {MotiView} from 'moti';

import {CSafeAreaView,Header,TextLabel} from '@/components/atoms';
import {SkeletonBox} from '@/components/atoms/Skeleton';
import {useTheme} from '@/context/Theme';
import {moderateScale} from '@/constants';
import {useGetMySectors,useUpdateMySector} from '@/hooks/user/current_user';
import type {Sector} from '@/types/sector';
import type {NavigationProp} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import {Paths} from '@/navigation/paths';

const SelectSector = () => {
	const {theme} = useTheme();
	const nav = useNavigation<NavigationProp<Paths.SectorSelector>>()
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isPending,
	} = useGetMySectors();

	const {isPending: updating,mutate: updateSector} = useUpdateMySector();

	const handleSelectSector = useCallback(
		(sectorId: number) => {
			if (updating) {
				return;
			}
			updateSector(sectorId,{
				onSuccess: () => {
					nav.navigate(Paths.TabBarNavigation)
				}
			});
		},
		[updateSector,updating,nav],
	);

	const sectors = useMemo<Sector[]>(
		() => data?.pages.flatMap(page => page?.data ?? []) ?? [],
		[data],
	);

	const handleEndReached = useCallback(() => {
		if (!hasNextPage || isFetchingNextPage) {
			return;
		}
		fetchNextPage();
	},[fetchNextPage,hasNextPage,isFetchingNextPage]);

	if (isPending && sectors.length === 0) {
		return (
			<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
				<View style={[styles.container,{backgroundColor: theme.background}]}>
					<Header title="Selecciona un sector" />
					<SkeletonList
						borderColor={theme.border}
						cardColor={theme.cardBackground}
					/>
				</View>
			</CSafeAreaView>
		);
	}

	return (
		<CSafeAreaView edges={['top']} style={{backgroundColor: theme.background}}>
			<View style={[styles.container,{backgroundColor: theme.background}]}>
				<Header title="Selecciona un sector" />
				<FlatList
					contentContainerStyle={styles.listContent}
					data={sectors}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
					keyExtractor={item => String(item.id)}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<TextLabel color={theme.textSecondary} type="R14">
								No hay sectores disponibles.
							</TextLabel>
						</View>
					}
					ListFooterComponent={
						isFetchingNextPage ? (
							<View style={styles.footer}>
								<ActivityIndicator color={theme.textSecondary} />
							</View>
						) : null
					}
					onEndReached={handleEndReached}
					onEndReachedThreshold={0.25}
					renderItem={({index,item}) => (
						<SectorRow
							disabled={updating}
							index={index}
							item={item}
							onSelect={handleSelectSector}
							palette={{
								background: theme.cardBackground,
								border: theme.border,
								subtle: theme.textSecondary,
								text: theme.textPrimary,
							}}
						/>
					)}
				/>
			</View>
		</CSafeAreaView>
	);
};

type SectorRowProps = {
	disabled: boolean;
	index: number;
	item: Sector;
	onSelect: (sectorId: number) => void;
	palette: {
		background: string;
		border: string;
		subtle: string;
		text: string;
	};
};

const SectorRow = ({disabled,index,item,onSelect,palette}: SectorRowProps) => {
	const [isPressed,setIsPressed] = useState(false);

	useEffect(() => {
		if (!disabled) {
			setIsPressed(false);
		}
	},[disabled]);

	const handlePress = useCallback(() => {
		if (disabled) {
			return;
		}
		setIsPressed(true);
		onSelect(item.id);
	},[disabled,item.id,onSelect]);

	const showLoading = disabled && isPressed;

	return (
		<Pressable
			disabled={disabled}
			onPress={handlePress}
			style={({pressed}) => [styles.pressable,pressed && styles.pressed]}
		>
			<MotiView
				animate={{opacity: 1,translateY: 0}}
				from={{opacity: 0,translateY: 12}}
				style={[
					styles.card,
					{
						backgroundColor: palette.background,
						borderColor: palette.border,
					},
				]}
				transition={{delay: index * 40,duration: 220,type: 'timing'}}
			>
				<View style={styles.cardAccent} />
				<View style={{flex: 1}}>
					<TextLabel color={palette.text} numberOfLines={1} type="B15">
						{item.name}
					</TextLabel>
					<TextLabel
						color={palette.subtle}
						numberOfLines={1}
						style={styles.meta}
						type="R12"
					>
						{`Puntos asignados: ${item.count ?? 0}`}
					</TextLabel>
					<TextLabel color={palette.subtle} style={styles.meta} type="R12">
						{`Ambiente #${item.environmentId}`}
					</TextLabel>
				</View>
				{showLoading ? (
					<ActivityIndicator color={palette.subtle} size="small" style={styles.loading} />
				) : null}
			</MotiView>
		</Pressable>
	);
};

const SkeletonList = ({
	borderColor,
	cardColor,
}: {
	borderColor: string;
	cardColor: string;
}) => (
	<View style={styles.listContent}>
		{Array.from({length: 6}).map((_,index) => (
			<View
				key={index}
				style={[
					styles.skeletonCard,
					{backgroundColor: cardColor,borderColor},
				]}
			>
				<SkeletonBox height={18} width={'70%' as const} />
				<SkeletonBox height={14} style={styles.skeletonLine} width={'50%' as const} />
				<SkeletonBox height={14} style={styles.skeletonLine} width={'35%' as const} />
			</View>
		))}
	</View>
);

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		padding: moderateScale(16),
	},
	cardAccent: {
		backgroundColor: '#5C6EF8',
		borderRadius: 999,
		height: '100%',
		marginRight: moderateScale(12),
		width: 4,
	},
	container: {
		flex: 1,
		paddingHorizontal: moderateScale(20),
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: moderateScale(40),
	},
	footer: {
		paddingVertical: moderateScale(16),
	},
	listContent: {
		paddingBottom: moderateScale(32),
		paddingTop: moderateScale(16),
	},
	loading: {
		marginLeft: moderateScale(12),
	},
	meta: {
		marginTop: 6,
	},
	pressable: {
		borderRadius: 16,
		overflow: 'hidden',
	},
	pressed: {
		opacity: 0.95,
	},
	separator: {
		height: moderateScale(12),
	},
	skeletonCard: {
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		marginBottom: moderateScale(12),
		padding: moderateScale(16),
	},
	skeletonLine: {
		marginTop: moderateScale(10),
	},
});

export default SelectSector;
