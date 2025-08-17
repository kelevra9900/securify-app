// hooks/useCurrentUser.ts
import {useQuery,type UseQueryOptions} from '@tanstack/react-query';
import {getCurrentUser} from '@/data/services/user';
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

