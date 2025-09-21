// src/data/services/rounds.ts
import type {
  ActiveRoundResponse,
  RoundDetail,
  RoundListItem,
  StartRoundResponse,
} from '@/types/rounds';

import { instance } from '../instance';

export async function getAvailableRounds(): Promise<RoundListItem[]> {
  const { data } = await instance.get<{ data: RoundListItem[] }>(
    '/mobile/rounds/available',
  );
  return data.data;
}

export async function getRoundDetail(roundId: number): Promise<RoundDetail> {
  const { data } = await instance.get<{ data: RoundDetail }>(
    `/mobile/rounds/${roundId}`,
  );
  return data.data;
}

export async function endRound(roundId: number, body?: { notes?: string }) {
  const { data } = await instance.post(
    `/mobile/rounds/${roundId}/end`,
    body ?? {},
  );
  return data;
}

export async function logCheckpoint(
  roundId: number,
  cpId: number,
  body: { code?: string; lat?: number; lon?: number; method: 'gps' | 'qr' },
) {
  const { data } = await instance.post(
    `/mobile/rounds/${roundId}/checkpoints/${cpId}/log`,
    body,
  );
  return data;
}

export async function fetchActiveRound() {
  const { data } = await instance.get<ActiveRoundResponse>(
    '/mobile/rounds/active',
  );
  return data;
}

export async function startRound(roundId: number) {
  const { data } = await instance.post<StartRoundResponse>(
    `/mobile/rounds/${roundId}/start`,
  );
  return data;
}
