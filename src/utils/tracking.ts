/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

type Void = Promise<void> | void;

/** Firma real de lo que exportan tus bridges nativos */
type TrackingModuleSpec = {
  saveAuth: (token: string, socketUrl: string, event?: string) => Void; // iOS usa event; Android lo ignora
  start: (options?: Record<string, any>) => Void;
  stop: () => Void;
  update: (options?: Record<string, any>) => Void;

  // Android-only (opcionales en iOS)
  isIgnoringBatteryOptimizations?: () => Promise<boolean>;
  openBatteryOptimizationSettings?: () => void;
  requestIgnoreBatteryOptimizations?: () => void;

  // iOS-only (opcional)
  requestPermissions?: () => void;
};

const MODULE_NAME = 'TrackingModule';

type NativeLocation = {
  accuracy?: number;
  altitude?: number;
  bearing?: number;
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: number; // ms
};

type Options = {
  enableHighAccuracy?: boolean; // default true
  timeoutMs?: number; // default 10000
};

const { GeolocationModule } = NativeModules as {
  GeolocationModule?: {
    getCurrentPosition: (options?: Options) => Promise<NativeLocation>;
    requestPermissions: () => void;
  };
};

export async function getCurrentPositionNative(
  opts: Options = {},
): Promise<NativeLocation> {
  if (!GeolocationModule?.getCurrentPosition) {
    throw new Error('GeolocationModule is not linked');
  }

  if (Platform.OS === 'android') {
    // pide permisos si hace falta
    const fine = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    const coarse = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    );
    if (fine !== 'granted' && coarse !== 'granted') {
      throw new Error('Location permission not granted');
    }
  } else {
    // iOS: puedes invocar requestPermissions antes desde tu flujo si deseas
  }

  const { enableHighAccuracy = true, timeoutMs = 10_000 } = opts;
  return GeolocationModule.getCurrentPosition({
    enableHighAccuracy,
    timeoutMs,
  });
}

const warn = (m: string) => {
  if (__DEV__) {
    console.warn(`[${MODULE_NAME}] ${m}`);
  }
};

function noopModule(): TrackingModuleSpec {
  return {
    saveAuth: () => warn('saveAuth (noop)'),
    start: () => warn('start (noop)'),
    stop: () => warn('stop (noop)'),
    update: () => warn('update (noop)'),
  };
}

function getTrackingModule(): TrackingModuleSpec {
  const mod = (NativeModules as any)[MODULE_NAME] as
    | TrackingModuleSpec
    | undefined;
  if (!mod) {
    if (__DEV__) {
      console.warn(
        `[${MODULE_NAME}] Native module not found. Did you rebuild iOS/Android? Falling back to noop for dev/test.`,
      );
      return noopModule();
    }
    // En producción, lanza: aquí sí queremos detectar instalación rota.
    throw new Error(
      `[${MODULE_NAME}] Native module not found. Rebuild the app and check Target Membership of TrackingModule.swift/.m`,
    );
  }
  if (__DEV__) {
    const ok =
      typeof (mod as any).start === 'function' &&
      typeof (mod as any).saveAuth === 'function';

    console.log(`[${MODULE_NAME}] ready:`, ok);
  }
  return mod;
}

/* =========================
 *   PERMISSIONS
 * ========================= */

async function requestAndroidForeground(): Promise<
  'denied' | 'granted' | 'never_ask_again'
> {
  const fine = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return fine as any;
}

