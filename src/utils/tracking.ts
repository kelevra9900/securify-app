/* eslint-disable @typescript-eslint/no-explicit-any */
import {NativeModules,PermissionsAndroid,Platform} from 'react-native';

/**
 * Native module contract – keep it flexible between platforms.
 */
type TrackingModuleSpec = {
	saveAuth: (...args: any[]) => void;
	start: (options?: Record<string,any>) => void;
	stop: () => void;
	update: (options?: Record<string,any>) => void;

	// Android-only helpers (optional on iOS)
	isIgnoringBatteryOptimizations?: () => Promise<boolean>;
	openBatteryOptimizationSettings?: () => void;
	requestIgnoreBatteryOptimizations?: () => void;

	// iOS (optional): if you add a native method to trigger permission prompts upfront.
	requestPermissions?: () => void;
};

// May be undefined in tests/web – guard with getter.
function getTrackingModule(): TrackingModuleSpec {
	// Look up the module at call time instead of capturing at module-eval time
	const mod = (NativeModules as any).TrackingModule as TrackingModuleSpec | undefined;
	if (!mod) {
		throw new Error(
			'[Tracking] Native module not found. Rebuild the iOS app and check Target Membership of TrackingModule.swift and TrackingModule.m.'
		);
	}

	const ok =
		(NativeModules as any).TrackingModule &&
		typeof (NativeModules as any).TrackingModule.start === 'function';
	console.log('[TrackingModule] ready:',ok);



	return mod;
}


/* =========================
 *   PERMISSIONS
 * ========================= */

/**
 * iOS: we rely on the native module (Core Location) to show the prompts
 * when start() is called. If you want to trigger prompts earlier,
 * call getTrackingModule().requestPermissions?.() from your UI.
 */
async function requestIOSPermissions(): Promise<boolean> {
	// Native prompts will be shown by the iOS module on start()
	return true;
}

/**
 * Requests all needed permissions across platforms.
 */
export async function requestAllLocationPermissions(): Promise<boolean> {
	if (Platform.OS === 'android') {
		// Foreground fine location
		const fine = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
		);
		if (fine !== PermissionsAndroid.RESULTS.GRANTED) {return false;}

		// Background location (Android 10+)
		if (Platform.Version >= 29) {
			await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
			);
		}

		// Post notifications (Android 13+)
		if (Platform.Version >= 33) {
			await PermissionsAndroid.request(
				PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
			);
		}
		return true;
	}
	// iOS – let native module handle prompts on start()
	return requestIOSPermissions();
}

/* =========================
 *   PUBLIC API
 * ========================= */

export type StartTrackingCommon = {
	socketUrl: string;
	token: string;
	/** iOS only: Socket.IO event name. Defaults to 'new_location'. */
	eventName?: string;
};

export type StartTrackingAndroid = {
	fastestMs?: number;
	intervalMs?: number;
	minDistanceMeters?: number;
	namespace?: string;
};

export type StartTrackingIOS = {
	activityType?: 'automotive' | 'fitness';
	minDistanceMeters?: number;
	throttleMs?: number;
};

export async function startTracking(
	opts: StartTrackingAndroid & StartTrackingCommon & StartTrackingIOS
) {
	const ok = await requestAllLocationPermissions();
	if (!ok) {return;}

	const mod = getTrackingModule();

	if (Platform.OS === 'android') {
		mod.saveAuth(opts.token,opts.socketUrl);
		mod.start({
			fastestMs: opts.fastestMs ?? 5000,
			intervalMs: opts.intervalMs ?? 10_000,
			minDistanceMeters: opts.minDistanceMeters ?? 5,
			namespace: opts.namespace ?? '/tracker',
			socketUrl: opts.socketUrl,
			token: opts.token,
		});
	} else {
		// iOS: save auth + event and let native start request permissions if needed
		mod.saveAuth(opts.token,opts.socketUrl,opts.eventName ?? 'new_location');
		mod.start({
			activityType: opts.activityType ?? 'fitness',
			minDistanceMeters: opts.minDistanceMeters ?? 5,
			namespace: opts.namespace ?? '/tracker',
			throttleMs: opts.throttleMs ?? 1500,
		});
	}
}

export function updateTracking(config: Partial<StartTrackingAndroid & StartTrackingIOS>) {
	const mod = getTrackingModule();
	if (Platform.OS === 'android') {
		mod.update({
			fastestMs: config.fastestMs,
			intervalMs: config.intervalMs,
			minDistanceMeters: config.minDistanceMeters,
		});
	} else {
		mod.update({
			minDistanceMeters: config.minDistanceMeters,
			throttleMs: config.throttleMs,
		});
	}
}

export function stopTracking() {
	getTrackingModule().stop();
}

/** Update token/url without restarting the service. */
export function setTrackingAuth(token: string,socketUrl: string,eventName?: string) {
	const mod = getTrackingModule();
	if (Platform.OS === 'android') {
		mod.saveAuth(token,socketUrl);
	} else {
		mod.saveAuth(token,socketUrl,eventName ?? 'new_location');
	}
}

/* =========================
 *   ANDROID BATTERY HELPERS
 * ========================= */

export function openBatteryOptimizationSettings() {
	if (Platform.OS !== 'android') {return;}
	getTrackingModule().openBatteryOptimizationSettings?.();
}

export function requestIgnoreDozeWhitelist() {
	if (Platform.OS !== 'android') {return;}
	getTrackingModule().requestIgnoreBatteryOptimizations?.();
}

export async function isIgnoringDozeWhitelist(): Promise<boolean> {
	if (Platform.OS !== 'android') {return true;}
	const mod = getTrackingModule();
	if (!mod.isIgnoringBatteryOptimizations) {return false;}
	try {
		return await mod.isIgnoringBatteryOptimizations();
	} catch {
		return false;
	}
}

/* =========================
 *   OPTIONAL (iOS-ONLY) – call this from UI to show prompts before start()
 * ========================= */
export function requestIOSLocationPromptsNow() {
	if (Platform.OS !== 'ios') {return;}
	getTrackingModule().requestPermissions?.();
}
