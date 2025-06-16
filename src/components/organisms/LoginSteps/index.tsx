import {View} from 'react-native';

import {IconStatus,LoadingSpinner,PrimaryButton,TextLabel} from '@/components/atoms';
import {FaceRecognitionInstructions} from '@/components/molecules';

type Props = {
	step: 'welcome' | 'camera' | 'loading' | 'success' | 'error';
	onStart: () => void;
	onTakePhoto: () => void;
	onRetry: () => void;
	onCancel: () => void;
};

const LoginSteps = ({step,onStart,onTakePhoto,onRetry,onCancel}: Props) => {
	switch (step) {
		case 'welcome':
			return (
				<View>
					<TextLabel type="B24" align="center">Bienvenido</TextLabel>
					<TextLabel type="R16" align="center">Inicia sesión para comenzar tu jornada</TextLabel>

					<PrimaryButton label="Iniciar con reconocimiento facial" onPress={onStart} />
				</View>
			);
		case 'camera':
			return <FaceRecognitionInstructions onTakePhoto={onTakePhoto} onCancel={onCancel} />;
		case 'loading':
			return <LoadingSpinner />;
		case 'success':
			return (
				<View>
					<IconStatus type="success" />
					<TextLabel type="B20" align="center">¡Acceso concedido!</TextLabel>
					<TextLabel type="R16" align="center">Bienvenido, Juan Pérez</TextLabel>
				</View>
			);
		case 'error':
			return (
				<View>
					<IconStatus type="error" />
					<TextLabel type="B20" align="center">No pudimos verificar tu identidad</TextLabel>
					<PrimaryButton label="Reintentar" onPress={onRetry} />
					<PrimaryButton label="Contactar a supervisor" onPress={() => { }} />
				</View>
			);
		default:
			return null;
	}
};

export default LoginSteps;