/* eslint-disable no-console */
import messaging from '@react-native-firebase/messaging';
import axios from 'axios'
import {instance} from '@/data/instance';
import {MMKV_KEYS,storage} from './storage';
import store from '@/store';


export const updateFCMTokenIfNeeded = async () => {
	try {
		const fcm = await messaging().getToken();

		if (!fcm) {
			console.warn('⚠️ No se pudo obtener el FCM token. Esperando refresh...');
			return;
		}
		storage.set(MMKV_KEYS.fcmToken,fcm);

		const authToken = store.getState().auth.token;
		if (!authToken) {
			console.warn('⛔ No hay token de usuario. Se omite envío de FCM a la API.');
			return;
		}

		console.log("Getting token",fcm)

		const {data} = await instance.put('/mobile/user/notifications',{
			fcm
		});

		console.log("Data received after update fcm token",data)

		console.log('✅ FCM token enviado a la API.');
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			throw error.response?.data;
		}
	}
};