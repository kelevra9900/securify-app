import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {CheckCircle,Clock,MapPin} from 'lucide-react-native';

import {useTheme} from '@/context/Theme';

type Props = {
	checkpointsCompleted: number;
	remainingTime?: string;
	roundName?: string;
	status?: 'active' | 'completed' | 'not_started';
	totalCheckpoints: number;
};

const statusColors = {
	active: '#4CAF50',
	completed: '#2196F3',
	not_started: '#9E9E9E',
};

const CurrentRoundStatusCard = ({
	checkpointsCompleted,
	remainingTime = '--:--',
	roundName = 'Ronda Sin Nombre',
	status = 'active',
	totalCheckpoints,
}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.header}>
				<CheckCircle color={statusColors[status]} size={20} />
				<Text style={[styles.title,{color: theme.textPrimary}]}>Ronda actual</Text>
			</View>

			<View style={styles.row}>
				<MapPin color={theme.textSecondary} size={18} />
				<Text style={[styles.text,{color: theme.textPrimary}]}>
					{roundName}
				</Text>
			</View>

			<View style={styles.row}>
				<Clock color={theme.textSecondary} size={18} />
				<Text style={[styles.text,{color: theme.textPrimary}]}>
					Tiempo restante: {remainingTime}
				</Text>
			</View>

			<Text style={[styles.checkpoints,{color: theme.textSecondary}]}>
				Checkpoints completados: {checkpointsCompleted}/{totalCheckpoints}
			</Text>
		</View>
	);
};

export default CurrentRoundStatusCard;

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		gap: 10,
		padding: 16,
	},
	checkpoints: {
		fontSize: 13,
		fontWeight: '500',
		marginTop: 6,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 8,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 6,
	},
	text: {
		fontSize: 14,
	},
	title: {
		fontSize: 16,
		fontWeight: 'bold',
	},
});
