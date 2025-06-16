import React from 'react';
import {MotiView} from 'moti';

import {IconStatus,PrimaryButton,TextLabel} from '@/components/atoms';

type Props = {
	onContinue: () => void;
};

const SuccessLoginFeedback = ({onContinue}: Props) => {
	return (
		<MotiView
			animate={{opacity: 1,translateY: 0}}
			delay={100}
			from={{opacity: 0,translateY: 20}}
		>
			<IconStatus type="success" />
			<TextLabel align="center" type="B20">¡Acceso concedido!</TextLabel>
			<TextLabel align="center" type="R16">Nos alegra tenerte de vuelta, Juan Pérez.</TextLabel>
			<TextLabel align="center" type="R16">Tu turno ya está listo.</TextLabel>
			<PrimaryButton label="Continuar" onPress={onContinue} />
		</MotiView>
	);
};

export default SuccessLoginFeedback;
