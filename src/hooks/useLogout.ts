// src/hooks/useLogout.ts
import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useQueryClient} from '@tanstack/react-query';
import {persistor} from '@/store';
import {clearCredentials} from '@/store/reducers/auth';
import {clearProfile} from '@/store/reducers/user';
import {instance} from '@/data/instance';
import {MMKV_KEYS,storage} from '@/utils/storage';
import {stopTracking} from '@/utils/tracking';
import {disposeChatSocket} from '@/lib/socket/chat';
import {useAppDispatch} from './store';

export function useLogout() {
	const dispatch = useAppDispatch();
	const queryClient = useQueryClient();
	const navigation = useNavigation();

	const logout = useCallback(
		async (askConfirm = true) => {
			const doLogout = async () => {
				try {
					// (Opcional) revocar refresh token en el servidor
					// await instance.post('/auth/logout');
				} catch {
					// no bloquea el logout local si falla el server
				}

				try {
					// 1) Cancelar y limpiar Query Cache
					await queryClient.cancelQueries();
					// Invalidar específicamente el cache del perfil
					queryClient.removeQueries({queryKey: ['current_user']});
					queryClient.removeQueries({queryKey: ['me']});
					queryClient.clear();
				} catch { }

				// 2) Limpiar MMKV storage del usuario y token
				try {
					storage.delete(MMKV_KEYS.user);
					storage.delete(MMKV_KEYS.token);
				} catch { }

				// 3) Detener tracking y cerrar sockets
				try {
					stopTracking();
					disposeChatSocket();
				} catch { }

				// 4) Limpiar Redux
				dispatch(clearCredentials());
				dispatch(clearProfile());

				// 5) Purgar storage persistido (AsyncStorage)
				try {
					await persistor.purge();
				} catch { }

				// 6) Quitar header Authorization de Axios para futuras requests
				delete instance.defaults.headers.common.Authorization;

				// 7) Reset de navegación al stack de Auth/Login
				navigation.reset({index: 0,routes: [{name: 'Auth' as never}]});
			};

			if (askConfirm) {
				Alert.alert(
					'Cerrar sesión',
					'¿Seguro que quieres salir?',
					[
						{style: 'cancel',text: 'Cancelar'},
						{onPress: doLogout,style: 'destructive',text: 'Cerrar sesión'},
					],
					{cancelable: true},
				);
			} else {
				await doLogout();
			}
		},
		[dispatch,navigation,queryClient],
	);

	return {logout};
}
