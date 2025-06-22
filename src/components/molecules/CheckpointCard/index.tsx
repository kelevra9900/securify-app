import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {MapPin} from 'lucide-react-native';
import {useTheme} from '@/context/Theme';

const CheckpointCard = () => {
	const {theme} = useTheme();

	// Mock location
	const currentCheckpoint = 'Puerta B4 - Terminal 2';

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.row}>
				<MapPin color={theme.highlight} size={20} />
				<Text style={[styles.label,{color: theme.textPrimary}]}>Ubicación actual</Text>
			</View>
			<Text style={[styles.location,{color: theme.textSecondary}]}>
				{currentCheckpoint}
			</Text>
		</View>
	);
};

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
	label: {
		fontSize: 14,
		fontWeight: '600',
	},
	location: {
		fontSize: 16,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 8,
	},
});

export default CheckpointCard;
