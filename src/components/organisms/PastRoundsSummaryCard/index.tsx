// src/components/organisms/PastRoundsSummaryCard.tsx
import React from 'react';
import {ActivityIndicator,FlatList,Pressable,StyleSheet,Text,View} from 'react-native';
import {CheckCircle,Clock,XCircle} from 'lucide-react-native';
import {useTheme} from '@/context/Theme';
import {darkTheme} from '@/assets/theme';
import type {PastRound} from '@/types/rounds';



type Props = {
	errorText?: string;
	limit?: number;                        // cuántas mostrar en el resumen (default 5)
	loading?: boolean;
	onItemPress?: (id: string) => void;
	onRetry?: () => void;
	onSeeAll?: () => void;
	rounds: PastRound[];
	title?: string;
};

const statusColor = {
	completed: '#4CAF50',
	incomplete: '#F44336',
} as const;

const statusLabel = {
	completed: 'Completada',
	incomplete: 'Incompleta',
} as const;

const PastRoundsSummaryCard = ({
	errorText = undefined,
	limit = 5,
	loading = false,
	onItemPress = () => { },
	onRetry = undefined,
	onSeeAll = undefined,
	rounds,
	title = 'Rondas anteriores',
}: Props) => {
	const {theme} = useTheme();

	// Estado: loading
	if (loading) {
		return (
			<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
				<View style={styles.header}>
					<Clock color={theme.textSecondary} size={18} />
					<Text style={[styles.title,{color: theme.textPrimary}]}>{title}</Text>
				</View>
				<View style={styles.loadingBox}>
					<ActivityIndicator color={darkTheme.highlight} />
				</View>
			</View>
		);
	}

	// Estado: error
	if (errorText) {
		return (
			<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
				<View style={styles.header}>
					<Clock color={theme.textSecondary} size={18} />
					<Text style={[styles.title,{color: theme.textPrimary}]}>{title}</Text>
				</View>
				<Text style={[styles.errorText,{color: theme.textPrimary}]}>{errorText}</Text>
				{onRetry ? (
					<Text onPress={onRetry} style={styles.link}>Reintentar</Text>
				) : null}
			</View>
		);
	}

	const data = rounds.slice(0,Math.max(0,limit));

	return (
		<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.header}>
				<Clock color={theme.textSecondary} size={18} />
				<Text style={[styles.title,{color: theme.textPrimary}]}>{title}</Text>
			</View>

			{data.length === 0 ? (
				<Text style={[styles.empty,{color: theme.textSecondary}]}>Sin rondas anteriores</Text>
			) : (
				<FlatList
					data={data}
					ItemSeparatorComponent={() => <View style={styles.separator} />}
					keyExtractor={(item) => item.id}
					renderItem={({item}) => {
						const Icon = item.status === 'completed' ? CheckCircle : XCircle;
						return (
							<Pressable
								android_ripple={{color: theme.border}}
								onPress={() => onItemPress?.(item.id)}
								style={({pressed}) => [styles.item,pressed && styles.pressed]}
							>
								<Icon color={statusColor[item.status]} size={18} />
								<View style={styles.info}>
									<Text numberOfLines={1} style={[styles.name,{color: theme.textPrimary}]}>
										{item.name}
									</Text>
									<Text numberOfLines={1} style={[styles.date,{color: theme.textSecondary}]}>
										{item.date}
									</Text>
								</View>
								<Text style={[styles.status,{color: statusColor[item.status]}]}>
									{statusLabel[item.status]}
								</Text>
							</Pressable>
						);
					}}
					scrollEnabled={false}
				/>
			)}

			{onSeeAll ? (
				<Pressable onPress={onSeeAll} style={styles.seeAllBtn}>
					<Text style={styles.seeAllText}>Ver todas</Text>
				</Pressable>
			) : null}
		</View>
	);
};

export default PastRoundsSummaryCard;

const styles = StyleSheet.create({
	container: {
		borderRadius: 16,
		gap: 12,
		padding: 16,
	},
	date: {fontSize: 12},
	empty: {fontSize: 13},
	errorText: {marginTop: 6},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	info: {flex: 1,marginLeft: 8,marginRight: 8},

	item: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},

	link: {color: darkTheme.highlight,marginTop: 4,textDecorationLine: 'underline'},
	loadingBox: {
		alignItems: 'center',
		paddingVertical: 16,
	},

	name: {fontSize: 14,fontWeight: '500'},
	pressed: {opacity: 0.8},
	seeAllBtn: {alignSelf: 'flex-start',marginTop: 6,paddingHorizontal: 8,paddingVertical: 6},

	seeAllText: {color: darkTheme.highlight,fontWeight: '600'},

	separator: {height: 12},

	status: {fontSize: 13,fontWeight: '600'},
	title: {fontSize: 16,fontWeight: 'bold'},
});
