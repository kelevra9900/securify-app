// src/components/molecules/NextShiftCard.tsx
import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {CalendarIcon,MapPinIcon,ShieldCheckIcon} from 'lucide-react-native';

import {useTheme} from '@/context/Theme';
import {TextLabel} from '@/components/atoms';

type Shift = {
	date: string;
	location: string;
	status: 'completada' | 'en_curso' | 'pendiente';
	time: string;
	type: string;
};

const mockShift: Shift = {
	date: 'Hoy',
	location: 'Terminal 2, Puerta A',
	status: 'pendiente', // 'en_curso', 'completada'
	time: '14:00 - 22:00',
	type: 'Ronda de inspección',
};

type StatusColors = {
	completada: string;
	en_curso: string;
	pendiente: string;
}
type StatusLabels = {
	completada: string;
	en_curso: string;
	pendiente: string
}

const statusColors: StatusColors = {
	completada: '#10B981', // verde
	en_curso: '#3B82F6',   // azul
	pendiente: '#F59E0B', // amarillo
};

const statusLabels: StatusLabels = {
	completada: 'Completada',
	en_curso: 'En curso',
	pendiente: 'Pendiente',
};

const NextShiftCard = () => {
	const {theme} = useTheme();

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.row}>
				<CalendarIcon color={theme.textSecondary} size={20} />
				<TextLabel color={theme.textPrimary} style={styles.text} type="M14">
					{mockShift.date} · {mockShift.time}
				</TextLabel>
			</View>

			<View style={styles.row}>
				<MapPinIcon color={theme.textSecondary} size={20} />
				<TextLabel color={theme.textPrimary} style={styles.text} type="M14">
					{mockShift.location}
				</TextLabel>
			</View>

			<View style={styles.row}>
				<ShieldCheckIcon color={theme.textSecondary} size={20} />
				<TextLabel color={theme.textPrimary} style={styles.text} type="M14">
					{mockShift.type}
				</TextLabel>

				<View
					style={[
						styles.statusBadge,
						{backgroundColor: statusColors[mockShift.status]},
					]}
				>
					<Text style={styles.statusText}>{statusLabels[mockShift.status]}</Text>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		borderRadius: 16,
		elevation: 2,
		marginVertical: 10,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		marginVertical: 6,
	},
	statusBadge: {
		alignSelf: 'flex-start',
		borderRadius: 12,
		marginLeft: 8,
		paddingHorizontal: 10,
		paddingVertical: 4,
	},
	statusText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	text: {
		flex: 1,
		marginLeft: 10,
	},
});

export default NextShiftCard;
