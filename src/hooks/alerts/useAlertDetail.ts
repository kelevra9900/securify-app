import {useQuery} from '@tanstack/react-query';

import {fetchAlertDetail} from '@/data/services/alerts';

export function useAlertDetail(id?: number) {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchAlertDetail(id as number),
    queryKey: ['alerts','detail',id],
    staleTime: 30_000,
  });
}
