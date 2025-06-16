import {StyleSheet,View} from 'react-native';
import {AnimatePresence,MotiView} from 'moti';

import {LoadingSpinner,PrimaryButton,TextLabel} from '@/components/atoms';
import {ErrorLoginFeedback,FaceRecognitionInstructions,SuccessLoginFeedback} from '@/components/molecules';

type Props = {
	onCancel: () => void;
	onContinue: () => void;
	onRetry: () => void;
	onStart: () => void;
	onTakePhoto: () => void;
	step: 'camera' | 'error' | 'loading' | 'success' | 'welcome';
};

const LoginSteps = ({onCancel,onContinue,onRetry,onStart,onTakePhoto,step}: Props) => {
	return (
		<View style={styles.container}>
			<AnimatePresence exitBeforeEnter>
				<MotiView
					animate={{opacity: 1,translateY: 0}}
					exit={{opacity: 0,translateY: -20}}
					from={{opacity: 0,translateY: 20}}
					key={step}
					style={{width: '100%'}}
				>
					{step === 'welcome' && (
						<>
							<TextLabel align="center" type="B24">Bienvenido</TextLabel>
							<TextLabel align="center" type="R16">Inicia sesión para comenzar tu jornada</TextLabel>
							<PrimaryButton label="Iniciar con reconocimiento facial" onPress={onStart} />
						</>
					)}

					{step === 'camera' && (
						<FaceRecognitionInstructions onCancel={onCancel} onTakePhoto={onTakePhoto} />
					)}

					{step === 'loading' && <LoadingSpinner />}

					{step === 'success' && (
						<SuccessLoginFeedback onContinue={onContinue} />
					)}

					{step === 'error' && (
						<ErrorLoginFeedback onRetry={onRetry} />
					)}
				</MotiView>
			</AnimatePresence>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		width: '100%',
	},
});

export default LoginSteps;