async function requestAndroidBackgroundIfNeeded(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  if (Platform.Version < 29) {
    return true;
  } // < Android 10 no existe permiso aparte
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestAndroidNotificationsIfNeeded(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  if (Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
  }
}

async function requestIOSPermissions(): Promise<boolean> {
  // Tus prompts los dispara el módulo nativo en start(); si quieres forzarlos antes:
  // getTrackingModule().requestPermissions?.();
  return true;
}

/** Pide permisos en la plataforma actual y devuelve detalle útil para UI */
export async function requestAllLocationPermissions(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (Platform.OS === 'android') {
    const fg = await requestAndroidForeground();
    if (fg !== PermissionsAndroid.RESULTS.GRANTED) {
      const reason =
        fg === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
          ? 'never_ask_again'
          : 'denied';
      return { ok: false, reason };
    }
    const bgOk = await requestAndroidBackgroundIfNeeded();
    if (!bgOk) {
      return { ok: false, reason: 'background_denied' };
    }

    await requestAndroidNotificationsIfNeeded();
    return { ok: true };
  }
  const iosOk = await requestIOSPermissions();
  return { ok: iosOk };
}

/* =========================
 *   PUBLIC API
 * ========================= */

export type StartTrackingCommon = {
  socketUrl: string;
  token: string;
  /** iOS only: Socket.IO event name. Defaults to 'new_location'. */
  eventName?: string;
  /** Namespace para ambos (se normaliza con /) */
  namespace?: string;
};

export type StartTrackingAndroid = {
  fastestMs?: number;
  intervalMs?: number;
  minDistanceMeters?: number;
};

export type StartTrackingIOS = {
  activityType?: 'automotive' | 'fitness';
  minDistanceMeters?: number;
  throttleMs?: number;
};

function normalizeNamespace(ns?: string): string {
  const raw = (ns ?? '/tracker').trim();
  return raw.startsWith('/') ? raw : `/${raw}`;
}

export async function startTracking(
  opts: StartTrackingAndroid & StartTrackingCommon & StartTrackingIOS,
): Promise<{ ok: boolean; reason?: string }> {
  if (!opts.socketUrl || !opts.token) {
    return { ok: false, reason: 'missing_auth' };
  }

  const perm = await requestAllLocationPermissions();
  if (!perm.ok) {
    return perm;
  }

  const mod = getTrackingModule();
  const namespace = normalizeNamespace(opts.namespace);

  if (Platform.OS === 'android') {
    await mod.saveAuth(opts.token, opts.socketUrl);
    await mod.start({
      fastestMs: opts.fastestMs ?? 5000,
      intervalMs: opts.intervalMs ?? 10_000,
      minDistanceMeters: opts.minDistanceMeters ?? 5,
      namespace,
      socketUrl: opts.socketUrl,
      token: opts.token,
    });
  } else {
    await mod.saveAuth(
      opts.token,
      opts.socketUrl,
      opts.eventName ?? 'new_location',
    );
    await mod.start({
      activityType: opts.activityType ?? 'fitness',
      minDistanceMeters: opts.minDistanceMeters ?? 5,
      namespace,
      throttleMs: opts.throttleMs ?? 1500,
    });
  }

  return { ok: true };
}

export function updateTracking(
  config: Partial<
    { namespace: string } & StartTrackingAndroid & StartTrackingIOS
  >,
): void {
  const mod = getTrackingModule();
  const payload: Record<string, any> = {};
  if (typeof config.minDistanceMeters === 'number') {
    payload.minDistanceMeters = config.minDistanceMeters;
  }
  if (Platform.OS === 'android') {
    if (typeof config.fastestMs === 'number') {
      payload.fastestMs = config.fastestMs;
    }
    if (typeof config.intervalMs === 'number') {
      payload.intervalMs = config.intervalMs;
    }
  } else {
    if (typeof config.throttleMs === 'number') {
      payload.throttleMs = config.throttleMs;
    }
  }
  if (config.namespace) {
    payload.namespace = normalizeNamespace(config.namespace);
  }
  mod.update(payload);
}

export function stopTracking(): void {
  getTrackingModule().stop();
}

export function setTrackingAuth(
  token: string,
  socketUrl: string,
  eventName?: string,
): void {
  const mod = getTrackingModule();
  if (Platform.OS === 'android') {
    mod.saveAuth(token, socketUrl);
  } else {
    mod.saveAuth(token, socketUrl, eventName ?? 'new_location');
  }
}

/* =========================
 *   ANDROID BATTERY HELPERS
 * ========================= */

export function openBatteryOptimizationSettings(): void {
  if (Platform.OS !== 'android') {
    return;
  }
  getTrackingModule().openBatteryOptimizationSettings?.();
}

export function requestIgnoreDozeWhitelist(): void {
  if (Platform.OS !== 'android') {
    return;
  }
  getTrackingModule().requestIgnoreBatteryOptimizations?.();
}

export async function isIgnoringDozeWhitelist(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const mod = getTrackingModule();
  if (!mod.isIgnoringBatteryOptimizations) {
    return false;
  }
  try {
    return await mod.isIgnoringBatteryOptimizations();
  } catch {
    return false;
  }
}

/* =========================
 *   iOS – prompts previos (opcional)
 * ========================= */
export function requestIOSLocationPromptsNow(): void {
  if (Platform.OS !== 'ios') {
    return;
  }
  getTrackingModule().requestPermissions?.();
}
