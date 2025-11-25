/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios,{AxiosHeaders} from 'axios';
import {Platform} from 'react-native';

import store from '@/store';
import {clearCredentials,setCredentials} from '@/store/reducers/auth';
import {API_URL} from '@/utils/constants';

let RNLocalize: any;
try {
  RNLocalize = require('react-native-localize');
} catch {
  RNLocalize = null;
}

type StoredCredentials = {
  refreshToken: string;
  token: string;
};

interface RefreshTokenResponse {
  accessToken?: string;
  jwt?: string;

  refreshToken?: string;
  token?: string;
}

const REFRESH_ENDPOINT = 'mobile/auth/refresh-token';
const ensureTrailingSlash = (base: string): string =>
  base.endsWith('/') ? base : `${base}/`;
const REFRESH_URL = `${ensureTrailingSlash(API_URL)}${REFRESH_ENDPOINT}`;

let refreshPromise: null | Promise<null | StoredCredentials> = null;

const requestTokenRefresh = async (): Promise<null | StoredCredentials> => {
  const state = store.getState() as any;
  const currentRefreshToken: null | string | undefined = state?.auth?.refreshToken;
  if (!currentRefreshToken) {
    return null;
  }

  try {
    const {data} = await axios.post<RefreshTokenResponse>(
      REFRESH_URL,
      {refreshToken: currentRefreshToken},
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 15_000,
      },
    );

    const nextToken =
      (typeof data?.jwt === 'string' && data.jwt) ||
      (typeof data?.token === 'string' && data.token) ||
      (typeof data?.accessToken === 'string' && data.accessToken) ||
      null;

    if (!nextToken) {
      return null;
    }

    const nextRefreshToken =
      (typeof data?.refreshToken === 'string' && data.refreshToken) ||
      currentRefreshToken;

    store.dispatch(
      setCredentials({
        refreshToken: nextRefreshToken,
        token: nextToken,
      }),
    );

    return {
      refreshToken: nextRefreshToken,
      token: nextToken,
    };
  } catch (refreshError) {
    console.warn('Token refresh failed',refreshError);
    return null;
  }
};

const enqueueTokenRefresh = (): Promise<null | StoredCredentials> => {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

function resolveTimezone(): string {
  return (
    RNLocalize?.getTimeZone?.() ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    'America/Mexico_City'
  );
}

function resolveLanguage(): string {
  return RNLocalize?.getLocales?.()?.[0]?.languageTag || 'es-MX';
}

function genRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

function isFormData(data: unknown): boolean {
  // RN expone FormData global; esta verificación es suficiente
  // (si usas otro polyfill, puedes reforzar con: typeof data?.append === 'function')
  return typeof FormData !== 'undefined' && data instanceof FormData;
}

export const instance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 20_000,
});

instance.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token: string | undefined = state?.auth?.token || undefined;
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const tz = resolveTimezone();
    const lang = resolveLanguage();
    const appVersion = '1.0.0';
    const appBuild = '1';

    const headers = AxiosHeaders.from(config.headers);
    const sendingForm = isFormData(config.data);

    // —— Headers comunes ——
    headers.set('Accept','application/json');
    headers.set('X-Client-Platform',platform);
    headers.set('platform',platform);
    headers.set('X-Client-Timezone',tz);
    headers.set('Accept-Language',lang);
    headers.set('X-App-Version',appVersion);
    headers.set('X-App-Build',appBuild);
    headers.set('X-Request-Id',genRequestId());

    // —— Auth ——
    if (token) {
      headers.set('Authorization',`Bearer ${token}`);
    } else {
      headers.delete('Authorization');
    }

    // —— Content-Type según body ——
    if (sendingForm) {
      headers.delete('Content-Type');
      headers.set('Content-Type','multipart/form-data');
    } else {
      if (!headers.has('Content-Type') && !headers.has('content-type')) {
        headers.set('Content-Type','application/json');
      }
    }

    config.headers = headers;

    try {
      const base = config.baseURL || API_URL || '';
      const absolute = config.url
        ? new URL(config.url as any,base as any).toString()
        : '';
      console.log('REQUEST ===>',{
        absolute_url: absolute,
        base_url: base,
        headers: headers.toJSON?.() ?? headers,
        isForm: sendingForm,
        method: config.method,
        params: config.params,
        url: config.url,
      });
    } catch {
      console.log('REQUEST ===>',{
        base_url: API_URL,
        headers: headers.toJSON?.() ?? headers,
        isForm: sendingForm,
        method: config.method,
        params: config.params,
        url: config.url,
      });
    }

    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  async (response) => {
    try {
      // Cache ETag solo si es 200 y fue GET/HEAD
      const method = (response.config?.method || 'get').toUpperCase();
      const key = (response.config as any)?.metadata?.cacheKey;
      const etag = (response.headers as any)?.etag;
      if (
        (method === 'GET' || method === 'HEAD') &&
        key &&
        etag &&
        response.status === 200
      ) {
        await AsyncStorage.multiSet([
          [`${key}:etag`,etag],
          [`${key}:body`,JSON.stringify(response.data)],
        ]);
      }
    } catch {
      /* noop */
    }
    return response;
  },
  async (error) => {
    const resp = error?.response;

    console.log('Error on request',error);
    if (
      !resp &&
      (error?.message?.includes('Network Error') ||
        error?.code === 'ERR_NETWORK')
    ) {
      const base = error?.config?.baseURL || API_URL;
      const url = error?.config?.url;
      console.warn('Network Error (no HTTP response). Check:',{
        absolute_url: url
          ? (() => {
            try {
              return new URL(url as any,base as any).toString();
            } catch {
              return url;
            }
          })()
          : url,
        base,
        url,
      });
    }

    // Rehidratación si vino 304
    if (resp?.status === 304) {
      try {
        const key = (resp.config as any)?.metadata?.cacheKey;
        if (key) {
          const [,body] = await AsyncStorage.multiGet([
            `${key}:etag`,
            `${key}:body`,
          ]);
          const cached = body?.[1];
          if (cached) {
            return {
              ...resp,
              data: JSON.parse(cached),
              status: 200,
            };
          }
        }
      } catch {
        /* noop */
      }
    }

    if (resp?.status === 401) {
      console.warn('Unauthorized (401)');

      const originalRequest = error.config;
      const requestUrl = (originalRequest?.url as string | undefined) ?? '';
      const isRefreshAttempt = requestUrl.includes(REFRESH_ENDPOINT);

      if (originalRequest && !(originalRequest as any).__isRetryRequest && !isRefreshAttempt) {
        try {
          const refreshed = await enqueueTokenRefresh();
          if (refreshed?.token) {
            (originalRequest as any).__isRetryRequest = true;
            const headers = AxiosHeaders.from(originalRequest.headers ?? {});
            headers.set('Authorization',`Bearer ${refreshed.token}`);
            originalRequest.headers = headers;
            return instance.request(originalRequest);
          }
        } catch (error_) {
          console.warn('Failed to recover from 401',error_);
        }
      }

      store.dispatch(clearCredentials());
    }

    throw error;
  },
);
