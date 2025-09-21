/* eslint-disable @typescript-eslint/no-explicit-any */
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

import {
  isIgnoringDozeWhitelist,
  openBatteryOptimizationSettings,
  requestAllLocationPermissions,
  requestIOSLocationPromptsNow,
  setTrackingAuth,
  startTracking,
  stopTracking,
  updateTracking,
} from '@/utils/tracking';

describe('utils/tracking', () => {
  const originalOS = Platform.OS;
  const originalVersion = Platform.Version;

  beforeEach(() => {
    (Platform as any).OS = 'android';
    (Platform as any).Version = 33;
    (NativeModules as any).TrackingModule = {
      saveAuth: jest.fn().mockResolvedValue(undefined),
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      isIgnoringBatteryOptimizations: jest.fn().mockResolvedValue(true),
      openBatteryOptimizationSettings: jest.fn(),
      requestIgnoreBatteryOptimizations: jest.fn(),
      requestPermissions: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
    (Platform as any).OS = originalOS;
    (Platform as any).Version = originalVersion as any;
  });

  test('startTracking -> missing_auth', async () => {
    const res = await startTracking({} as any);
    expect(res).toEqual({ ok: false, reason: 'missing_auth' });
  });

  test('startTracking (android) guarda auth y arranca con defaults', async () => {
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockImplementation(async (perm: any) => {
        if (
          perm === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION ||
          perm === PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION ||
          perm === PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION ||
          perm === PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        ) {
          return PermissionsAndroid.RESULTS.GRANTED as any;
        }
        return PermissionsAndroid.RESULTS.DENIED as any;
      });

    const res = await startTracking({
      socketUrl: 'https://sock',
      token: 'abc',
    } as any);
    expect(res).toEqual({ ok: true });

    const mod = (NativeModules as any).TrackingModule;
    expect(mod.saveAuth).toHaveBeenCalledWith('abc', 'https://sock');
    expect(mod.start).toHaveBeenCalledWith(
      expect.objectContaining({
        fastestMs: 5000,
        intervalMs: 10000,
        minDistanceMeters: 5,
        namespace: '/tracker',
        socketUrl: 'https://sock',
        token: 'abc',
      }),
    );
  });

  test('startTracking (ios) usa eventName y opciones iOS', async () => {
    (Platform as any).OS = 'ios';

    const res = await startTracking({
      socketUrl: 'https://sock',
      token: 'abc',
    } as any);
    expect(res).toEqual({ ok: true });

    const mod = (NativeModules as any).TrackingModule;
    expect(mod.saveAuth).toHaveBeenCalledWith(
      'abc',
      'https://sock',
      'new_location',
    );
    expect(mod.start).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: 'fitness',
        minDistanceMeters: 5,
        namespace: '/tracker',
        throttleMs: 1500,
      }),
    );
  });

  test('updateTracking normaliza namespace y aplica campos', () => {
    updateTracking({
      namespace: 'my-ns',
      minDistanceMeters: 10,
      fastestMs: 1000,
      intervalMs: 2000,
    });
    const mod = (NativeModules as any).TrackingModule;
    expect(mod.update).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: '/my-ns',
        minDistanceMeters: 10,
        fastestMs: 1000,
        intervalMs: 2000,
      }),
    );
  });

  test('stopTracking invoca stop', () => {
    stopTracking();
    const mod = (NativeModules as any).TrackingModule;
    expect(mod.stop).toHaveBeenCalled();
  });

  test('setTrackingAuth (android) y (ios) usan firmas correctas', () => {
    const mod = (NativeModules as any).TrackingModule;
    setTrackingAuth('t', 'u');
    expect(mod.saveAuth).toHaveBeenCalledWith('t', 'u');

    (Platform as any).OS = 'ios';
    mod.saveAuth.mockClear();
    setTrackingAuth('t', 'u');
    expect(mod.saveAuth).toHaveBeenCalledWith('t', 'u', 'new_location');
  });

  test('isIgnoringDozeWhitelist: iOS => true, Android delega y captura errores', async () => {
    (Platform as any).OS = 'ios';
    await expect(isIgnoringDozeWhitelist()).resolves.toBe(true);

    (Platform as any).OS = 'android';
    (
      NativeModules as any
    ).TrackingModule.isIgnoringBatteryOptimizations.mockResolvedValueOnce(
      false,
    );
    await expect(isIgnoringDozeWhitelist()).resolves.toBe(false);

    (
      NativeModules as any
    ).TrackingModule.isIgnoringBatteryOptimizations.mockImplementationOnce(
      () => {
        throw new Error('boom');
      },
    );
    await expect(isIgnoringDozeWhitelist()).resolves.toBe(false);
  });

  test('openBatteryOptimizationSettings y requestIgnoreDozeWhitelist solo en Android', () => {
    const mod = (NativeModules as any).TrackingModule;
    openBatteryOptimizationSettings();
    expect(mod.openBatteryOptimizationSettings).toHaveBeenCalled();
  });

  test('requestAllLocationPermissions maneja flujos Android/iOS', async () => {
    // Android: denegado foreground => detalle
    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce('denied' as any);
    const a1 = await requestAllLocationPermissions();
    expect(a1).toEqual({ ok: false, reason: 'denied' });

    // Android: todo ok
    (PermissionsAndroid.request as any).mockImplementation(
      async (perm: any) => {
        if (
          perm === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION ||
          perm === PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION ||
          perm === PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION ||
          perm === PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        ) {
          return PermissionsAndroid.RESULTS.GRANTED as any;
        }
        return PermissionsAndroid.RESULTS.DENIED as any;
      },
    );
    const a2 = await requestAllLocationPermissions();
    expect(a2).toEqual({ ok: true });

    // iOS: siempre ok (método es stub)
    (Platform as any).OS = 'ios';
    const a3 = await requestAllLocationPermissions();
    expect(a3).toEqual({ ok: true });
  });

  test('requestIOSLocationPromptsNow solo en iOS', () => {
    const mod = (NativeModules as any).TrackingModule;
    (Platform as any).OS = 'android';
    requestIOSLocationPromptsNow();
    expect(mod.requestPermissions).not.toHaveBeenCalled();

    (Platform as any).OS = 'ios';
    requestIOSLocationPromptsNow();
    expect(mod.requestPermissions).toHaveBeenCalled();
  });

  test('getCurrentPositionNative delega al bridge y valida permisos Android', async () => {
    const geo = {
      getCurrentPosition: jest
        .fn()
        .mockResolvedValue({
          latitude: 1,
          longitude: 2,
          timestamp: Date.now(),
        }),
      requestPermissions: jest.fn(),
    };
    (NativeModules as any).GeolocationModule = geo;

    jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED as any);

    // Reimporta el módulo con el mock ya colocado (debido a destructuring en módulo)
    jest.isolateModules(async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const m = require('@/utils/tracking');
      const p = await m.getCurrentPositionNative();
      expect(p.latitude).toBe(1);
      expect(geo.getCurrentPosition).toHaveBeenCalled();
    });
  });
});
