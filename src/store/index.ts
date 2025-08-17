/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/index.ts
import {combineReducers,configureStore} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createTransform,persistReducer,persistStore} from 'redux-persist';

import authReducer from './reducers/auth';
import profileReducer from './reducers/user';

// --- AUTH: guarda credenciales básicas ---
const authPersistConfig = {
	key: 'auth',
	storage: AsyncStorage,
	whitelist: ['token','isAuthenticated'],
};

const ONE_DAY = 24 * 60 * 60 * 1000;

const profileTTLTransform = createTransform(
	(inbound: any) => ({...inbound,__cachedAt: Date.now()}),
	(outbound: any) => {
		if (!outbound) {return outbound;}
		const {__cachedAt,...rest} = outbound;
		if (!__cachedAt || Date.now() - __cachedAt > ONE_DAY) {
			return {
				environment: null,
				isLoaded: false,
				lastCheckpoint: null,
				sector: null,
				serverTime: undefined,
				shift: null,
				user: null,
			};
		}
		return rest;
	},
	{whitelist: ['profile']},
);

// Solo persistimos campos ESTABLES del perfil
const profilePersistConfig = {
	key: 'profile',
	storage: AsyncStorage,
	transforms: [profileTTLTransform],
	whitelist: [
		'user',
		'environment',
		'serverTime',
	],
};

// --- Root reducer con persistencia POR SLICE ---
const rootReducer = combineReducers({
	auth: persistReducer(authPersistConfig,authReducer),
	profile: persistReducer(profilePersistConfig,profileReducer),
});

export const store = configureStore({
	devTools: __DEV__,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST','persist/REHYDRATE','persist/REGISTER'],
			},
		}),
	reducer: rootReducer,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;