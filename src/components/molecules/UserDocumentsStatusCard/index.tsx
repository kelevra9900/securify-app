import React from 'react';
import {StyleSheet,Text,View} from 'react-native';
import {useTheme} from '@/context/Theme';
import CircularProgress from '@/components/atoms/CircularProgress';

const UserDocumentsStatusCard = () => {
	const {theme} = useTheme();
	const percentage = 75; // Mock por ahora

	return (
		<View style={[styles.card,{backgroundColor: theme.cardBackground}]}>
			<View style={styles.circleWrapper}>
				<CircularProgress
					backgroundColor={theme.border}
					color={theme.textSecondary}
					progress={percentage}
					size={80}
					strokeWidth={6}
				/>
				<View style={styles.centeredText}>
					<Text style={[styles.percentText,{color: theme.textPrimary}]}>{percentage}%</Text>
				</View>
			</View>
			<View style={styles.info}>
				<Text style={[styles.title,{color: theme.textPrimary}]}>Documentación</Text>
				<Text style={[styles.subtitle,{color: theme.textSecondary}]}>
					Revisa que tus documentos estén actualizados.
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	caption: {
		fontSize: 12,
		opacity: 0.8,
	},
	card: {
		alignItems: 'center',
		borderRadius: 16,
		elevation: 2,
		flexDirection: 'row',
		marginVertical: 8,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	centeredText: {
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
	},
	circleWrapper: {
		alignItems: 'center',
		height: 80,
		justifyContent: 'center',
		position: 'relative',
		width: 80,
	},
	info: {
		flex: 1,
		marginLeft: 16,
	},
	percentText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	subtitle: {
		fontSize: 13,
		marginTop: 4,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
	},
});

export default UserDocumentsStatusCard;
