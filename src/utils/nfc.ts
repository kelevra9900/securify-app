import {NativeModules,Platform} from 'react-native';

type ScanResult = {
  ndef?: {
    payload?: string;
    type?: string;
  };
  tech: string;
  uid: string;
};

type WriteOptions = {
  timeoutMs?: number;
};

const {NfcModule} = NativeModules as {
  NfcModule?: {
    isSupported: () => Promise<boolean>;
    scanTag: (options?: {timeoutMs?: number}) => Promise<ScanResult>;
    writeTag: (payload: string,options?: WriteOptions) => Promise<void>;
  };
};

/**
 * Verifica si el dispositivo soporta NFC
 */
export async function isNfcSupported(): Promise<boolean> {
  if (!NfcModule?.isSupported) {
    return false;
  }
  return NfcModule.isSupported();
}

/**
 * Escanea un tag NFC para leer su contenido NDEF
 * @param timeoutMs Tiempo máximo de espera en milisegundos (default: 10000)
 * @returns Información del tag incluyendo UID y payload NDEF
 */
export async function scanCheckpointTag(
  timeoutMs = 10_000,
): Promise<ScanResult> {
  if (!NfcModule?.scanTag) {
    throw new Error('NfcModule not linked');
  }

  const supported = await NfcModule.isSupported();

  if (!supported) {
    throw new Error(
      Platform.OS === 'ios'
        ? 'Este iPhone no soporta NFC o no está habilitado.'
        : 'NFC no soportado en este dispositivo.',
    );
  }

  // eslint-disable-next-line no-console
  console.log(`📱 [NFC] Escaneo activo (${timeoutMs}ms) - Acerca el tag`);

  try {
    const result = await NfcModule.scanTag({timeoutMs});
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ [NFC] Error:',error);
    throw error;
  }
}

/**
 * Escribe un mensaje NDEF en un tag NFC
 * @param payload JSON string con los datos a escribir
 * @param options Opciones de escritura (timeout)
 */
export async function writeCheckpointTag(
  payload: string,
  options?: WriteOptions,
): Promise<void> {
  if (!NfcModule?.writeTag) {
    throw new Error('NfcModule not linked or writeTag not available');
  }
  const supported = await NfcModule.isSupported();
  if (!supported) {
    throw new Error(
      Platform.OS === 'ios'
        ? 'Este iPhone no soporta NFC o no está habilitado.'
        : 'NFC no soportado en este dispositivo.',
    );
  }
  return NfcModule.writeTag(payload,options);
}


export type SanitizeResult =
  | {alias?: string; checkpointId?: string; json: string; ok: true;}
  | {ok: false; reason: 'empty' | 'no-json'};

export function sanitizeNdefPayload(raw: unknown): SanitizeResult {
  if (raw == null) {return {ok: false,reason: 'empty'};}

  let s: string;
  try {
    if (typeof raw === 'string') {
      s = raw;
    } else if (raw instanceof Uint8Array) {
      s = new TextDecoder('utf-8').decode(raw);
    } else if (raw instanceof ArrayBuffer) {
      s = new TextDecoder('utf-8').decode(new Uint8Array(raw));
    } else if (Array.isArray(raw) && raw.every(n => typeof n === 'number')) {
      s = new TextDecoder('utf-8').decode(Uint8Array.from(raw as number[]));
    } else {
      s = String(raw);
    }
  } catch {
    return {ok: false,reason: 'empty'};
  }

  s = s.replace(/^\uFEFF/,'').replaceAll('\0','').trim();
  if (!s) {return {ok: false,reason: 'empty'};}

  // Quitar prefijos MIME comunes o rotos
  const mimePrefixes = [
    /^ication\/json/i,
    /^application\/json(?:;\s*charset=utf-8)?/i,
    /^text\/plain(?:;\s*charset=utf-8)?/i,
  ];
  for (const rx of mimePrefixes) {
    if (rx.test(s)) {
      s = s.replace(rx,'').trim();
      break;
    }
  }

  // Intentar aislar JSON
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1) {return {ok: false,reason: 'no-json'};}

  // Si está truncado, no hay } final → parseo parcial
  const candidate = end > start ? s.slice(start,end + 1) : s.slice(start);
  const clean = candidate.trim();

  // Intentar parseo normal
  try {
    const parsed = JSON.parse(clean) as Record<string,unknown>;
    const alias =
      typeof parsed.alias === 'string' ? parsed.alias : undefined;
    const checkpointId =
      typeof parsed.checkpointId === 'string' ? parsed.checkpointId : undefined;
    return {alias,checkpointId,json: clean,ok: true};
  } catch {
    // Si JSON.parse falla, intentar regex tolerante
    const aliasMatch = /"alias"\s*:\s*"([^"]+)"/.exec(clean);
    const idMatch = /"checkpointId"\s*:\s*"([^"]+)"/.exec(clean);
    const alias = aliasMatch?.[1];
    const checkpointId = idMatch?.[1];
    return alias || checkpointId
      ? {alias,checkpointId,json: clean,ok: true}
      : {ok: false,reason: 'no-json'};
  }
}


