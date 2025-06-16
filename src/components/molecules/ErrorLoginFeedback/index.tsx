import React from 'react';
import {MotiView} from 'moti';

import {IconStatus,PrimaryButton,TextLabel} from '@/components/atoms';

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
		>
			<IconStatus type="error" />
			<TextLabel align="center" type="B20">No pudimos verificar tu identidad</TextLabel>
			<TextLabel align="center" type="R16">Asegúrate de estar bien encuadrado y con buena luz.</TextLabel>
			<TextLabel align="center" type="R16">¿Quieres intentarlo de nuevo?</TextLabel>
			<PrimaryButton label="Reintentar verificación" onPress={onRetry} />
			<PrimaryButton label="Contactar a supervisor" onPress={onSupport || (() => { })} />
		</MotiView>
	);
};

export default ErrorLoginFeedback;
