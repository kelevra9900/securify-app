export type RoundListItem = {
  checkpoints: Checkpoint[];
  completedCheckpoints?: number; // Checkpoints completados en lap actual
  completedLaps?: number; // Número de vueltas completadas
  currentLap?: number; // Vuelta actual (1, 2, 3...)
  endISO: null | string;
  id: number;
  isCompleted?: boolean; // Si el lap actual está completo
  isCyclic?: boolean; // Si la ronda es cíclica (puede reiniciarse)
  name: string;
  progressLabel?: string; // "3/6 (Vuelta 2)"
  startISO: string;
  status: RoundStatus;
  totalCheckpoints: number;
};

export type Checkpoint = {
  id: number;
  location: string;
};

export type RoundDetail = {
  checkpoints: {
    id: number;
    latitude: number;
    location: string;
    longitude: number;
  }[];
  endISO: null | string;
  id: number;
  logs: {checkpointId: number; timestampISO: string}[];
  name: string;
  remainingMinutes: null | number;
  startISO: string;
};

export type PastRound = {
  completedCheckpoints?: number;
  date: string; // ya formateada en pantalla (ej: "21 junio, 06:00 AM")
  id: string;
  isCyclic?: boolean; // Si la ronda puede reiniciarse
  name: string;
  status: 'completed' | 'incomplete';
  totalCheckpoints?: number;
};

export function mapPastStatus(s: RoundListItem['status']): PastRound['status'] {
  return s === 'COMPLETED' || s === 'VERIFIED' ? 'completed' : 'incomplete';
}

export type RoundStatus = 'ACTIVE' | 'COMPLETED' | 'IN_PROGRESS' | 'VERIFIED';

export type RoundCheckpoint = {
  done?: boolean;
  id: number;
  latitude: number;
  longitude: number;
  name: string; // mapea a Checkpoint.location
};

export type RoundProgress = {
  completedLaps?: number; // Número de vueltas completadas
  currentLap?: number; // Vuelta actual (1, 2, 3...)
  done: number;
  total: number;
};

/** Respuesta estándar de API con reloj del servidor */
export type ApiEnvelope<T> = {
  data: T;
  ok: true;
  serverTimeISO: string; // ISO UTC del servidor
};

/** Payload de datos cuando una ronda está en curso */
export type ActiveRoundData = {
  checkpoints: RoundCheckpoint[];
  id: number;
  name: string;
  progress: RoundProgress;
  startedAtISO: string;
  status: 'IN_PROGRESS';
};

/** GET /rounds/active => data puede ser null si no hay ronda en curso */
export type ActiveRoundResponse = ApiEnvelope<ActiveRoundData | null>;

/** POST /rounds/:id/start => siempre retorna IN_PROGRESS */
export type StartRoundResponse = ApiEnvelope<ActiveRoundData>;
