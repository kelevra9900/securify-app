import React from 'react';
import {MotiView,View} from 'moti';

import {IconStatus,PrimaryButton,TextLabel} from '@/components/atoms';
import {StyleSheet} from 'react-native';
import {colors} from '@/assets/theme';

type Props = {
	onContinue: () => void;
};

const SuccessLoginFeedback = ({onContinue}: Props) => {
	return (
		<MotiView
			animate={{opacity: 1,translateY: 0}}
			delay={100}
			from={{opacity: 0,translateY: 20}}
			style={styles.container}
		>
			<View style={styles.iconWrapper}>
				<IconStatus type="success" />
			</View>
			<TextLabel align="center" color={colors.white} type="B20">¡Acceso concedido!</TextLabel>
			<TextLabel align="center" color={colors.white} type="R16">Nos alegra tenerte de vuelta, Juan Pérez.</TextLabel>
			<TextLabel align="center" color={colors.white} type="R16">Tu turno ya está listo.</TextLabel>
			<PrimaryButton label="Continuar" onPress={onContinue} />
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

export default SuccessLoginFeedback;
