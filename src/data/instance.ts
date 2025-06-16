/* eslint-disable no-console */
import axios from 'axios';
import Config from 'react-native-config';
import {Platform} from 'react-native';

import store from '@/store';

const API_BASE_URL = Config.API_URL ?? '';

export const instance = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	},
});

instance.interceptors.request.use(
	(config) => {
		const state = store.getState();
		const token = state.auth.token || '';
		const platform = Platform.OS === 'ios' ? 'ios' : 'android';
		config.headers['platform'] = platform;

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		console.log('DATA REQUEST ===>:',JSON.stringify(config.data,null,2));
		console.log('Request ===>:',{
			data: config.data,
			headers: config.headers,
			method: config.method,
			url: config.url,
		});
		return config;
	},
	(error) => Promise.reject(error),
);
