import React from 'react';
import type {
	ViewStyle
} from 'react-native';
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity
} from 'react-native';
import {colors} from '@/assets/theme';

interface EndRoundFABProps {
	disabled?: boolean;
	isCompleted: boolean;
	isLoading: boolean;
	onPress: () => void;
	style?: ViewStyle;
}

/**
 * Floating Action Button para finalizar ronda
 * 
 * Cambia de apariencia según si la ronda está completa o no:
 * - Verde (✅): Ronda completa, lista para finalizar
 * - Amarillo (⏹️): Ronda incompleta, terminar antes de tiempo
 */
export const EndRoundFAB: React.FC<EndRoundFABProps> = ({
	disabled = false,
	isCompleted,
	isLoading,
	onPress,
	style,
}) => {
	const backgroundColor = isCompleted ? colors.success : colors.warning;
	const icon = isCompleted ? '✅' : '⏹️';
	const text = isCompleted ? 'Finalizar' : 'Terminar';

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			disabled={disabled || isLoading}
			onPress={onPress}
			style={[
				styles.fab,
				{backgroundColor},
				disabled && styles.disabled,
				style,
			]}
		>
			{isLoading ? (
				<ActivityIndicator color="white" size="small" />
			) : (
				<>
					<Text style={styles.icon}>{icon}</Text>
					<Text style={styles.text}>{text}</Text>
				</>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	disabled: {
		opacity: 0.5,
	},

	fab: {
		alignItems: 'center',
		borderRadius: 28,
		bottom: 20,
		elevation: 8,
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 20,
		paddingVertical: 12,
		position: 'absolute',
		right: 20,
		shadowColor: '#000',
		shadowOffset: {height: 4,width: 0},
		shadowOpacity: 0.3,
		shadowRadius: 8,
	},

	icon: {
		fontSize: 16,
	},

	text: {
		color: 'white',
		fontSize: 14,
		fontWeight: '600',
	},
});

