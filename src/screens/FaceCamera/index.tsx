import React,{useCallback,useRef} from 'react';
import {ActivityIndicator,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {Camera,useCameraDevice,useCameraPermission} from 'react-native-vision-camera';
import {useIsFocused} from '@react-navigation/native';
import type {Camera as CameraRefType,PhotoFile} from 'react-native-vision-camera';

import {colors} from '@/assets/theme';
import {PrimaryButton,TextLabel} from '@/components/atoms';
import type {RootScreenProps} from '@/navigation/types';
import type {Paths} from '@/navigation/paths';
import {useFaceRecognition} from '@/hooks/mutations/useFaceRecognition';
import {flashInfo} from '@/utils/flashMessageHelper';

type Props = {
	navigation: RootScreenProps<Paths.FaceCamera>['navigation'];
};

const FaceCameraScreen = ({navigation}: Props) => {
	const isFocused = useIsFocused();
	const {hasPermission,requestPermission} = useCameraPermission();
	const device = useCameraDevice('front');
	const cameraRef = useRef<CameraRefType>(null);
	const {isPending,mutate: recognizeFace} = useFaceRecognition();

	const handleRequestPermission = useCallback(async () => {
		const granted = await requestPermission();
		if (!granted) {
			flashInfo(
				'Permiso de cámara denegado',
				'Para continuar, por favor habilita el acceso a la cámara en la configuración de la aplicación.',
			);
		}
	},[requestPermission]);

	const handleTakePhoto = async () => {
		if (cameraRef.current == null) {return;}

		try {
			const photo: PhotoFile = await cameraRef.current.takePhoto();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const file: any = {
				name: 'photo.jpg',
				type: 'image/jpeg',
				uri: `file://${photo.path}`,
			};

			recognizeFace({
				photo: file,
			});
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error al tomar la foto:',error);
		}
	};

	if (!hasPermission) {
		return (
			<View style={styles.permissionContainer}>
				<TextLabel align="center" color={colors.white} type="B20">
					Cámara requerida
				</TextLabel>
				<TextLabel align="center" color={colors.white} type="R16">
					Necesitamos acceso a tu cámara para continuar.
				</TextLabel>
				<PrimaryButton label="Dar permiso" onPress={handleRequestPermission} />
			</View>
		);
	}

	if (device == null) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={{color: colors.white}}>No se detectó cámara frontal</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{isFocused && (
				<Camera
					device={device}
					isActive={true}
					photo={true}
					ref={cameraRef}
					style={StyleSheet.absoluteFill}
				/>
			)}

			<View style={styles.overlay}>
				<TextLabel align="center" color={colors.white} type="B20">Encuadra tu rostro</TextLabel>
				<TextLabel align="center" color={colors.white} style={{opacity: 0.6}} type="R16">
					Asegúrate de que esté bien iluminado.
				</TextLabel>

				<View style={{height: 24}} />
				{isPending ? (
					<ActivityIndicator color={colors.white} />
				) : (
					<PrimaryButton label="Tomar foto" onPress={handleTakePhoto} />
				)}
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.cancel}>Cancelar y volver</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};
const styles = StyleSheet.create({
	cancel: {
		color: colors.white,
		marginTop: 12,
		opacity: 0.6,
		textDecorationLine: 'underline',
	},
	container: {
		backgroundColor: colors.backgroundDark,
		flex: 1,
	},
	overlay: {
		alignItems: 'center',
		bottom: 40,
		gap: 16,
		paddingHorizontal: 24,
		position: 'absolute',
		width: '100%',
	},
	permissionContainer: {
		alignItems: 'center',
		backgroundColor: colors.backgroundDark,
		flex: 1,
		justifyContent: 'center',
		padding: 24,
	},
});

export default FaceCameraScreen;
