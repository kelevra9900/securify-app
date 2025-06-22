import {combineReducers,configureStore} from '@reduxjs/toolkit';
import {persistReducer,persistStore} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './reducers/auth';

const persistConfig = {
	key: 'root',
	storage: AsyncStorage,
	whitelist: ['auth'],
};

const rootReducer = combineReducers({
	auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig,rootReducer);


const store = configureStore({
	devTools: __DEV__,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [
					'persist/PERSIST',
					'persist/REHYDRATE',
					'persist/REGISTER',
				],
			},
		}),
	reducer: persistedReducer,
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;