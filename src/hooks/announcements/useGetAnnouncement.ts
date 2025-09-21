import { useQuery } from '@tanstack/react-query';

import { fetchAnnouncement } from '@/data/services/announcement';

export const useAnnouncement = (id?: number) =>
  useQuery({
    enabled: !!id,
    networkMode: 'always',
    queryFn: () => fetchAnnouncement(id as number),
    queryKey: ['announcements', 'detail', id],
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
