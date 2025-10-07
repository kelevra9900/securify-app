/* eslint-disable @typescript-eslint/no-explicit-any */
/* utils/location.ts */
import {NativeModules,PermissionsAndroid,Platform} from 'react-native';

// ==== Tipos ====

export type LatLng = {accuracy?: number; latitude: number; longitude: number};

export type GetLocationOptions = {
  enableHighAccuracy?: boolean; // default true
  maximumAgeMs?: number;        // no-op en nativo; útil si haces fallback a RN Geolocation
  pollMs?: number;              // solo para watch por polling, default 2s
  requestPermission?: boolean;  // default true
  timeoutMs?: number;           // default 10s
};

export class LocationError extends Error {
  code:
    | 'permission_denied'
    | 'services_disabled'
    | 'timeout'
    | 'unavailable'
    | 'unknown';
  constructor(code: LocationError['code'],message?: string) {
    super(message ?? code);
    this.name = 'LocationError';
    this.code = code;
  }
}

// ==== Acceso al módulo nativo (Android) y fallback (iOS/dev) ====

type NativeLocation = {
  accuracy?: number;
  altitude?: number;
  bearing?: number;
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp: number; // ms
};

type NativeGeoModule = {
  getCurrentPosition: (options?: {enableHighAccuracy?: boolean; timeoutMs?: number}) => Promise<NativeLocation>;
  requestPermissions?: () => void;
};

const {GeolocationModule} = NativeModules as {
  GeolocationModule?: NativeGeoModule;
};

// Fallback a react-native-geolocation (opcional)
let RNGeolocation: any;
try {
  RNGeolocation = require('@react-native-community/geolocation').default ?? require('@react-native-community/geolocation');
} catch { /* opcional */}

// ==== Permisos ====

export async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // Si tu módulo iOS expone requestPermissions, se puede llamar aquí.
    GeolocationModule?.requestPermissions?.();
    return true;
  }

  // ANDROID
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  const res = await PermissionsAndroid.requestMultiple([fine,coarse]);
  const granted =
    res[fine] === PermissionsAndroid.RESULTS.GRANTED ||
    res[coarse] === PermissionsAndroid.RESULTS.GRANTED;

  return granted;
}

// ==== Core helpers ====

function normalizeOptions(opts: GetLocationOptions) {
  return {
    enableHighAccuracy: opts.enableHighAccuracy ?? true,
    maximumAgeMs: opts.maximumAgeMs ?? 1000,
    pollMs: Math.max(500,opts.pollMs ?? 2000),
    timeoutMs: opts.timeoutMs ?? 10_000,
  };
}

function mapNativeErrorToLocationError(e: any): LocationError {
  const msg = (e?.message as string) ?? String(e ?? '');
  const code = (e?.code as string) ?? '';
  if (code === 'E_PERMISSION') {return new LocationError('permission_denied',msg);}
  if (code === 'E_TIMEOUT') {return new LocationError('timeout',msg);}
  if (code === 'E_LOCATION') {return new LocationError('unavailable',msg);}
  // genérico
  return new LocationError('unknown',msg);
}

// ==== API pública ====

/** Obtiene la ubicación actual usando el módulo nativo si existe; si no, usa RN Geolocation. */
export async function getCurrentLatLng(
  opts: GetLocationOptions = {},
): Promise<LatLng> {
  const {requestPermission = true} = opts;
  const {enableHighAccuracy,maximumAgeMs,timeoutMs} = normalizeOptions(opts);

  if (requestPermission) {
    const ok = await ensureLocationPermission();
    if (!ok) {throw new LocationError('permission_denied','Permiso de ubicación denegado');}
  }

  // 1) Preferir el módulo nativo (Android)
  if (GeolocationModule?.getCurrentPosition) {
    try {
      const loc = await GeolocationModule.getCurrentPosition({enableHighAccuracy,timeoutMs});
      return {accuracy: loc.accuracy,latitude: loc.latitude,longitude: loc.longitude};
    } catch (error) {
      throw mapNativeErrorToLocationError(error);
    }
  }

  // 2) Fallback a RN Geolocation (iOS / dev)
  if (!RNGeolocation?.getCurrentPosition) {
    throw new LocationError('unavailable','Geolocation no disponible');
  }

  return new Promise<LatLng>((resolve,reject) => {
    RNGeolocation.getCurrentPosition(
      (pos: any) => {
        const {accuracy,latitude,longitude} = pos.coords;
        resolve({accuracy,latitude,longitude});
      },
      (err: any) => {
        // https://github.com/react-native-geolocation/react-native-geolocation#errors
        switch (err.code) {
          case 1: reject(new LocationError('permission_denied',err.message)); break;
          case 2: reject(new LocationError('services_disabled',err.message)); break;
          case 3: reject(new LocationError('timeout',err.message)); break;
          default: reject(new LocationError('unknown',err.message));
        }
      },
      {
        enableHighAccuracy,
        maximumAge: maximumAgeMs,
        timeout: timeoutMs,
      },
    );
  });
}

/** Variante segura: devuelve null en vez de lanzar error. */
export async function tryGetCurrentLatLng(
  opts?: GetLocationOptions,
): Promise<LatLng | null> {
  try {
    return await getCurrentLatLng(opts);
  } catch {
    return null;
  }
}

/**
 * Watch por polling (cada pollMs hace getCurrentLatLng). Útil hasta que tengas un watch nativo.
 * Devuelve { watchId, stop }.
 */
export async function startLocationWatch(
  cb: (loc: LatLng) => void,
  errCb?: (e: LocationError) => void,
  opts: GetLocationOptions = {},
): Promise<{stop: () => void; watchId: number}> {
  const {requestPermission = true} = opts;
  const {pollMs} = normalizeOptions(opts);

  if (requestPermission) {
    const ok = await ensureLocationPermission();
    if (!ok) {throw new LocationError('permission_denied','Permiso de ubicación denegado');}
  }

  let stopped = false;
  const watchId = Date.now();

  const tick = async () => {
    if (stopped) {return;}
    try {
      const loc = await getCurrentLatLng({...opts,requestPermission: false});
      if (!stopped) {cb(loc);}
    } catch (error) {
      if (!stopped) {errCb?.(error as LocationError);}
    } finally {
      if (!stopped) {setTimeout(tick,pollMs);}
    }
  };

  tick();

  return {
    stop: () => {stopped = true;},
    watchId,
  };
}

/** No-op para esta implementación por polling; útil si usas RNGeolocation.watchPosition */
export function stopAllLocationObservers() {
  // Si usas RNGeolocation.watchPosition en algún lugar, aquí podrías limpiar.
}
