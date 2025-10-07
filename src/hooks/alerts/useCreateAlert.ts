// src/hooks/alerts/useCreateAlert.ts
import type {CreateAlertInput} from '@/data/services/alerts';

import {useMutation,useQueryClient} from '@tanstack/react-query';

import {createAlertApi} from '@/data/services/alerts';

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAlertInput) => createAlertApi(payload),
    onSuccess: () => qc.invalidateQueries({queryKey: ['alerts']}),
  });
}
