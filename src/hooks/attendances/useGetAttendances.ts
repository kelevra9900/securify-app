import type {InfiniteData} from '@tanstack/react-query';
import type {AttendanceDTO} from '@/data/services/attendances';
import type {Page} from '@/types/pagination';

import {useInfiniteQuery} from '@tanstack/react-query';

import {getAttendances} from '@/data/services/attendances';
import type {Vars} from '@/types/global';

// Ajusta a tus tipos reales


export function useAttendancesInfinite(params?: Omit<Vars,'cursor'>) {
  return useInfiniteQuery<
    Page<AttendanceDTO>, // TData (cada página)
    Error, // TError
    InfiniteData<Page<AttendanceDTO>>, // TQueryFnData (lo que llega a `data`)
    readonly ['attendances',Omit<Vars,'cursor'> | undefined], // TQueryKey
    number | undefined // TPageParam
  >({
    initialPageParam: undefined,
    queryKey: ['attendances',params] as const,
    // Trae una página usando el cursor (pageParam)
    queryFn: async ({pageParam}) => {
      const cursor = typeof pageParam === 'number' ? pageParam : undefined;
      return getAttendances({
        cursor,
        from: params?.from,
        limit: params?.limit,
        to: params?.to,
      });
    },
    // Si hay más, devuelve el próximo cursor; si no, undefined
    getNextPageParam: (last) =>
      last.hasMore ? (last.nextCursor ?? undefined) : undefined,

    // Opcional
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}
