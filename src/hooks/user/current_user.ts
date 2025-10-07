// hooks/useCurrentUser.ts
import {
	type InfiniteData,
	useInfiniteQuery,
	type UseInfiniteQueryOptions,
	useMutation,
	type UseMutationOptions,
	useQuery,
	useQueryClient,
	type UseQueryOptions,
} from '@tanstack/react-query';
import {getSectors,updateMySector} from '@/data/services/sector';
import {getCurrentUser} from '@/data/services/user';
import type {SectorPagination,SectorUpdated} from '@/types/sector';
import type {CurrentUserData} from '@/types/user';

type ApiError = {code: string; message: string; status: number;};

export function useGetCurrentUser(options?: Omit<UseQueryOptions<CurrentUserData,ApiError>,'queryFn' | 'queryKey'>) {
	return useQuery({
		gcTime: 300_000,
		networkMode: 'always',
		queryFn: async () => {
			const res = await getCurrentUser();
			if (res.ok) {return res.data;}
			throw res.error;
		},
		queryKey: ['current_user'] as const,
		refetchOnMount: false,
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
		staleTime: 120_000,
		...options,
	});
}

type SectorsKey = readonly ['my_sectors'];

export function useGetMySectors(
	options?: Omit<
		UseInfiniteQueryOptions<
			SectorPagination,
			ApiError,
			InfiniteData<SectorPagination>,
			SectorsKey,
			number
		>,
		'getNextPageParam' | 'initialPageParam' | 'queryFn' | 'queryKey'
	>,
) {
	const queryKey = ['my_sectors'] as const satisfies SectorsKey;

	return useInfiniteQuery<
		SectorPagination,
		ApiError,
		InfiniteData<SectorPagination>,
		SectorsKey,
		number
	>({
		getNextPageParam: (lastPage) =>
			lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
		initialPageParam: 1,
		queryFn: ({pageParam}) => getSectors({page: pageParam}),
		queryKey,
		...options,
	});
}

export function useUpdateMySector(
	options?: Omit<UseMutationOptions<SectorUpdated,ApiError,number>,'mutationFn'>,
) {
	const queryClient = useQueryClient();

	return useMutation<SectorUpdated,ApiError,number>({
		mutationFn: (sectorId) => updateMySector(sectorId),
		...options,
		onSuccess: (data,variables,onMutateResult,context) => {
			queryClient.invalidateQueries({queryKey: ['current_user']});
			options?.onSuccess?.(data,variables,onMutateResult,context);
		},
	});
}
