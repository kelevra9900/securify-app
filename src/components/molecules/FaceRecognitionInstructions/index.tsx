import React from 'react';
import {Image,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {PrimaryButton,TextLabel} from '@/components/atoms';
import {useTheme} from '@/context/Theme';
import {moderateScale} from '@/constants';

type Props = {
	onCancel: () => void;
	onTakePhoto: () => void;
};

const FaceRecognitionInstructions = ({onCancel,onTakePhoto}: Props) => {
	const {theme} = useTheme();

	return (
		<View style={styles.fullContainer}>
			{/* Fondo decorativo */}
			<Image
				resizeMode="contain"
				source={require('@/assets/images/curve.png')}
				style={styles.decorTop}
			/>
			<Image
				resizeMode="contain"
				source={require('@/assets/images/curve.png')}
				style={styles.decorBottom}
			/>

			<View
				style={[
					styles.container,
					{
						backgroundColor: theme.cardBackground,
						borderColor: `${theme.textPrimary}10`,
					},
				]}
			>
				<TextLabel
					align="center"
					color={theme.textPrimary}
					style={{marginBottom: 20}}
					type="R20"
				>
					Asegúrate de que tu rostro esté bien iluminado y visible dentro del marco.
				</TextLabel>

				<PrimaryButton label="Tomar foto" onPress={onTakePhoto} />

				<TouchableOpacity onPress={onCancel}>
					<Text
						style={[
							styles.cancel,
							{color: theme.textPrimary},
						]}
					>
						Cancelar y volver
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};
const styles = StyleSheet.create({
	cancel: {
		marginTop: 10,
		opacity: 0.6,
		textAlign: 'center',
		textDecorationLine: 'underline',
	},
	container: {
		alignItems: 'center',
		borderRadius: 20,
		borderWidth: 1,
		elevation: 6,
		gap: 20,
		maxWidth: 360,
		paddingHorizontal: 24,
		paddingVertical: 32,
		shadowColor: '#000',
		shadowOffset: {height: 4,width: 0},
		shadowOpacity: 0.1,
		shadowRadius: 12,
		width: '100%',
		zIndex: 2,
	},
	decorBottom: {
		bottom: -40,
		height: moderateScale(200),
		opacity: 0.25,
		position: 'absolute',
		right: -85,
		transform: [{rotate: '180deg'}],
		width: moderateScale(200),
		zIndex: 0,
	},
	decorTop: {
		height: moderateScale(200),
		left: -50,
		opacity: 0.35,
		position: 'absolute',
		top: -120,
		width: moderateScale(200),
		zIndex: 0,
	},
	fullContainer: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 16,
		position: 'relative',
		width: '100%',
	},
});


export default FaceRecognitionInstructions;
