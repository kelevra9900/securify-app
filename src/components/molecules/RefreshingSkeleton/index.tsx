import React from 'react';
import {StyleSheet,View} from 'react-native';
import {MotiView} from 'moti';
import {SkeletonLoader} from '@/components/atoms/SkeletonLoader';
import {darkTheme} from '@/assets/theme';

/**
 * Skeleton para estado de refresh/actualización
 * 
 * Animación más sutil para pull-to-refresh
 */
export const RefreshingSkeleton: React.FC = () => {
	return (
		<View style={styles.container}>
			<MotiView
				animate={{
					opacity: [0.3,0.7,0.3],
					scale: [0.98,1,0.98],
				}}
				transition={{
					type: 'timing',
					duration: 2000,
					repeat: Infinity,
				}}
				style={styles.refreshItem}
			>
				<View style={styles.itemContent}>
					<SkeletonLoader width={40} height={40} borderRadius={20} />
					<View style={styles.textContent}>
						<SkeletonLoader width="60%" height={16} />
						<View style={styles.spacer} />
						<SkeletonLoader width="40%" height={12} />
					</View>
				</View>
			</MotiView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},

	refreshItem: {
		backgroundColor: darkTheme.cardBackground,
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: darkTheme.border,
	},

	itemContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},

	textContent: {
		flex: 1,
	},

	spacer: {
		height: 6,
	},
});

export default RefreshingSkeleton;
