import {MMKV} from 'react-native-mmkv';

export const storage = new MMKV();

export const MMKV_KEYS = {
	fcmToken: 'fcm_token',
	token: 'token',
	user: 'user',
};