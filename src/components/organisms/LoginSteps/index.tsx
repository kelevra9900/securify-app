import React from 'react';
import {Image,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {AnimatePresence,MotiView} from 'moti';

import {LoadingSpinner,PrimaryButton,TextLabel} from '@/components/atoms';
import {
	ErrorLoginFeedback,
	SuccessLoginFeedback,
} from '@/components/molecules';
import {getHeight,getWidth,moderateScale} from '@/constants';
import {useTheme} from '@/context/Theme';
import {colors} from '@/assets/theme';

type Props = {
	onCancel: () => void;
	onContinue: () => void;
	onRetry: () => void;
	onStart: () => void;
	onTakePhoto: () => void;
	step: 'camera' | 'error' | 'loading' | 'success' | 'welcome';
};

const LoginSteps = ({
	onCancel,
	onContinue,
	onRetry,
	onStart,
	onTakePhoto,
	step,
}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={[styles.container,{backgroundColor: theme.background}]}>
			{/* Fondo decorativo */}
			<Image
				resizeMode="contain"
				source={require('@/assets/images/curve.png')}
				style={styles.decorBottom}
			/>

			<AnimatePresence exitBeforeEnter>
				<MotiView
					animate={{opacity: 1,translateY: 0}}
					exit={{opacity: 0,translateY: -20}}
					from={{opacity: 0,translateY: 20}}
					key={step}
					style={styles.stepWrapper}
				>
					{step === 'welcome' && (
						<View style={[styles.card,{
							backgroundColor: theme.cardBackground,
							borderColor: `${theme.textPrimary}10`,
						}]}>
							<TextLabel align="center" color={theme.textPrimary} style={{marginBottom: 8}} type="B24">
								Inicia sesión con tu rostro
							</TextLabel>
							<TextLabel align="center" color={theme.textSecondary || '#B0B0B0'} style={{marginBottom: 24}} type="R16">
								Escanea tu rostro para acceder al sistema
							</TextLabel>
							<PrimaryButton label="Iniciar reconocimiento facial" onPress={onStart} />
						</View>
					)}

					{step === 'camera' && (
						<View style={[styles.card,{
							backgroundColor: theme.cardBackground,
							borderColor: `${theme.textPrimary}10`,
						}]}>
							<TextLabel align="center" color={theme.textPrimary} style={{marginBottom: 12}} type="B20">
								Alinea tu rostro
							</TextLabel>
							<TextLabel align="center" color={theme.textSecondary} style={{marginBottom: 24}} type="R16">
								Asegúrate de estar bien iluminado y centrado en la cámara.
							</TextLabel>

							<PrimaryButton label="Tomar foto" onPress={onTakePhoto} />

							<TouchableOpacity onPress={onCancel}>
								<Text style={[styles.cancel,{color: theme.textPrimary}]}>
									Cancelar y volver
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{step === 'loading' && (
						<View style={[styles.card,{
							backgroundColor: theme.cardBackground,
							borderColor: `${theme.textPrimary}10`,
						}]}>
							<LoadingSpinner />
							<TextLabel align="center" color={theme.textSecondary} style={{marginTop: 16}} type="R16">
								Procesando tu rostro...
							</TextLabel>
						</View>
					)}

					{step === 'success' && <SuccessLoginFeedback onContinue={onContinue} />}
					{step === 'error' && <ErrorLoginFeedback onRetry={onRetry} />}
				</MotiView>
			</AnimatePresence>
		</View>
	);
};
const IMAGE_WIDTH = 331;
const IMAGE_HEIGHT = 747;

const styles = StyleSheet.create({
	cancel: {
		fontSize: 14,
		marginTop: 12,
		opacity: 0.6,
		textAlign: 'center',
		textDecorationLine: 'underline',
	},
	card: {
		alignItems: 'center',
		backgroundColor: colors.gray,
		borderRadius: 20,
		borderWidth: 1,
		elevation: 6,
		maxWidth: moderateScale(360),
		paddingHorizontal: 24,
		paddingVertical: 32,
		width: '100%',
		zIndex: 2,
	},
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		position: 'relative',
	},
	decorBottom: {
		bottom: 0,
		height: getHeight(IMAGE_HEIGHT),
		opacity: 0.2,
		position: 'absolute',
		right: 0,
		transform: [{rotate: '180deg'}],
		width: getWidth(IMAGE_WIDTH),
		zIndex: 0,
	},
	stepWrapper: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16,
		width: '100%',
		zIndex: 2,
	},
});

export default LoginSteps;
