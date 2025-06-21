/* eslint-disable no-console */
import {useEffect,useRef,useState} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {PermissionsAndroid,Platform} from 'react-native';
import type {Coordinates,Position,PositionError} from '@/types/geolocator';

type Location = Coordinates | null;

const requestPermission = async (): Promise<boolean> => {
	if (Platform.OS === 'ios') {return true;}
	try {
		const granted = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
		);
		return granted === PermissionsAndroid.RESULTS.GRANTED;
	} catch (error_) {
		console.warn(error_);
		return false;
	}
};

export const useGeolocation = () => {
	const [location,setLocation] = useState<Location>(null);
	const [error,setError] = useState<null | string>(null);
	const watchId = useRef<null | number>(null);

	const getCurrentLocation = () => {
		Geolocation.getCurrentPosition(
			(position: Position) => {
				setLocation(position.coords);
			},
			(err: PositionError) => {
				setError(err.message);
			},
			{
				enableHighAccuracy: true,
				maximumAge: 10_000,
				timeout: 15_000,
			},
		);
	};

	const subscribeToLocation = () => {
		watchId.current = Geolocation.watchPosition(
			(position: Position) => {
				setLocation(position.coords);
			},
			(err: PositionError) => {
				setError(err.message);
			},
			{
				distanceFilter: 10,
				enableHighAccuracy: true,
				fastestInterval: 2000,
				interval: 5000,
			},
		);
	};

	useEffect(() => {
		(async () => {
			const granted = await requestPermission();
			if (granted) {
				getCurrentLocation();
				subscribeToLocation();
			} else {
				setError('Permiso de ubicación denegado');
			}
		})();

		return () => {
			if (watchId.current !== null) {
				Geolocation.clearWatch(watchId.current);
			}
		};
	},[]);

	return {error,location};
};
