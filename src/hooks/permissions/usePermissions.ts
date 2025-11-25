import {useCallback,useEffect,useState} from 'react';
import {NativeModules,PermissionsAndroid,Platform} from 'react-native';
import {checkNotifications,RESULTS} from 'react-native-permissions';
import {isNfcSupported} from '@/utils/nfc';

export type PermissionStatus = 'checking' | 'denied' | 'granted' | 'unavailable';

export type PermissionInfo = {
	canRequest: boolean;
	description: string;
	id: string;
	label: string;
	onRequest?: () => Promise<void>;
	status: PermissionStatus;
};

const MODULE_NAME = 'TrackingModule';

type TrackingModuleSpec = {
	checkPermissions?: () => Promise<{
		background: boolean;
		coarse: boolean;
		fine: boolean;
	}>;
	isIgnoringBatteryOptimizations?: () => Promise<boolean>;
	openBatteryOptimizationSettings?: () => void;
	requestIgnoreBatteryOptimizations?: () => void;
};

function getTrackingModule(): TrackingModuleSpec {
	const mod = (NativeModules as Record<string,unknown>)[MODULE_NAME] as
		| TrackingModuleSpec
		| undefined;
	return mod || {};
}

export function usePermissions() {
	const [permissions,setPermissions] = useState<PermissionInfo[]>([]);
	const [isLoading,setIsLoading] = useState(true);

	const checkAllPermissions = useCallback(async () => {
		setIsLoading(true);
		const results: PermissionInfo[] = [];

		// 1. Notificaciones
		try {
			const {status} = await checkNotifications();
			const granted = status === RESULTS.GRANTED || status === RESULTS.LIMITED;
			results.push({
				canRequest: status !== RESULTS.BLOCKED,
				description: 'Permite recibir notificaciones push',
				id: 'notifications',
				label: 'Notificaciones',
				status: granted ? 'granted' : status === RESULTS.BLOCKED ? 'denied' : 'denied',
			});
		} catch {
			results.push({
				canRequest: false,
				description: 'Permite recibir notificaciones push',
				id: 'notifications',
				label: 'Notificaciones',
				status: 'unavailable',
			});
		}

		// 2. Geolocalización (Foreground)
		if (Platform.OS === 'android') {
			try {
				const fine = await PermissionsAndroid.check(
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
				);
				const coarse = await PermissionsAndroid.check(
					PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
				);
				const granted = fine || coarse;

				results.push({
					canRequest: true,
					description: 'Permite acceder a tu ubicación en primer plano',
					id: 'location_foreground',
					label: 'Geolocalización',
					status: granted ? 'granted' : 'denied',
				});
			} catch {
				results.push({
					canRequest: false,
					description: 'Permite acceder a tu ubicación en primer plano',
					id: 'location_foreground',
					label: 'Geolocalización',
					status: 'unavailable',
				});
			}
		} else {
			// iOS - asumimos que si está disponible, se puede verificar
			results.push({
				canRequest: true,
				description: 'Permite acceder a tu ubicación en primer plano',
				id: 'location_foreground',
				label: 'Geolocalización',
				status: 'checking',
			});
		}

		// 3. Geolocalización (Background) - Solo Android 10+
		if (Platform.OS === 'android' && Platform.Version >= 29) {
			try {
				const background = await PermissionsAndroid.check(
					PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
				);
				results.push({
					canRequest: true,
					description: 'Permite rastrear tu ubicación cuando la app está en segundo plano',
					id: 'location_background',
					label: 'Geolocalización en segundo plano',
					status: background ? 'granted' : 'denied',
				});
			} catch {
				results.push({
					canRequest: false,
					description: 'Permite rastrear tu ubicación cuando la app está en segundo plano',
					id: 'location_background',
					label: 'Geolocalización en segundo plano',
					status: 'unavailable',
				});
			}
		} else if (Platform.OS === 'ios') {
			results.push({
				canRequest: true,
				description: 'Permite rastrear tu ubicación cuando la app está en segundo plano',
				id: 'location_background',
				label: 'Geolocalización en segundo plano',
				status: 'checking',
			});
		}

		// 4. Battery Optimization (Solo Android)
		if (Platform.OS === 'android') {
			try {
				const mod = getTrackingModule();
				const isIgnoring = await mod.isIgnoringBatteryOptimizations?.();
				results.push({
					canRequest: true,
					description: 'Permite que la app funcione en segundo plano sin restricciones',
					id: 'battery_optimization',
					label: 'Optimización de batería',
					onRequest: async () => {
						const trackingMod = getTrackingModule();
						trackingMod.requestIgnoreBatteryOptimizations?.();
					},
					status: isIgnoring ? 'granted' : 'denied',
				});
			} catch {
				results.push({
					canRequest: false,
					description: 'Permite que la app funcione en segundo plano sin restricciones',
					id: 'battery_optimization',
					label: 'Optimización de batería',
					status: 'unavailable',
				});
			}
		}

		// 5. NFC
		try {
			const supported = await isNfcSupported();
			results.push({
				canRequest: false,
				description: 'Permite leer tags NFC de checkpoints',
				id: 'nfc',
				label: 'NFC',
				status: supported ? 'granted' : 'unavailable',
			});
		} catch {
			results.push({
				canRequest: false,
				description: 'Permite leer tags NFC de checkpoints',
				id: 'nfc',
				label: 'NFC',
				status: 'unavailable',
			});
		}

		// 6. Cámara
		if (Platform.OS === 'android') {
			try {
				const camera = await PermissionsAndroid.check(
					PermissionsAndroid.PERMISSIONS.CAMERA,
				);
				results.push({
					canRequest: true,
					description: 'Permite tomar fotos para reportes e incidentes',
					id: 'camera',
					label: 'Cámara',
					status: camera ? 'granted' : 'denied',
				});
			} catch {
				results.push({
					canRequest: false,
					description: 'Permite tomar fotos para reportes e incidentes',
					id: 'camera',
					label: 'Cámara',
					status: 'unavailable',
				});
			}
		} else {
			// iOS - asumimos disponible
			results.push({
				canRequest: true,
				description: 'Permite tomar fotos para reportes e incidentes',
				id: 'camera',
				label: 'Cámara',
				status: 'checking',
			});
		}

		setPermissions(results);
		setIsLoading(false);
	},[]);

	useEffect(() => {
		checkAllPermissions();
	},[checkAllPermissions]);

	const refresh = useCallback(() => {
		checkAllPermissions();
	},[checkAllPermissions]);

	return {
		isLoading,
		permissions,
		refresh,
	};
}

