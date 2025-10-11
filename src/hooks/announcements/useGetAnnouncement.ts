import type {
  AnnouncementListItem,
} from '@/types/announcements';
import type {Page} from '@/types/pagination';

import type {InfiniteData} from '@tanstack/react-query';
import {useInfiniteQuery,useQuery} from '@tanstack/react-query';

import {
  fetchAnnouncement,
  fetchAnnouncements,
} from '@/data/services/announcement';

export const useAnnouncement = (id?: number) =>
  useQuery({
    enabled: !!id,
    networkMode: 'always',
    queryFn: () => fetchAnnouncement(id as number),
    queryKey: ['announcements','detail',id],
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });



type UseAnnouncementsOptions = {
  limit?: number;
};

export function useAnnouncements(options: UseAnnouncementsOptions = {}) {
  const limit = options.limit ?? 20;

  return useInfiniteQuery<
    Page<AnnouncementListItem>, // TData (cada página)
    Error, // TError
    InfiniteData<Page<AnnouncementListItem>>, // TQueryFnData (lo que llega a `data`)
    readonly ['announcements',number], // TQueryKey
    number | undefined // TPageParam
  >({
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined,
    queryFn: async ({pageParam}) => {
      return fetchAnnouncements({cursor: pageParam,limit});
    },
    queryKey: ['announcements',limit],
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}
