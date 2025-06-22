import React from 'react';
import {FlatList,StyleSheet,Text,View} from 'react-native';
import {CheckCircle,Clock,XCircle} from 'lucide-react-native';

import {useTheme} from '@/context/Theme';

type PastRound = {
	date: string;
	id: string;
	name: string;
	status: 'completed' | 'incomplete';
};

type Props = {
	rounds: PastRound[];
};

const PastRoundsSummaryCard = ({rounds}: Props) => {
	const {theme} = useTheme();

	const statusColor = {
		completed: '#4CAF50',
		incomplete: '#F44336',
	};

	const statusLabel = {
		completed: 'Completada',
		incomplete: 'Incompleta',
	};

	return (
		<View style={[styles.container,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.header}>
				<Clock color={theme.textSecondary} size={18} />
				<Text style={[styles.title,{color: theme.textPrimary}]}>Rondas anteriores</Text>
			</View>

			<FlatList
				data={rounds}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				keyExtractor={(item) => item.id}
				renderItem={({item}) => {
					const Icon = item.status === 'completed' ? CheckCircle : XCircle;
					return (
						<View style={styles.item}>
							<Icon color={statusColor[item.status]} size={18} />
							<View style={styles.info}>
								<Text style={[styles.name,{color: theme.textPrimary}]}>{item.name}</Text>
								<Text style={[styles.date,{color: theme.textSecondary}]}>{item.date}</Text>
							</View>
							<Text style={[styles.status,{color: statusColor[item.status]}]}>
								{statusLabel[item.status]}
							</Text>
						</View>
					);
				}}
				scrollEnabled={false}
			/>
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
	date: {
		fontSize: 12,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	info: {
		flex: 1,
		marginLeft: 8,
	},
	item: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	name: {
		fontSize: 14,
		fontWeight: '500',
	},
	separator: {
		height: 12,
	},
	status: {
		fontSize: 13,
		fontWeight: '600',
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
	},
});
