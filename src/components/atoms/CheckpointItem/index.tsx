import React from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import Animated,{FadeInDown} from 'react-native-reanimated';
import {MapPin} from 'lucide-react-native';

import {useTheme} from '@/context/Theme';

type Props = {
	index: number;
	name: string;
	onPress: () => void;
	status: 'completed' | 'pending' | 'skipped';

};

const statusDetails = {
	completed: {
		color: '#4CAF50', // verde
		text: 'Registrado correctamente',
	},
	pending: {
		color: '#FFC107', // amarillo
		text: 'Pendiente por registrar',
	},
	skipped: {
		color: '#F44336', // rojo
		text: 'No registrado',
	},
};

const CheckpointItem = ({index,name,onPress,status}: Props) => {
	const {theme} = useTheme();
	const statusColor = statusDetails[status]?.color || theme.border;
	const statusText = statusDetails[status]?.text || 'Estado desconocido';

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={onPress}>
			<Animated.View
				entering={FadeInDown.delay(index * 100)}
				style={[styles.item,{backgroundColor: theme.cardBackground}]}
			>
				<View style={styles.row}>
					<MapPin color={statusColor} size={18} />
					<Text style={[styles.name,{color: theme.textPrimary}]}>{name}</Text>
				</View>
				<Text style={[styles.statusText,{color: statusColor}]}>{statusText}</Text>
			</Animated.View>
		</TouchableOpacity>
	);
};

export default CheckpointItem;

const styles = StyleSheet.create({
	item: {
		borderRadius: 12,
		elevation: 1,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 1,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	name: {
		fontSize: 15,
		fontWeight: '500',
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 6,
	},
	statusText: {
		fontSize: 13,
		fontWeight: '500',
	},
});
