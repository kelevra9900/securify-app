import React from 'react';
import {StyleSheet,View} from 'react-native';
import {MotiView} from 'moti';
import {SkeletonLoader} from '@/components/atoms/SkeletonLoader';
import {darkTheme} from '@/assets/theme';

/**
 * Skeleton para ronda activa
 * 
 * Simula el banner de ronda activa con:
 * - Información de la ronda
 * - Progreso visual
 * - Botón de continuar
 */
export const ActiveRoundSkeleton: React.FC = () => {
	return (
		<MotiView
			animate={{opacity: 1,scale: 1}}
			from={{opacity: 0,scale: 0.95}}
			transition={{duration: 400}}
			style={styles.container}
		>
			{/* Header */}
			<View style={styles.header}>
				<SkeletonLoader width="40%" height={14} />
			</View>

			{/* Contenido principal */}
			<View style={styles.content}>
				<View style={styles.info}>
					<SkeletonLoader width="80%" height={18} />
					<View style={styles.spacer} />
					<SkeletonLoader width="60%" height={14} />
				</View>

				{/* Progress indicator */}
				<SkeletonLoader width={50} height={24} borderRadius={12} />
			</View>

			{/* Botón de acción */}
			<View style={styles.actionSection}>
				<SkeletonLoader width="100%" height={44} borderRadius={8} />
			</View>
		</MotiView>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: darkTheme.cardBackground,
		borderRadius: 16,
		margin: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: darkTheme.border,
	},

	header: {
		marginBottom: 12,
	},

	content: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},

	info: {
		flex: 1,
		marginRight: 12,
	},

	spacer: {
		height: 8,
	},

	actionSection: {
		marginTop: 8,
	},
});

export default ActiveRoundSkeleton;
