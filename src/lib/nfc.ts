/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/nfc.ts
import {Platform} from 'react-native';
import NfcManager,{
	Ndef,
	type NdefRecord,
	NfcEvents,
	NfcTech,
	type TagEvent,
} from 'react-native-nfc-manager';

let _started = false;
async function ensureStarted() {
	if (_started) {return;}
	await NfcManager.start();
	_started = true;
}

export type NfcReadResult = {
	rawTag?: TagEvent;
	text?: string;
	uri?: string;
};

// -- HOISTED: fuera del scope para satisfacer unicorn/consistent-function-scoping
async function cleanupNfcIOS(): Promise<void> {
	try {await NfcManager.unregisterTagEvent();} catch { }
	try {(NfcManager as any).setEventListener?.(NfcEvents.DiscoverTag,null);} catch { }
}

// Normaliza payload -> Uint8Array
function toU8(payload: unknown): Uint8Array {
	if (!payload) {return new Uint8Array(0);}
	if (payload instanceof Uint8Array) {return payload;}
	if (Array.isArray(payload)) {return Uint8Array.from(payload as number[]);}
	const maybe = (payload as any)?.data;
	if (Array.isArray(maybe)) {return Uint8Array.from(maybe as number[]);}
	try {return new Uint8Array(payload as ArrayLike<number>);} catch {return new Uint8Array(0);}
}

function decodeNdef(records?: NdefRecord[] | null): {text?: string; uri?: string} | null {
	if (!records?.length) {return null;}
	const [rec] = records;

	if (Ndef.isType(rec,Ndef.TNF_WELL_KNOWN,Ndef.RTD_TEXT)) {
		try {return {text: Ndef.text.decodePayload(toU8(rec.payload))};} catch { }
	}
	if (Ndef.isType(rec,Ndef.TNF_WELL_KNOWN,Ndef.RTD_URI)) {
		try {return {uri: Ndef.uri.decodePayload(toU8(rec.payload))};} catch { }
	}
	return null;
}

export async function readNdefOnce(
	alertMessage: string = 'Acerca una etiqueta NFC'
): Promise<NfcReadResult> {
	await ensureStarted();

	const supported = await NfcManager.isSupported();
	if (!supported) {throw new Error('NFC no soportado en este dispositivo.');}

	const enabled = await NfcManager.isEnabled();
	if (!enabled) {throw new Error('NFC está desactivado.');}

	if (Platform.OS === 'android') {
		try {
			await NfcManager.requestTechnology(NfcTech.Ndef,{alertMessage});
			const tag = (await NfcManager.getTag()) as TagEvent | undefined;
			const decoded = decodeNdef(tag?.ndefMessage as NdefRecord[] | undefined) || {};
			return {rawTag: tag,text: decoded.text,uri: decoded.uri};
		} finally {
			await NfcManager.cancelTechnologyRequest().catch(() => { });
		}
	}

	// iOS
	return new Promise<NfcReadResult>(async (resolve,reject) => {
		const onTag = async (tag: TagEvent) => {
			const decoded = decodeNdef(tag?.ndefMessage as NdefRecord[] | undefined) || {};
			try {(NfcManager as any).setAlertMessageIOS?.('Etiqueta detectada');} catch { }
			await cleanupNfcIOS();
			resolve({rawTag: tag,text: decoded.text,uri: decoded.uri});
		};

		try {
			// Listener + sesión con opciones (tu versión acepta objeto de opciones)
			(NfcManager as any).setEventListener?.(NfcEvents.DiscoverTag,onTag);
			await (NfcManager as any).registerTagEvent({alertMessage});
		} catch (error) {
			await cleanupNfcIOS();
			reject(error instanceof Error ? error : new Error(String(error)));
		}
	});
}
