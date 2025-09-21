import { PermissionsAndroid, Platform } from 'react-native';

export type LatLng = { accuracy?: number; latitude: number; longitude: number };

export type GetLocationOptions = {
  enableHighAccuracy?: boolean; // default true
  maximumAgeMs?: number; // default 1000ms (usar cache reciente)
  requestPermission?: boolean; // default true
  timeoutMs?: number; // default 10s
};

export class LocationError extends Error {
  code:
    | 'permission_denied'
    | 'services_disabled'
    | 'timeout'
    | 'unavailable'
    | 'unknown';
  constructor(code: LocationError['code'], message?: string) {
    super(message ?? code);
    this.name = 'LocationError';
    this.code = code;
  }
}

/** Pide permiso de ubicación y devuelve true si fue concedido. */
export async function ensureLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // Muestra el prompt del sistema (no devuelve el estado).
    // Si ya estaba concedido, no hace nada.
    Geolocation.requestAuthorization?.();
    return true; // iOS no expone un resultado; el error real se manejará en getCurrentPosition
  }

  // ANDROID
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

  const res = await PermissionsAndroid.requestMultiple([fine, coarse]);
  const granted =
    res[fine] === PermissionsAndroid.RESULTS.GRANTED ||
    res[coarse] === PermissionsAndroid.RESULTS.GRANTED;

  return granted;
}

/** Normaliza las opciones a las que requiere el módulo. */
function toGeoOptions(opts: GetLocationOptions): GeolocationOptions {
  const {
    enableHighAccuracy = true,
    maximumAgeMs = 1000,
    timeoutMs = 10_000,
  } = opts;

  return {
    enableHighAccuracy,
    maximumAge: maximumAgeMs,
    timeout: timeoutMs,
  };
}

/** Obtiene la ubicación actual (promesa). Lanza LocationError tipado. */
export async function getCurrentLatLng(
  opts: GetLocationOptions = {},
): Promise<LatLng> {
  const { requestPermission = true } = opts;

  if (requestPermission) {
    const ok = await ensureLocationPermission();
    if (!ok) {
      throw new LocationError(
        'permission_denied',
        'Permiso de ubicación denegado',
      );
    }
  }

  const geoOpts = toGeoOptions(opts);

  return new Promise<LatLng>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos: GeolocationResponse) => {
        const { accuracy, latitude, longitude } = pos.coords;
        resolve({ accuracy, latitude, longitude });
      },
      (err: GeolocationError) => {
        // https://github.com/react-native-geolocation/react-native-geolocation#errors
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            reject(new LocationError('permission_denied', err.message));
            break;
          case 2: // POSITION_UNAVAILABLE (GPS/servicios apagados o sin fix)
            reject(new LocationError('services_disabled', err.message));
            break;
          case 3: // TIMEOUT
            reject(new LocationError('timeout', err.message));
            break;
          default:
            reject(new LocationError('unknown', err.message));
        }
      },
      geoOpts,
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

/** Inicia un watch (seguimiento continuo). Devuelve el watchId y un `stop()` */
export async function startLocationWatch(
  cb: (loc: LatLng) => void,
  errCb?: (e: LocationError) => void,
  opts: GetLocationOptions = {},
): Promise<{ stop: () => void; watchId: number }> {
  const { requestPermission = true } = opts;
  if (requestPermission) {
    const ok = await ensureLocationPermission();
    if (!ok) {
      throw new LocationError(
        'permission_denied',
        'Permiso de ubicación denegado',
      );
    }
  }

  const geoOpts = toGeoOptions(opts);

  const watchId = Geolocation.watchPosition(
    (pos: GeolocationResponse) => {
      const { accuracy, latitude, longitude } = pos.coords;
      cb({ accuracy, latitude, longitude });
    },
    (err: GeolocationError) => {
      const map =
        err.code === 1
          ? 'permission_denied'
          : err.code === 2
            ? 'services_disabled'
            : err.code === 3
              ? 'timeout'
              : 'unknown';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errCb?.(new LocationError(map as any, err.message));
    },
    geoOpts,
  );

  return {
    stop: () => Geolocation.clearWatch(watchId),
    watchId,
  };
}

/** Limpia todos los observers (por si tu pantalla sale y quieres asegurar) */
export function stopAllLocationObservers() {
  Geolocation.stopObserving();
}
