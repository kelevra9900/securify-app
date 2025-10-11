import type {
  AnnouncementDetailResponse,
  AnnouncementListItem,
} from '@/types/announcements';

import {mapAnnouncementDetail} from '@/types/announcements';

import {instance} from '../instance';
import type {Page} from './attendances';
import type {PageParams} from '@/types/pagination';

export async function fetchAnnouncement(id: number) {
  const {data} = await instance.get<AnnouncementDetailResponse>(
    `/mobile/announcements/${id}`,
  );
  return mapAnnouncementDetail(data.data);
}

// --- Fetcher alineado con tu API ---
export async function fetchAnnouncements(
  {cursor,limit}: PageParams = {},
) {
  const queryParams = {
    ...(typeof cursor === 'number' ? {cursor} : {}),
    limit: limit ?? 20,
  };

  const {data} = await instance.get<Page<AnnouncementListItem>>(
    '/mobile/announcements',
    {params: queryParams},
  );

  return data;
}
