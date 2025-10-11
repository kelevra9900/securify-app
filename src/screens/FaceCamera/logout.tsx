import React,{useCallback,useRef,useState} from 'react';
import {
	ActivityIndicator,
	Linking,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';

import type {
	Camera as CameraRefType,
	PhotoFile,
} from 'react-native-vision-camera';
import {
	Camera,
	useCameraDevice,
	useCameraPermission,
} from 'react-native-vision-camera';

import type {RootScreenProps} from '@/navigation/types';
import {Paths} from '@/navigation/paths';
import {useFaceRecognitionLogout} from '@/hooks/mutations/useFaceRecognition';

import {PrimaryButton,TextLabel} from '@/components/atoms';
import {colors} from '@/assets/theme';
import {flashInfo} from '@/utils/flashMessageHelper';
import {getCurrentPositionNative,requestLocationPermission,stopTracking} from '@/utils/tracking';
import {useSelector} from 'react-redux';
import type {RootState} from '@/store';
import {clearCredentials} from '@/store/reducers/auth';
import {clearProfile} from '@/store/reducers/user';
import {disposeChatSocket} from '@/lib/socket/chat';
import {useAppDispatch} from '@/hooks/store';

type Props = {
	navigation: RootScreenProps<Paths.FaceCameraLogout>['navigation'];
};


const FaceCameraLogout = ({navigation}: Props) => {
	const isFocused = useIsFocused();
	const {hasPermission,requestPermission} = useCameraPermission();
	const device = useCameraDevice('front');
	const cameraRef = useRef<CameraRefType>(null);
	const rtoken = useSelector((state: RootState) => state.auth.refreshToken);
	const dispatch = useAppDispatch();

	const [isTakingPhoto,setIsTakingPhoto] = useState(false);
	const [isGettingLocation,setIsGettingLocation] = useState(false);

	const {isPending,mutate: rekognition} = useFaceRecognitionLogout();

	const handleRequestPermission = useCallback(async () => {
		const granted = await requestPermission();
		if (!granted) {
			flashInfo(
				'Permiso de cámara denegado',
				'Por favor habilita el acceso a la cámara desde Configuración.',
			);
		}
	},[requestPermission]);

	const handleTakePhoto = useCallback(async () => {
		if (!cameraRef.current || !device) {
			return;
		}

		try {
			setIsTakingPhoto(true);

			const photo: PhotoFile = await cameraRef.current.takePhoto({
				flash: 'off',
			});
			const uriRaw = photo.path;
			const uri = uriRaw.startsWith('file://') || uriRaw.startsWith('content://')
				? uriRaw
				: `file://${uriRaw}`;
			const file: File = {
				name: `face_${Date.now()}.jpg`,
				type: 'image/jpeg',
				uri,
			} as unknown as File;

			setIsGettingLocation(true);

			const locGranted = await requestLocationPermission();
			let latitude: null | number = null;
			let longitude: null | number = null;

			if (locGranted) {
				try {
					const pos = await getCurrentPositionNative({
						enableHighAccuracy: true,
						timeoutMs: 10_000,
					});
					latitude = pos.latitude ?? null;
					longitude = pos.longitude ?? null;
				} catch {
					flashInfo(
						'Ubicación no disponible',
						'No pudimos obtener tu ubicación. Se enviará la captura sin coordenadas.',
					);
				}
			} else {
				flashInfo(
					'Permiso de ubicación',
					'Sin permiso de ubicación. Puedes habilitarlo en Configuración para adjuntar coordenadas.',
				);
			}

			// 3) Enviar al backend
			rekognition(
				{
					file,
					latitude: latitude ?? 0,
					longitude: longitude ?? 0,
					refreshToken: rtoken ?? undefined
				},
				{
					onError: (err: unknown) => {
						// eslint-disable-next-line no-console
						console.error('Reconocimiento falló',err);
						flashInfo('Error','No se pudo procesar el reconocimiento facial.');
					},
					onSuccess: () => {
						dispatch(clearCredentials());
						dispatch(clearProfile());
						stopTracking();
						disposeChatSocket();
						navigation.replace(Paths.SectorSelector);
					},
				},
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error al tomar la foto:',error);
			navigation.goBack();
		} finally {
			setIsGettingLocation(false);
			setIsTakingPhoto(false);
		}
	},[cameraRef,device,rekognition,navigation,rtoken,dispatch]);

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
				<TouchableOpacity onPress={() => Linking.openSettings()}>
					<Text style={styles.settingsHint}>Abrir configuración</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (device == null) {
		return (
			<View style={styles.permissionContainer}>
				<Text style={{color: colors.white}}>
					No se detectó cámara frontal
				</Text>
			</View>
		);
	}

	const isBusy = isPending || isTakingPhoto || isGettingLocation;

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
				<TextLabel align="center" color={colors.white} type="B20">
					Encuadra tu rostro
				</TextLabel>
				<TextLabel
					align="center"
					color={colors.white}
					style={{opacity: 0.6}}
					type="R16"
				>
					Asegúrate de que esté bien iluminado.
				</TextLabel>

				<View style={{height: 24}} />
				{isBusy ? (
					<>
						<ActivityIndicator color={colors.white} />
						{isGettingLocation && (
							<Text style={styles.loadingText}>Obteniendo ubicación…</Text>
						)}
					</>
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

export default FaceCameraLogout;

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
	loadingText: {
		color: colors.white,
		fontSize: 12,
		marginTop: 8,
		opacity: 0.8,
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
	settingsHint: {
		color: colors.white,
		marginTop: 10,
		opacity: 0.7,
		textDecorationLine: 'underline',
	},
});