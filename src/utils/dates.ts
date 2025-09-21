// src/utils/dates.ts
import { DateTime } from 'luxon';

export const DEFAULT_TZ = 'America/Mexico_City'; // cámbialo si necesitas otro
export const DEFAULT_LOCALE = 'es';

/**
 * Formatea una fecha ISO usando Luxon.
 *
 * @param isoDate string con formato ISO (ej. "2025-08-24T08:34:48.390Z")
 * @param format string opcional: "dd/MM/yyyy", "HH:mm", "dd MMM yyyy HH:mm", etc.
 * @param locale string opcional: ej. "es" para español
 * @returns string con la fecha formateada
 */
export function formatISODate(
  isoDate: null | string | undefined,
  format: string = 'dd/MM/yyyy HH:mm',
  locale: string = 'es',
): string {
  if (!isoDate) {
    return '';
  }

  try {
    const dt = DateTime.fromISO(isoDate, { zone: 'utc' }).setLocale(locale);

    if (!dt.isValid) {
      return '';
    }

    return dt.toFormat(format);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
}

/**
 * Formatea una fecha ISO de forma moderna y localizada.
 *
 * @param isoDate Fecha en formato ISO (ej: "2025-08-24T08:34:48.390Z")
 * @param preset  "DATE", "DATETIME", "TIME" o un DateTime.DATETIME_* de Luxon
 * @param locale  Idioma de salida (ej. "es", "en")
 */
export function formatISODateModern(
  isoDate: null | string | undefined,
  preset: 'DATE' | 'DATETIME' | 'TIME' = 'DATETIME',
  locale: string = 'es',
): string {
  if (!isoDate) {
    return '';
  }

  try {
    const dt = DateTime.fromISO(isoDate).setLocale(locale);
    if (!dt.isValid) {
      return '';
    }

    switch (preset) {
      case 'DATE':
        return dt.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY); // ej: "dom, 24 ago 2025"
      case 'TIME':
        return dt.toLocaleString(DateTime.TIME_SIMPLE); // ej: "8:34 a. m."
      case 'DATETIME':
      default:
        return dt.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY);
      // ej: "dom, 24 ago 2025, 8:34 a. m."
    }
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return '';
  }
}

/**
 * Convierte valores varios (ISO, ms, seg, Date) a DateTime.
 */
export function toDT(
  value?: Date | null | number | string,
  zone: string = DEFAULT_TZ,
  locale: string = DEFAULT_LOCALE,
): DateTime {
  if (value == null) {
    return DateTime.invalid('empty');
  }

  if (value instanceof Date) {
    return DateTime.fromJSDate(value, { zone }).setLocale(locale);
  }

  if (typeof value === 'number') {
    // 13 dígitos -> ms; 10 dígitos -> seg
    const ms = value < 1e12 ? value * 1000 : value;
    return DateTime.fromMillis(ms, { zone }).setLocale(locale);
  }

  // string
  const s = String(value).trim();
  // unix seconds o millis
  if (/^\d{10}$/.test(s)) {
    return DateTime.fromSeconds(Number(s), { zone }).setLocale(locale);
  }
  if (/^\d{13}$/.test(s)) {
    return DateTime.fromMillis(Number(s), { zone }).setLocale(locale);
  }

  // ISO (lo esperado de tu API)
  let dt = DateTime.fromISO(s, { zone }).setLocale(locale);
  if (dt.isValid) {
    return dt;
  }

  // Fallbacks por si llega algo raro
  dt = DateTime.fromRFC2822(s, { zone }).setLocale(locale);
  if (dt.isValid) {
    return dt;
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    return DateTime.fromMillis(parsed, { zone }).setLocale(locale);
  }

  return DateTime.invalid('unparseable');
}

/**
 * “Hoy HH:mm” si es hoy; si no: “dd MMM, HH:mm”.
 */
export function formatWhen(
  value?: Date | null | number | string,
  opts?: { locale?: string; tz?: string },
): string {
  const dt = toDT(
    value,
    opts?.tz ?? DEFAULT_TZ,
    opts?.locale ?? DEFAULT_LOCALE,
  );
  if (!dt.isValid) {
    return '—';
  }

  const now = DateTime.now().setZone(dt.zoneName?.toString());
  if (dt.hasSame(now, 'day')) {
    return dt.toLocaleString(DateTime.TIME_24_SIMPLE); // 13:40
  }
  return dt.toFormat('dd LLL, HH:mm'); // 21 jun, 13:40
}

/**
 * Encabezados de día tipo WhatsApp: “Hoy”, “Ayer”, “lun 21 ago 2025”.
 */
export function formatDayHeader(
  value?: Date | null | number | string,
  opts?: { locale?: string; tz?: string },
): string {
  const locale = opts?.locale ?? DEFAULT_LOCALE;
  const tz = opts?.tz ?? DEFAULT_TZ;

  const dt = toDT(value, tz, locale);
  if (!dt.isValid) {
    return '—';
  }

  const now = DateTime.now().setZone(dt.zoneName?.toString());
  if (dt.hasSame(now, 'day')) {
    return 'Hoy';
  }
  if (dt.hasSame(now.minus({ days: 1 }), 'day')) {
    return 'Ayer';
  }

  // ej: "lun 21 ago 2025"
  return dt.toFormat('ccc d LLL yyyy');
}
