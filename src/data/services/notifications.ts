// src/data/services/notifications.ts
import { cleanParams } from '@/utils/query';

import { instance } from '../instance';

/* ===== Tipos (ajústalos a tu payload real si lo tienes) ===== */

export type NotificationType = string; // p.ej. 'ALERT' | 'ATTENDANCE' | 'SYSTEM' | ...
export type NotificationItem = {
  body?: null | string;
  createdAt: string; // ISO
  id: number;
  read: boolean;
  title: string;
  type: NotificationType;
  // agrega campos si tu API los expone: metadata, image, deeplink, etc.
};

export type Paginated<T> = {
  hasMore: boolean;
  items: T[];
  nextCursor: null | number;
};

export type UnreadCountResponse = { count: number };

export type ListNotificationsParams = {
  cursor?: number;
  limit?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
};

/* ===== Services ===== */

export async function getNotifications(
  p: ListNotificationsParams = {},
): Promise<Paginated<NotificationItem>> {
  const params = cleanParams({
    cursor: p.cursor,
    limit: p.limit ?? 20,
    type: p.type,
    unreadOnly: p.unreadOnly,
  });

  const { data } = await instance.get<Paginated<NotificationItem>>(
    '/mobile/notifications',
    { params },
  );
  return data;
}

export async function getNotificationDetail(
  id: number,
): Promise<NotificationItem> {
  const { data } = await instance.get<NotificationItem>(
    `/mobile/notifications/${id}`,
  );
  return data;
}

export async function countNotificationsUnread(): Promise<UnreadCountResponse> {
  const { data } = await instance.get<UnreadCountResponse>(
    '/mobile/notifications/unread/count',
  );
  return data;
}

export async function readNotification(
  id: number,
): Promise<{ ok: true } | NotificationItem> {
  // Algunas APIs devuelven el recurso actualizado; otras solo { ok: true }.
  const { data } = await instance.patch(`/mobile/notifications/${id}/read`);
  return data;
}

export async function readAllNotifications(): Promise<{ ok: true }> {
  const { data } = await instance.patch('/mobile/notifications/read/all');
  return data;
}
