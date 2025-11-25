import type {Checkpoint} from '@/types/checkpoint';
import type {Vars} from '@/types/global';
import type {Page} from '@/types/pagination';

import {instance} from '../instance';

type GetCheckpointsResponse = {
  currentPage?: number;
  data: Checkpoint[];
  perPage?: number;
  success?: boolean;
  total?: number;
  totalPages?: number;
};

export async function getAllCheckpoint(
  params: Vars = {},
): Promise<Page<Checkpoint>> {
  const query: Record<string,number | string> = {};
  const requestedPage =
    typeof params.cursor === 'number'
      ? params.cursor
      : typeof params.page === 'string' && params.page.trim().length > 0
        ? Number(params.page)
        : undefined;

  if (typeof requestedPage === 'number' && !Number.isNaN(requestedPage)) {
    query.page = requestedPage;
  }

  if (typeof params.limit === 'number') {
    query.limit = params.limit;
  }

  if (typeof params.from === 'string' && params.from.length > 0) {
    query.from = params.from;
  }

  if (typeof params.to === 'string' && params.to.length > 0) {
    query.to = params.to;
  }

  const {data} = await instance.get<GetCheckpointsResponse>(
    '/checkpoint',
    {params: query},
  );

  const items: Checkpoint[] = Array.isArray(data.data) ? data.data : [];
  const currentPage =
    typeof data.currentPage === 'number'
      ? data.currentPage
      : typeof requestedPage === 'number' && !Number.isNaN(requestedPage)
        ? requestedPage
        : 1;
  const totalPages =
    typeof data.totalPages === 'number' ? data.totalPages : currentPage;

  const hasMore = currentPage < totalPages;
  const nextCursor = hasMore ? currentPage + 1 : null;

  return {
    hasMore,
    items,
    nextCursor,
  };
}
