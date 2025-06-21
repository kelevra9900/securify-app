import React from 'react';
import {MotiView} from 'moti';

import {IconStatus,PrimaryButton,TextLabel} from '@/components/atoms';
import {StyleSheet,View} from 'react-native';
import {colors} from '@/assets/theme';

type Props = {
	onRetry: () => void;
	onSupport?: () => void;
};

const ErrorLoginFeedback = ({onRetry,onSupport = () => { }}: Props) => {
	return (
		<MotiView
			animate={{opacity: 1,scale: 1}}
			delay={100}
			from={{opacity: 0,scale: 0.95}}
			style={styles.container}
		>
			<View style={styles.iconWrapper}>
				<IconStatus type="error" />
			</View>
			<TextLabel align="center" color={colors.white} type="B20">No pudimos verificar tu identidad</TextLabel>
			<TextLabel align="center" color={colors.white} type="R16">Asegúrate de estar bien encuadrado y con buena luz.</TextLabel>
			<TextLabel align="center" color={colors.white} type="R16">¿Quieres intentarlo de nuevo?</TextLabel>
			<PrimaryButton label="Reintentar verificación" onPress={onRetry} />
			<PrimaryButton label="Contactar a supervisor" onPress={onSupport || (() => { })} />
		</MotiView>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		backgroundColor: colors.backgroundDark,
		borderColor: 'rgba(255,255,255,0.05)',
		borderRadius: 12,
		borderWidth: 1,
		elevation: 4,
		gap: 20,
		maxWidth: 400,
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {height: 2,width: 0},
		shadowOpacity: 0.15,
		shadowRadius: 6,
		width: '100%',
	},
	iconWrapper: {
		alignItems: 'center',
		backgroundColor: colors.white,
		borderRadius: 50,
		height: 40,
		justifyContent: 'center',
		marginBottom: 16,
		overflow: 'hidden',
		width: 40,
	}
})
export default ErrorLoginFeedback;
