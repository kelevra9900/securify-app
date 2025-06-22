// src/components/molecules/SendAlertCard.tsx
import React from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {Megaphone} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';

import {useTheme} from '@/context/Theme';
import type {Paths} from '@/navigation/paths';

const SendAlertCard = () => {
	const {theme} = useTheme();
	const navigation = useNavigation();

	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={() => { }} // Ajusta a tu tipo
			style={[styles.card,{backgroundColor: theme.cardBackground}]}
		>
			<View style={styles.iconWrapper}>
				<Megaphone color={theme.textSecondary} size={24} />
			</View>
			<View style={styles.textWrapper}>
				<Text style={[styles.title,{color: theme.textPrimary}]}>Enviar nueva alerta</Text>
				<Text style={[styles.subtitle,{color: theme.textSecondary}]}>
					Comparte una alerta con mensaje y/o imagen
				</Text>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	card: {
		alignItems: 'center',
		borderRadius: 16,
		elevation: 2,
		flexDirection: 'row',
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	iconWrapper: {
		alignItems: 'center',
		backgroundColor: '#E9456015',
		borderRadius: 32,
		height: 48,
		justifyContent: 'center',
		marginRight: 16,
		width: 48,
	},
	subtitle: {
		fontSize: 13,
		marginTop: 2,
	},
	textWrapper: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
	},
});

export default SendAlertCard;
