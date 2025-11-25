import React from 'react';
import {StyleSheet,View} from 'react-native';
import {MotiView} from 'moti';
import {SkeletonLoader} from '@/components/atoms/SkeletonLoader';
import {darkTheme} from '@/assets/theme';

interface CheckpointListSkeletonProps {
	itemCount?: number;
	showProgress?: boolean;
}

/**
 * Skeleton para lista de checkpoints
 * 
 * Simula la estructura de CheckpointRow con:
 * - Ícono de estado
 * - Nombre del checkpoint
 * - Estado/progreso
 * - Información adicional
 */
export const CheckpointListSkeleton: React.FC<CheckpointListSkeletonProps> = ({
	itemCount = 5,
	showProgress = true,
}) => {
	return (
		<View style={styles.container}>
			{/* Progress header si se solicita */}
			{showProgress && (
				<MotiView
					animate={{opacity: 1,translateY: 0}}
					from={{opacity: 0,translateY: -10}}
					transition={{duration: 400}}
					style={styles.progressHeader}
				>
					<View style={styles.progressInfo}>
						<SkeletonLoader width="60%" height={16} />
						<View style={styles.spacer} />
						<SkeletonLoader width="40%" height={14} />
					</View>
					<SkeletonLoader width={60} height={20} borderRadius={10} />
				</MotiView>
			)}

			{/* Lista de checkpoints */}
			{Array.from({length: itemCount}).map((_,index) => (
				<MotiView
					key={index}
					animate={{opacity: 1,translateX: 0}}
					from={{opacity: 0,translateX: -20}}
					transition={{
						type: 'timing',
						duration: 300,
						delay: (showProgress ? 200 : 0) + index * 80,
					}}
					style={styles.checkpointItem}
				>
					{/* Ícono de estado */}
					<SkeletonLoader width={40} height={40} borderRadius={20} />

					{/* Contenido principal */}
					<View style={styles.content}>
						<View style={styles.mainInfo}>
							<SkeletonLoader width="70%" height={16} />
							<View style={styles.spacer} />
							<SkeletonLoader width="50%" height={12} />
						</View>

						{/* Estado */}
						<SkeletonLoader width={60} height={24} borderRadius={12} />
					</View>
				</MotiView>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},

	progressHeader: {
		backgroundColor: darkTheme.cardBackground,
		borderRadius: 14,
		padding: 14,
		marginBottom: 16,
		borderWidth: 1,
		borderColor: darkTheme.border,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	progressInfo: {
		flex: 1,
	},

	spacer: {
		height: 6,
	},

	checkpointItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		gap: 12,
	},

	content: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},

	mainInfo: {
		flex: 1,
	},
});

export default CheckpointListSkeleton;
