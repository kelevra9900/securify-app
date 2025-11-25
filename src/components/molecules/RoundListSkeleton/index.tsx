import React from 'react';
import {StyleSheet,View} from 'react-native';
import {MotiView} from 'moti';
import {SkeletonLoader} from '@/components/atoms/SkeletonLoader';
import {darkTheme} from '@/assets/theme';

interface RoundListSkeletonProps {
	itemCount?: number;
}

/**
 * Skeleton para lista de rondas
 * 
 * Simula la estructura de RoundCard con:
 * - Header con título y estado
 * - Progreso circular
 * - Descripción y metadatos
 * - Botón de acción
 */
export const RoundListSkeleton: React.FC<RoundListSkeletonProps> = ({
	itemCount = 3,
}) => {
	return (
		<View style={styles.container}>
			{Array.from({length: itemCount}).map((_,index) => (
				<MotiView
					key={index}
					animate={{opacity: 1,translateY: 0}}
					from={{opacity: 0,translateY: 20}}
					transition={{
						type: 'timing',
						duration: 300,
						delay: index * 100,
					}}
					style={styles.card}
				>
					{/* Header */}
					<View style={styles.header}>
						<View style={styles.titleSection}>
							<SkeletonLoader width="70%" height={18} />
							<View style={styles.spacer} />
							<SkeletonLoader width="40%" height={14} />
						</View>
						<SkeletonLoader width={24} height={24} borderRadius={12} />
					</View>

					{/* Progress section */}
					<View style={styles.progressSection}>
						<SkeletonLoader width={50} height={50} borderRadius={25} />
						<View style={styles.progressText}>
							<SkeletonLoader width="60%" height={16} />
							<View style={styles.spacer} />
							<SkeletonLoader width="80%" height={14} />
						</View>
					</View>

					{/* Action button */}
					<View style={styles.buttonSection}>
						<SkeletonLoader width="100%" height={44} borderRadius={8} />
					</View>
				</MotiView>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 16,
	},

	card: {
		backgroundColor: darkTheme.cardBackground,
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: darkTheme.border,
	},

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 16,
	},

	titleSection: {
		flex: 1,
		marginRight: 12,
	},

	spacer: {
		height: 8,
	},

	progressSection: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		gap: 16,
	},

	progressText: {
		flex: 1,
	},

	buttonSection: {
		marginTop: 8,
	},
});

export default RoundListSkeleton;
