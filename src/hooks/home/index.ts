// hooks/useHome.ts
import {useQuery} from '@tanstack/react-query';
import type {ApiError,HomeData,HomeQuery,HomeResponse} from '@/types/home';
import {getHome} from '@/data/services/home';

export function useGetHomeData(params?: HomeQuery) {
	return useQuery<HomeData,ApiError>({
		gcTime: 300_000,
		networkMode: 'always',
		queryFn: async () => {
			const res: HomeResponse = await getHome(params);
			if (res.success) {return res.data;}
			throw res.error;
		},
		queryKey: ['home',params ?? {}] as const,
		refetchOnMount: false,
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
		staleTime: 120_000,
	});
}
