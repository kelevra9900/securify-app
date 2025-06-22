// src/utils/imagePicker.ts

import {PermissionsAndroid,Platform} from 'react-native';
import {
	type Asset,
	type CameraOptions,
	type ImageLibraryOptions,
	launchCamera,
	launchImageLibrary,
} from 'react-native-image-picker';

import {flashError} from './flashMessageHelper';

/**
 * Opciones comunes para cámara y galería.
 */
const commonOptions: CameraOptions & ImageLibraryOptions = {
	includeBase64: false,
	mediaType: 'photo',
	selectionLimit: 1,
};

/**
 * Solicita permiso para usar la cámara (solo Android).
 */
export const requestCameraPermission = async (): Promise<boolean> => {
	if (Platform.OS === 'android') {
		try {
			const granted = await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.CAMERA,
				{
					buttonNegative: 'Cancelar',
					buttonNeutral: 'Preguntar después',
					buttonPositive: 'Aceptar',
					message: 'La app necesita acceso a tu cámara para tomar fotos.',
					title: 'Permiso de Cámara',
				},
			);
			return granted === PermissionsAndroid.RESULTS.GRANTED;
		} catch (error) {
			console.warn('Error solicitando permisos de cámara:',error);
			flashError(
				'Error al solicitar permiso',
				'No se pudo solicitar el permiso de cámara. Verifica la configuración del dispositivo.',
			);
			return false;
		}
	}
	return true; // iOS ya gestiona esto
};

/**
 * Abre la cámara para tomar una foto.
 */
export const openCamera = async (onSelect: (asset: Asset) => void) => {
	const hasPermission = await requestCameraPermission();
	if (!hasPermission) {return;}

	try {
		const result = await launchCamera(commonOptions);
		if (!result.didCancel && result.assets?.length) {
			onSelect(result.assets[0]);
		}
	} catch (error) {
		console.error('Error al abrir cámara:',error);
		flashError('No se pudo abrir la cámara');
	}
};

/**
 * Abre la galería para seleccionar una imagen.
 */
export const openGallery = async (onSelect: (asset: Asset) => void) => {
	console.log('Intentando abrir galería…');

	try {
		const result = await launchImageLibrary(commonOptions);
		console.log('Resultado de galería:',result);

		if (!result.didCancel && result.assets?.length) {
			onSelect(result.assets[0]);
		}
	} catch (error) {
		console.error('Error al abrir galería:',error);
		flashError('No se pudo abrir la galería');
	}
};
