/* eslint-disable @typescript-eslint/no-explicit-any */
import type { JSX } from 'react';

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import React from 'react';
import { hideMessage, showMessage } from 'react-native-flash-message';

import { moderateScale } from '@/constants';

// Si ya tienes un módulo de colores, usa el tuyo.
// Estos son defaults seguros:
const palette = {
  cardShadow: '#000',
  errorBg: '#FFE8E8',
  errorFg: '#B3261E',
  infoBg: '#E3F2FD',
  infoFg: '#0D47A1',
  successBg: '#E8F5E9',
  successFg: '#1B5E20',
  warnBg: '#FFF8E1',
  warnFg: '#8D6E00',
};

type Variant = 'error' | 'info' | 'success' | 'warning';

type ToastOptions = {
  autoHide?: boolean; // default: true
  description?: string;
  durationMs?: number; // si no se indica, se calcula según longitud
  floating?: boolean; // default: true
  icon?: IconRenderable;
  persistKey?: string; // evita duplicados en una ventana corta
  position?: 'bottom' | 'center' | 'top'; // default: 'top'
  title?: string;
  topOffset?: number; // ej. safe area top
  variant?: Variant;
};
type IconRenderable = React.FC<null> | React.ReactElement; // 👈 válido para la lib

// throttle anti-duplicados
let lastKey: null | string = null;
let lastTs = 0;
function shouldSkip(key?: string, throttleMs = 1200) {
  if (!key) {
    return false;
  }
  const now = Date.now();
  if (key === lastKey && now - lastTs < throttleMs) {
    return true;
  }
  lastKey = key;
  lastTs = now;
  return false;
}

function computeDurationMs(desc?: string, fixed?: number) {
  if (fixed) {
    return fixed;
  }
  const len = desc?.length ?? 0;
  // 2.2s base + 30ms por caracter (máx 6s)
  return Math.min(6000, 2200 + len * 30);
}

function pickColors(variant: Variant) {
  switch (variant) {
    case 'info':
      return { bg: palette.infoBg, fg: palette.infoFg };
    case 'success':
      return { bg: palette.successBg, fg: palette.successFg };
    case 'warning':
      return { bg: palette.warnBg, fg: palette.warnFg };
    case 'error':
    default:
      return { bg: palette.errorBg, fg: palette.errorFg };
  }
}

function defaultIcon(variant: Variant, fg: string): React.FC {
  const size = moderateScale(20);
  const props = { color: fg, size } as const;
  switch (variant) {
    case 'info':
      return () => <Info {...props} />;
    case 'success':
      return () => <CheckCircle {...props} />;
    case 'warning':
      return () => <AlertTriangle {...props} />;
    case 'error':
    default:
      return () => <XCircle {...props} />;
  }
}

function asIconFC(icon?: IconRenderable): React.FC | undefined {
  if (!icon) {
    return undefined;
  }
  // Si ya es FC, devuélvelo
  if (typeof icon === 'function') {
    return icon as unknown as React.FC;
  }
  // Si es un elemento <Icon/>, envuelve en una FC
  return () => icon as React.ReactElement;
}

export function showToast(opts: ToastOptions) {
  const {
    autoHide = true,
    description,
    durationMs,
    floating = true,
    icon,
    persistKey,
    position = 'top',
    title,
    topOffset,
    variant = 'error',
  } = opts;

  if (shouldSkip(persistKey)) {
    return;
  }

  const { bg, fg } = pickColors(variant);
  const messageTitle =
    title ??
    (variant === 'success'
      ? '¡Listo!'
      : variant === 'info'
        ? 'Información'
        : variant === 'warning'
          ? 'Atención'
          : '¡Ups! hubo un error');

  showMessage({
    autoHide,
    backgroundColor: bg,
    color: fg,
    description,
    duration: computeDurationMs(description, durationMs),
    floating,
    icon: asIconFC(icon) ?? defaultIcon(variant, fg), // 👈 ahora cumple el tipo
    message: messageTitle,
    position,
    style: {
      alignItems: 'center',
      borderRadius: moderateScale(12),
      paddingVertical: moderateScale(12),
      shadowColor: palette.cardShadow,
      shadowOffset: { height: 2, width: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      ...(topOffset != null ? { marginTop: topOffset } : null),
    },
    textStyle: {
      color: fg,
      paddingHorizontal: moderateScale(14),
    },
    titleStyle: {
      color: fg,
      fontWeight: 'bold',
      paddingHorizontal: moderateScale(14),
    },
    type:
      variant === 'error'
        ? 'danger'
        : variant === 'success'
          ? 'success'
          : variant === 'warning'
            ? 'warning'
            : 'info',
  });
}

export function hideToast() {
  hideMessage();
}

// ====== Wrappers cómodos ======
export function showErrorToast(
  err: unknown,
  overrides?: Omit<ToastOptions, 'description' | 'title' | 'variant'>,
) {
  const { description, title } = normalizeError(err);
  showToast({
    description,
    persistKey: overrides?.persistKey ?? 'error',
    title,
    variant: 'error',
    ...overrides,
  });
}

export function showSuccessToast(
  description: string,
  overrides?: Omit<ToastOptions, 'description' | 'variant'>,
) {
  showToast({
    description,
    persistKey: overrides?.persistKey ?? 'success',
    variant: 'success',
    ...overrides,
  });
}

export function showInfoToast(
  description: string,
  overrides?: Omit<ToastOptions, 'description' | 'variant'>,
) {
  showToast({
    description,
    persistKey: overrides?.persistKey ?? 'info',
    variant: 'info',
    ...overrides,
  });
}

export function showWarningToast(
  description: string,
  overrides?: Omit<ToastOptions, 'description' | 'variant'>,
) {
  showToast({
    description,
    persistKey: overrides?.persistKey ?? 'warning',
    variant: 'warning',
    ...overrides,
  });
}

// ====== Normalizador de errores práctico ======
function normalizeError(e: any): { description: string; title: string } {
  // string directo
  if (typeof e === 'string') {
    return { description: e, title: '¡Ups! hubo un error' };
  }

  // Error estándar
  if (e?.message && typeof e.message === 'string') {
    return { description: e.message, title: '¡Ups! hubo un error' };
  }

  // fetch -> parse body text/json común
  if (e?.response) {
    try {
      const data = e.response.data ?? e.response;
      const msg =
        data?.message ??
        data?.error ??
        (typeof data === 'string' ? data : JSON.stringify(data));
      return { description: String(msg), title: '¡Ups! hubo un error' };
    } catch {
      /* no-op */
    }
  }

  try {
    return {
      description: JSON.stringify(e),
      title: '¡Ups! hubo un error',
    };
  } catch {
    return {
      description: 'Ocurrió un error inesperado.',
      title: '¡Ups! hubo un error',
    };
  }
}
