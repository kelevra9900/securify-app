import type { AnnouncementDetailResponse } from '@/types/announcements';

import { mapAnnouncementDetail } from '@/types/announcements';

import { instance } from '../instance';

export async function fetchAnnouncement(id: number) {
  const { data } = await instance.get<AnnouncementDetailResponse>(
    `/mobile/announcements/${id}`,
  );
  return mapAnnouncementDetail(data.data);
}
