import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Clock3,PlayCircle,Timer} from 'lucide-react-native';
import {MotiView} from 'moti';

import {useTheme} from '@/context/Theme';

const mockRound = {
	endTime: '10:00',
	name: 'Ronda Matutina',
	progress: '40%',
	startTime: '08:00',
	status: 'En curso', // "Pendiente", "Completada", "Retrasada"
};

const statusColors = {
	'Completada': '#2196F3',
	'En curso': '#4CAF50',
	'Pendiente': '#FFC107',
	'Retrasada': '#F44336',
};

const RoundStatusCard = () => {
	const {theme} = useTheme();

	return (
		<MotiView
			animate={{opacity: 1,translateY: 0}}
			from={{opacity: 0,translateY: 20}}
			style={[styles.card,{backgroundColor: theme.cardBackground}]}
			transition={{duration: 400,type: 'timing'}}
		>
			<View style={styles.header}>
				<PlayCircle color={theme.highlight} size={20} />
				<Text style={[styles.roundName,{color: theme.textPrimary}]}>
					{mockRound.name}
				</Text>
			</View>

			<View style={styles.row}>
				<Timer color={theme.textSecondary} size={16} />
				<Text style={[styles.text,{color: theme.textPrimary}]}>
					Progreso: {mockRound.progress}
				</Text>
			</View>

			<View style={styles.row}>
				<Clock3 color={theme.textSecondary} size={16} />
				<Text style={[styles.text,{color: theme.textPrimary}]}>
					{mockRound.startTime} - {mockRound.endTime}
				</Text>
			</View>

			<View style={styles.statusRow}>
				<View
					style={[
						styles.statusBadge,
						{backgroundColor: statusColors[mockRound.status]},
					]}
				>
					<Text style={styles.statusText}>{mockRound.status}</Text>
				</View>
			</View>
		</MotiView>
	);
};

export default RoundStatusCard;

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		elevation: 2,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	header: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	roundName: {
		fontSize: 16,
		fontWeight: '600',
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 6,
	},
	statusBadge: {
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	statusRow: {
		alignItems: 'flex-start',
		marginTop: 12,
	},
	statusText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '500',
	},
	text: {
		fontSize: 14,
	},
});
