/* eslint-disable no-console */
import {Alert} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {
	checkNotifications,
	type NotificationOption,
	openSettings,
	requestNotifications,
	RESULTS,
} from 'react-native-permissions';
import {updateFCMTokenIfNeeded} from '@/utils/fcm';

/**
 * Pide permisos de notificaciones con el flujo recomendado:
 * 1) check -> si granted, usar.
 * 2) si blocked -> abrir Ajustes (en iOS; en Android mostrar alerta/abrir ajustes).
 * 3) si denied -> botón que llama a request; tras request, si blocked -> Ajustes.
 * Devuelve true si quedó permitido (granted/provisional), false si no.
 */
export async function requestUserPermission(): Promise<boolean> {
	try {
		// 1) check
		const {status: chkStatus} = await checkNotifications();

		// iOS puede devolver BLOCKED en check; Android 13+ no (se detecta tras request)
		if (chkStatus === RESULTS.GRANTED) {
			await ensureRegisteredAndToken();
			console.log('✅ Notificaciones ya permitidas');
			return true;
		}
		if (chkStatus === RESULTS.BLOCKED) {
			console.warn('❌ Notificaciones bloqueadas. Abre Ajustes.');
			try {await openSettings('notifications');} catch { }
			return false;
		}
		if (chkStatus === RESULTS.UNAVAILABLE) {
			console.warn('⚠️ Notificaciones no disponibles en este dispositivo.');
			return false;
		}

		// 2) denied (o Android 13+ sin solicitar aún): pedir permiso
		const iosOptions: NotificationOption[] = ['alert','badge','sound']; // iOS usa estas opciones
		const {settings,status: reqStatus} = await requestNotifications(iosOptions);

		if (reqStatus === RESULTS.GRANTED) {
			await ensureRegisteredAndToken();
			console.log('✅ Notificaciones permitidas tras request');
			return true;
		}

		// iOS puede devolver provisional (silenciosas); lo consideramos OK para FCM si te sirve
		if (reqStatus === RESULTS.LIMITED || settings?.provisional) {
			await ensureRegisteredAndToken();
			console.log('🟡 Notificaciones en modo provisional/limited');
			return true;
		}

		if (reqStatus === RESULTS.BLOCKED) {
			console.warn('❌ Notificaciones bloqueadas por el usuario. Abriendo Ajustes…');
			try {await openSettings('notifications');} catch { }
			return false;
		}

		console.warn('❌ Permiso de notificaciones denegado');
		return false;
	} catch (error) {
		console.warn('⚠️ Error solicitando permisos de notificaciones',error);
		return false;
	}
}

/** Registra el dispositivo para remote messages (iOS) y sincroniza el token FCM */
async function ensureRegisteredAndToken() {
	try {
		if (!messaging().isDeviceRegisteredForRemoteMessages) {
			await messaging().registerDeviceForRemoteMessages();
		}
	} catch (error) {
		console.warn('⚠️ No se pudo registrar el dispositivo para remote messages',error);
	}

	try {
		await updateFCMTokenIfNeeded();
	} catch (error) {
		console.warn('⚠️ No se pudo actualizar el token FCM',error);
	}
}

/**
 * Configura listeners de notificaciones (foreground, opened, initial, token refresh).
 * Devuelve una función para desuscribirse (cleanup).
 */
export function setupNotificationListeners() {
	// Foreground
	const unsubOnMessage = messaging().onMessage(async remoteMessage => {
		const body = remoteMessage?.notification?.body ?? 'Nueva notificación';
		// Evita spamear con Alert si tienes un banner in-app
		Alert.alert('📩 Notificación',body);
	});

	// App en background y el usuario toca la notificación
	const unsubOnOpened = messaging().onNotificationOpenedApp(remoteMessage => {
		console.log('🔙 Notificación desde background:',remoteMessage);
		// TODO: deep link según remoteMessage.data
	});

	// App terminada (cold start) por una notificación
	const initialPromise = messaging().getInitialNotification().then(remoteMessage => {
		if (remoteMessage) {
			console.log('💤 Notificación desde app terminada:',remoteMessage);
			// TODO: deep link inicial
		}
	});

	// Token FCM refrescado
	const unsubOnTokenRefresh = messaging().onTokenRefresh(async token => {
		console.log('🔄 Token FCM actualizado:',token);
		try {
			await updateFCMTokenIfNeeded();
		} catch (error) {
			console.warn('⚠️ No se pudo sincronizar el token refrescado',error);
		}
	});

	// cleanup
	return () => {
		unsubOnMessage();
		unsubOnOpened();
		unsubOnTokenRefresh();
		// initialPromise es una promesa, no requiere cleanup
	};
}

/**
 * (Opcional) Registra un handler de mensajes en background.
 * Llamar en index.js, fuera de componentes.
 */
export function registerBackgroundHandler() {
	messaging().setBackgroundMessageHandler(async remoteMessage => {
		console.log('🌙 Mensaje en background:',remoteMessage?.messageId);
		// TODO: analytics, prefetch, actualizar badge, etc.
	});
}
