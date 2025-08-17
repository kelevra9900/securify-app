// /* eslint-disable no-console */
// import {useRef} from 'react';
// import type {
// 	Location,
// 	State,
// 	Subscription
// } from 'react-native-background-geolocation';
// import BackgroundGeolocation from 'react-native-background-geolocation';
// import {check,openSettings,PERMISSIONS,request,RESULTS} from 'react-native-permissions';
// import {Alert,Platform} from 'react-native';

// export const useBackgroundLocationTracking = () => {
// 	const subscriptions = useRef<Subscription[]>([]);

// 	// eslint-disable-next-line unicorn/consistent-function-scoping
// 	const requestPermissions = async (): Promise<boolean> => {
// 		try {
// 			const locationPermission =
// 				Platform.OS === 'android'
// 					? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
// 					: PERMISSIONS.IOS.LOCATION_ALWAYS;

// 			const backgroundPermission =
// 				Platform.OS === 'android'
// 					? PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
// 					: PERMISSIONS.IOS.LOCATION_ALWAYS;

// 			let result = await check(locationPermission);
// 			if (result === RESULTS.DENIED || result === RESULTS.BLOCKED) {
// 				result = await request(locationPermission);
// 			}
// 			if (result !== RESULTS.GRANTED) {
// 				Alert.alert(
// 					'Permiso necesario',
// 					'Debes permitir la ubicación en segundo plano.',
// 					[{onPress: () => openSettings(),text: 'Abrir configuración'}],
// 				);
// 				return false;
// 			}

// 			let bgResult = await check(backgroundPermission);
// 			if (bgResult === RESULTS.DENIED || bgResult === RESULTS.BLOCKED) {
// 				bgResult = await request(backgroundPermission);
// 			}
// 			if (bgResult !== RESULTS.GRANTED) {
// 				Alert.alert(
// 					'Permiso necesario',
// 					'Debes permitir la ubicación en segundo plano.',
// 					[{onPress: () => openSettings(),text: 'Abrir configuración'}],
// 				);
// 				return false;
// 			}

// 			return true;
// 		} catch (error) {
// 			console.error('Error solicitando permisos',error);
// 			return false;
// 		}
// 	};

// 	const startTracking = async () => {
// 		const granted = await requestPermissions();
// 		if (!granted) {return;}

// 		/// 1. Registrar listeners
// 		subscriptions.current.push(
// 			BackgroundGeolocation.onLocation((location: Location) => {
// 				console.log('[onLocation]',location.coords);
// 				// socket.emit('new_location',{
// 				// 	latitude: location.coords.latitude,
// 				// 	longitude: location.coords.longitude,
// 				// });
// 			})
// 		);

// 		subscriptions.current.push(
// 			BackgroundGeolocation.onMotionChange(event => {
// 				console.log('[onMotionChange]',event);
// 			})
// 		);

// 		subscriptions.current.push(
// 			BackgroundGeolocation.onActivityChange(event => {
// 				console.log('[onActivityChange]',event);
// 			})
// 		);

// 		subscriptions.current.push(
// 			BackgroundGeolocation.onProviderChange(event => {
// 				console.log('[onProviderChange]',event);
// 			})
// 		);

// 		/// 2. Configuración segura con ready
// 		try {
// 			const state: State = await BackgroundGeolocation.ready({
// 				debug: true,
// 				desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
// 				distanceFilter: 10,
// 				logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
// 				startOnBoot: true,
// 				stopOnTerminate: false,
// 				stopTimeout: 5,
// 			});

// 			console.log('- BackgroundGeolocation listo:',state.enabled);

// 			if (!state.enabled) {
// 				BackgroundGeolocation.start();
// 			}
// 		} catch (error) {
// 			console.warn('Error configurando BackgroundGeolocation',error);
// 		}
// 	};

// 	const stopTracking = () => {
// 		BackgroundGeolocation.stop();
// 		subscriptions.current.forEach(sub => sub.remove());
// 		subscriptions.current = [];
// 		console.log('Tracking detenido y listeners eliminados.');
// 	};

// 	return {startTracking,stopTracking};
// };
