/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {NativeModules,PermissionsAndroid,Platform} from 'react-native';

type Void = Promise<void> | void;
/** Firma real de lo que exportan tus bridges nativos */
type TrackingModuleSpec = {
  saveAuth: (
    token: string,
    socketUrl: string,
    event?: string,
    namespace?: string,
  ) => Void;
  start: (options?: Record<string,any>) => Void;
  stop: () => Void;
  update: (options?: Record<string,any>) => Void;

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
  enableHighAccuracy?: boolean;
  timeoutMs?: number;
};

const {GeolocationModule} = NativeModules as {
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

  const {enableHighAccuracy = true,timeoutMs = 10_000} = opts;
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

    console.log(`[${MODULE_NAME}] ready:`,ok);
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
      return {ok: false,reason};
    }
    const bgOk = await requestAndroidBackgroundIfNeeded();
    if (!bgOk) {
      return {ok: false,reason: 'background_denied'};
    }

    await requestAndroidNotificationsIfNeeded();
    return {ok: true};
  }
  const iosOk = await requestIOSPermissions();
  return {ok: iosOk};
}

/* =========================
 *   PUBLIC API
 * ========================= */

export type StartTrackingCommon = {
  socketUrl: string;
  token: string;
  /** iOS only: Socket.IO event name. Defaults to 'new_location'. */
  eventName?: string;
  /** Evento rápido que solo actualiza caché en el backend. */
  realtimeEventName?: string;
  /** Namespace para ambos (se normaliza con /) */
  namespace?: string;
  /** Android: distancia mínima para disparar el evento de tiempo real. */
  realtimeMinDistanceMeters?: number;
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
): Promise<{ok: boolean; reason?: string}> {
  if (!opts.socketUrl || !opts.token) {
    return {ok: false,reason: 'missing_auth'};
  }

  const perm = await requestAllLocationPermissions();
  if (!perm.ok) {
    return perm;
  }

  const mod = getTrackingModule();
  const namespace = normalizeNamespace(opts.namespace);
  const eventName = opts.eventName ?? 'new_location';
  const realtimeEvent = opts.realtimeEventName ?? 'tracking:location:update';
  const realtimeMinDistance = opts.realtimeMinDistanceMeters ?? 1;

  if (Platform.OS === 'android') {
    console.log('Options info',opts);
    await mod.saveAuth(opts.token,opts.socketUrl,eventName,namespace);
    await mod.start({
      event: eventName,
      fastestMs: opts.fastestMs ?? 5000,
      intervalMs: opts.intervalMs ?? 10_000,
      // Respeta lo que venga de opts, con un buen default para BD:
      minDistanceMeters: typeof opts.minDistanceMeters === 'number' ? opts.minDistanceMeters : 40,
      namespace,
      realtimeEvent,
      realtimeMinDistanceMeters: realtimeMinDistance,
      socketEvent: 'new_location',
      socketUrl: opts.socketUrl,
      throttleMs: typeof opts.throttleMs === 'number' ? opts.throttleMs : 60_000, // 1 min
      token: opts.token,
    });

  } else {
    await mod.saveAuth(opts.token,opts.socketUrl,eventName);
    await mod.start({
      event: eventName,
      fastestMs: opts.fastestMs ?? 5000,
      intervalMs: opts.intervalMs ?? 10_000,
      minDistanceMeters: opts.minDistanceMeters ?? 5,
      namespace,
      realtimeEvent,
      socketUrl: opts.socketUrl,
      token: opts.token,
    });
  }

  return {ok: true};
}

export function updateTracking(
  config: Partial<
    {namespace: string; realtimeMinDistanceMeters: number} & StartTrackingAndroid & StartTrackingIOS
  >,
): void {
  const mod = getTrackingModule();
  const payload: Record<string,any> = {};
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
  if (typeof config.realtimeMinDistanceMeters === 'number') {
    payload.realtimeMinDistanceMeters = config.realtimeMinDistanceMeters;
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
    mod.saveAuth(token,socketUrl,eventName ?? 'save_location','/tracker');
  } else {
    mod.saveAuth(token,socketUrl,eventName ?? 'save_location');
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


export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // Opcional: si quieres forzar el prompt de iOS (puedes invocarlo antes en otra pantalla)
    // NativeModules.GeolocationModule?.requestPermissions?.();
    return true; // iOS gestiona el prompt la primera vez; aquí no bloqueamos.
  }
  // Android
  const fine = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  const coarse = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );

  return (
    fine === PermissionsAndroid.RESULTS.GRANTED ||
    coarse === PermissionsAndroid.RESULTS.GRANTED
  );
}
