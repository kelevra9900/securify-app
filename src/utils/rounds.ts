/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CheckpointLog } from '@/types/checkpoint';
import type {
  ActiveRoundData,
  ActiveRoundResponse,
  RoundDetail,
  RoundListItem,
  StartRoundResponse,
} from '@/types/rounds';

export const pad = (n: number) => String(n).padStart(2, '0');

export function mmToHHMMSS(min: null | number) {
  if (min == null) {
    return '--:--';
  }
  const total = Math.max(0, Math.floor(min) * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
export function fmtShortRange(startISO: string, endISO: null | string) {
  const s = new Date(startISO);
  const e = endISO ? new Date(endISO) : null;
  const sTime = s.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const eTime = e
    ? e.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '';
  const sDate = s.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
  });
  const eDate = e
    ? e.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    : '';
  const crossesDay = !!e && s.toDateString() !== e.toDateString();
  return crossesDay
    ? `${sDate} ${sTime} — ${eDate} ${eTime}`
    : `${sTime}${e ? ` — ${eTime}` : ''}`;
}
export function mapCardStatus(
  s?: RoundListItem['status'],
): 'active' | 'completed' | 'not_started' {
  if (!s) {
    return 'not_started';
  }
  return s === 'COMPLETED' || s === 'VERIFIED' ? 'completed' : 'active';
}
export function toCheckpointLogs(detail?: RoundDetail): CheckpointLog[] {
  if (!detail) {
    return [];
  }
  const completedIds = new Set(detail.logs.map((l) => String(l.checkpointId)));

  return detail.checkpoints.map((cp) => {
    const last = detail.logs.find(
      (l) => String(l.checkpointId) === String(cp.id),
    );
    return {
      checkpointId: String(cp.id),
      checkpointName: cp.location,
      id: String(cp.id),
      status: completedIds.has(String(cp.id)) ? 'completed' : 'pending',
      ...(last?.timestampISO ? { timestamp: last.timestampISO } : {}), // no pongas undefined
      // guardId/guardName no se incluyen si no los tienes
    };
  });
}

/* ──────────────────────────────────────────────────────────────────────────
   Helpers (opcionales) para type narrowing en runtime
────────────────────────────────────────────────────────────────────────── */

export function isActiveRoundData(x: unknown): x is ActiveRoundData {
  if (!x || typeof x !== 'object') {
    return false;
  }
  const v = x as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    v.status === 'IN_PROGRESS' &&
    typeof v.startedAtISO === 'string' &&
    Array.isArray(v.checkpoints) &&
    typeof (v.progress as any)?.done === 'number' &&
    typeof (v.progress as any)?.total === 'number'
  );
}

export function isActiveRoundResponse(x: unknown): x is ActiveRoundResponse {
  if (!x || typeof x !== 'object') {
    return false;
  }
  const r = x as any;
  if (r.ok !== true || typeof r.serverTimeISO !== 'string') {
    return false;
  }
  return r.data === null || isActiveRoundData(r.data);
}

export function isStartRoundResponse(x: unknown): x is StartRoundResponse {
  if (!x || typeof x !== 'object') {
    return false;
  }
  const r = x as any;
  return (
    r.ok === true &&
    typeof r.serverTimeISO === 'string' &&
    isActiveRoundData(r.data)
  );
}
