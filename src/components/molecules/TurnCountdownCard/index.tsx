import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';

const TurnCountdownCard = () => {
	const {theme} = useTheme();

	// Mock: 3 horas y 25 minutos restantes
	const remaining = '3h 25min';

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<Text style={[styles.title,{color: theme.textPrimary}]}>Fin de turno en</Text>
			<Text style={[styles.time,{color: theme.highlight}]}>{remaining}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		alignItems: 'center',
		borderRadius: 16,
		elevation: 2,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	time: {
		fontSize: 22,
		fontWeight: '700',
	},
	title: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 8,
	},
});

export default TurnCountdownCard;
