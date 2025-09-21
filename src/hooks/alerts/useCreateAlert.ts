// src/hooks/alerts/useCreateAlert.ts
import type { CreateAlertInput } from '@/data/services/alerts';
import type { RootState } from '@/store';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { createAlertApi } from '@/data/services/alerts';

export function useCreateAlert() {
  const token = useSelector((s: RootState) => s.auth.token);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAlertInput) => createAlertApi(payload, token!),
    onSuccess: () => {
      // refresca listados de alertas
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
