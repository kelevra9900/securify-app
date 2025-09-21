// src/hooks/rounds.ts
import type { RoundDetail } from '@/types/rounds';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  endRound,
  fetchActiveRound,
  getAvailableRounds,
  getRoundDetail,
  logCheckpoint,
  startRound,
} from '@/data/services/rounds';

export const useAvailableRounds = () =>
  useQuery({
    queryFn: getAvailableRounds,
    queryKey: ['rounds', 'available'],
    staleTime: 60_000,
  });

export const useRoundDetail = (roundId?: number) =>
  useQuery<RoundDetail>({
    enabled: !!roundId,
    networkMode: 'always',
    queryFn: () => getRoundDetail(roundId as number),
    queryKey: ['rounds', 'detail', roundId],
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

export const useActiveRound = () => {
  return useQuery({
    networkMode: 'always',
    queryFn: fetchActiveRound,
    queryKey: ['rounds', 'activeRound'],
  });
};

export const useStartRound = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roundId }: { roundId: number }) => startRound(roundId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds', 'available'] });
    },
  });
};

export const useEndRound = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ notes, roundId }: { notes?: string; roundId: number }) =>
      endRound(roundId, { notes }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['rounds', 'available'] });
      qc.invalidateQueries({ queryKey: ['rounds', vars.roundId] });
    },
  });
};

export const useLogCheckpoint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      cpId,
      roundId,
    }: {
      body: { code?: string; lat?: number; lon?: number; method: 'gps' | 'qr' };
      cpId: number;
      roundId: number;
    }) => logCheckpoint(roundId, cpId, body),
    onSuccess: (_d, { roundId }) => {
      qc.invalidateQueries({ queryKey: ['rounds', roundId] });
    },
  });
};
