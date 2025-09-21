/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios,{AxiosHeaders} from 'axios';
import {Platform} from 'react-native';

import store from '@/store';
import {API_URL} from '@/utils/constants';

// const API_BASE_URL = Config.API_URL ?? '';

let RNLocalize: any;
try {
  RNLocalize = require('react-native-localize');
} catch {
  RNLocalize = null;
}

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

// clave para caché ETag (si la usas)
function cacheKeyFor(config: any,tz: string,userId?: number | string) {
  const base = config.baseURL || API_URL;
  const url = base ? new URL(config.url,base).toString() : String(config.url);
  const params = config.params ? JSON.stringify(config.params) : '';
  const uid = userId ?? 'anon';
  const method = (config.method || 'get').toLowerCase();
  return `v1|${method}|${url}|p:${params}|tz:${tz}|u:${uid}`;
}

export const instance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 20_000,
});

instance.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token: string | undefined = state?.auth?.token || undefined;
    const userID = state?.profile?.user?.id;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const tz = resolveTimezone();
    const lang = resolveLanguage();
    const appVersion = '1.0.0';
    const appBuild = '1';

    const headers = AxiosHeaders.from(config.headers);
    const method = (config.method || 'get').toUpperCase();
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
      headers.delete('content-type');
    } else {
      if (!headers.has('Content-Type') && !headers.has('content-type')) {
        headers.set('Content-Type','application/json');
      }
    }

    // —— ETag solo para GET/HEAD ——
    const key = cacheKeyFor(config,tz,userID);
    (config as any).metadata = {cacheKey: key};
    if (method === 'GET' || method === 'HEAD') {
      try {
        const etag = await AsyncStorage.getItem(`${key}:etag`);
        if (etag) {
          headers.set('If-None-Match',etag);
        }
      } catch {
        /* noop */
      }
    } else {
      headers.delete('If-None-Match');
    }

    config.headers = headers;

    // Logs (evita en prod). Ojo con FormData: no intentes serializarlo.
    try {
      const base = config.baseURL || API_URL || '';
      const absolute = config.url ? new URL(config.url as any,base as any).toString() : '';
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
    if (!resp && (error?.message?.includes('Network Error') || error?.code === 'ERR_NETWORK')) {
      const base = error?.config?.baseURL || API_URL;
      const url = error?.config?.url;
      console.warn('Network Error (no HTTP response). Check:',{
        absolute_url: url ? (() => {try {return new URL(url as any,base as any).toString();} catch {return url;} })() : url,
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
      // TODO: dispatch logout/refresh
    }

    throw error;
  },
);
