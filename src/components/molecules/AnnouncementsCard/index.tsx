// components/molecules/AnnouncementsCard.tsx
import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {Megaphone} from 'lucide-react-native';
import {useTheme} from '@/context/Theme';

const AnnouncementsCard = () => {
	const {theme} = useTheme();

	// Mock: último comunicado
	const announcement = 'Nuevo protocolo de ingreso vigente desde el lunes.';

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.row}>
				<Megaphone color={theme.highlight} size={20} />
				<Text style={[styles.title,{color: theme.textPrimary}]}>Anuncio</Text>
			</View>
			<Text style={[styles.message,{color: theme.textSecondary}]}>
				{announcement}
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
	message: {
		fontSize: 14,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
		marginBottom: 8,
	},
	title: {
		fontSize: 14,
		fontWeight: '600',
	},
});

export default AnnouncementsCard;
