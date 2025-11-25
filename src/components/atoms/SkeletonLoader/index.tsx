import React from 'react';
import {StyleSheet,View} from 'react-native';
import {MotiView} from 'moti';
import {darkTheme} from '@/assets/theme';

interface SkeletonLoaderProps {
	width?: number | string;
	height?: number;
	borderRadius?: number;
	style?: any;
}

/**
 * Componente base para animaciones skeleton
 * 
 * Características:
 * - Animación shimmer suave con Moti
 * - Colores adaptativos al tema
 * - Configuración flexible de dimensiones
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
	width = '100%',
	height = 20,
	borderRadius = 8,
	style,
}) => {
	return (
		<View style={[{width,height,borderRadius},style]}>
			<MotiView
				animate={{
					backgroundColor: [
						darkTheme.border,
						'rgba(255, 255, 255, 0.1)',
						darkTheme.border,
					],
				}}
				transition={{
					type: 'timing',
					duration: 1500,
					repeat: Infinity,
				}}
				style={[
					styles.skeleton,
					{
						width,
						height,
						borderRadius,
					},
				]}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	skeleton: {
		backgroundColor: darkTheme.border,
	},
});

export default SkeletonLoader;
