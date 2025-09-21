export type RoundListItem = {
  checkpoints: Checkpoint[];
  endISO: null | string;
  id: number;
  name: string;
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
  logs: { checkpointId: number; timestampISO: string }[];
  name: string;
  remainingMinutes: null | number;
  startISO: string;
};

export type PastRound = {
  date: string; // ya formateada en pantalla (ej: "21 junio, 06:00 AM")
  id: string;
  name: string;
  status: 'completed' | 'incomplete';
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
