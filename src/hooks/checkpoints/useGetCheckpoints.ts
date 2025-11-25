import {getAllCheckpoint} from "@/data/services/checkpoints";
import type {Checkpoint} from "@/types/checkpoint";
import type {Vars} from "@/types/global";
import type {Page} from "@/types/pagination";
import type {InfiniteData} from "@tanstack/react-query";
import {useInfiniteQuery} from "@tanstack/react-query";


export function useGetCheckpoints(params?: Omit<Vars,'cursor'>) {
	return useInfiniteQuery<
		Page<Checkpoint>, // TData (cada página)
		Error, // TError
		InfiniteData<Page<Checkpoint>>, // TQueryFnData (lo que llega a `data`)
		readonly ['checkpoints',Omit<Vars,'cursor'> | undefined], // TQueryKey
		number | undefined // TPageParam
	>({
		initialPageParam: undefined,
		queryKey: ['checkpoints',params] as const,
		// Aplica correctamente la petición
		queryFn: async ({pageParam}) => {
			const cursor = typeof pageParam === 'number' ? pageParam : undefined;
			return getAllCheckpoint({
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