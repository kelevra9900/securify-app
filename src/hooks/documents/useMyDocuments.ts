// src/hooks/useInfiniteMyDocuments.ts
import {
	type InfiniteData,
	useInfiniteQuery,
	type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import type {
	ApiError,
	DocumentsListResponse,
	GetMyDocumentsParams,
} from '@/types/documents';
import {getMyDocuments} from '@/data/services/files';

// Tipo de queryKey
type MyDocsKey<P extends Omit<GetMyDocumentsParams,'page'>> =
	readonly ['my_documents',P];

export function useInfiniteMyDocuments<P extends Omit<GetMyDocumentsParams,'page'>>(
	baseParams: P,
	options?: Omit<
		UseInfiniteQueryOptions<
			DocumentsListResponse,                // TQueryFnData (una página)
			ApiError,                             // TError
			InfiniteData<DocumentsListResponse>,  // TData final
			MyDocsKey<P>,                         // TQueryKey
			number                                // TPageParam
		>,
		'getNextPageParam' | 'initialPageParam' | 'queryFn' | 'queryKey'
	>
) {
	const queryKey = ['my_documents',baseParams] as const satisfies MyDocsKey<P>;

	return useInfiniteQuery<
		DocumentsListResponse,
		ApiError,
		InfiniteData<DocumentsListResponse>,
		MyDocsKey<P>,
		number
	>({
		getNextPageParam: (lastPage) =>
			lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
		initialPageParam: 1,
		queryFn: ({pageParam}) =>
			getMyDocuments({...baseParams,page: pageParam}),
		queryKey,
		...options,
	});
}
