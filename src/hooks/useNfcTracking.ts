import {useEffect} from 'react';
import {NativeEventEmitter,NativeModules} from 'react-native';
import * as Sentry from '@sentry/react-native';
import {addAppBreadcrumb} from '@/conf/sentry.conf';

type NfcTrackingEvent = {
	data?: Record<string,any>;
	event: string;
};

/**
 * Hook para trackear eventos NFC nativos y enviarlos a Sentry
 * Escucha los eventos emitidos desde NfcModule.kt y los registra como breadcrumbs
 */
export function useNfcTracking() {
	useEffect(() => {
		const {NfcModule} = NativeModules;

		if (!NfcModule) {
			return;
		}

		const eventEmitter = new NativeEventEmitter(NfcModule);

		const subscription = eventEmitter.addListener(
			'NfcTracking',
			(event: NfcTrackingEvent) => {
				const {data,event: eventName} = event;

				// Log en consola para debug
				console.log('[NFC Tracking]',eventName,data);

				// Breadcrumb para Sentry
				addAppBreadcrumb({
					category: 'nfc.native',
					data: {
						event: eventName,
						...data,
					},
					level: getLevelForEvent(eventName),
					message: `NFC: ${eventName}`,
				});

				// Para errores críticos, también enviar como evento
				if (eventName.includes('error')) {
					Sentry.captureMessage(`NFC ${eventName}`,{
						contexts: {
							nfc: {
								event: eventName,
								...data,
							},
						},
						level: 'warning',
						tags: {
							feature: 'nfc',
							nfc_event: eventName,
						},
					});
				}
			},
		);

		return () => {
			subscription.remove();
		};
	},[]);
}

/**
 * Determina el nivel de severidad basado en el nombre del evento
 */
function getLevelForEvent(
	eventName: string,
): 'debug' | 'error' | 'fatal' | 'info' | 'warning' {
	if (eventName.includes('error')) {
		return 'error';
	}
	if (eventName.includes('timeout') || eventName.includes('warning')) {
		return 'warning';
	}
	if (
		eventName === 'scan_success' ||
		eventName === 'ndef_read_success' ||
		eventName === 'write_success'
	) {
		return 'info';
	}
	return 'debug';
}
