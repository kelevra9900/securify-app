// src/hooks/notifications/useNotifications.ts
import type {
  ListNotificationsParams,
  NotificationItem,
  Paginated,
} from '@/data/services/notifications';
import type { NotificationDTO } from '@/types/notification';
import type { Page } from '@/types/pagination';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { QK } from '@/hooks/queryKeys';

import { getNotifications } from '@/data/services/notifications';

// ⬇️ IMPORTA tus services reales
// TODO: reemplaza estos imports/funciones por los de tu capa de servicios
// Deben cumplir las firmas usadas aquí.
const svc = {
  getOne: (id: number) => Promise.resolve({} as NotificationDTO),
  markRead: (id: number) => Promise.resolve({} as NotificationDTO),
  unreadCount: () => Promise.resolve({ count: 0 } as { count: number }),
};

export const notificationsKeys = {
  all: ['notifications'] as const,
  detail: (id: number) => [...notificationsKeys.all, 'detail', id] as const,
  list: (p: { limit?: number; type?: string; unreadOnly?: boolean }) =>
    [...notificationsKeys.all, 'list', p] as const,
  unreadCount: () => [...notificationsKeys.all, 'unreadCount'] as const,
};

export function useNotificationsInfinite(params?: ListNotificationsParams) {
  const base = {
    limit: params?.limit ?? 20,
    type: params?.type,
    unreadOnly: params?.unreadOnly,
  };

  return useInfiniteQuery<Paginated<NotificationItem>, Error>({
    gcTime: 5 * 60_000,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialPageParam: undefined as number | undefined, // ✅ requerido por v5
    queryFn: async ({ pageParam }) =>
      getNotifications({
        ...base,
        cursor: pageParam as number | undefined,
      }),
    queryKey: notificationsKeys.list(base),
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryFn: svc.unreadCount,
    queryKey: QK.unreadCount,
    refetchInterval: 30_000, // opcional
    refetchOnWindowFocus: true,
  });
}

export function useNotificationDetail(id?: number) {
  return useQuery({
    enabled: !!id,
    queryFn: () => svc.getOne(id!),
    queryKey: id ? QK.notification(id) : ['notifications', 'detail', 'nil'],
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.markRead(id),
    onSuccess: (updated) => {
      // 1) Invalida contador
      qc.invalidateQueries({ queryKey: QK.unreadCount });

      // 2) Actualiza en cache de listas infinita (marcar readAt)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      qc.setQueriesData({ queryKey: ['notifications'] }, (old: any) => {
        if (!old?.pages) {
          return old;
        }
        const pages = old.pages.map((p: Page<NotificationDTO>) => ({
          ...p,
          items: p.items.map((n) =>
            n.id === updated.id
              ? { ...n, readAt: updated.readAt ?? new Date().toISOString() }
              : n,
          ),
        }));
        return { ...old, pages };
      });

      // 3) Actualiza detalle si está en cache
      qc.setQueryData(QK.notification(updated.id), updated);
    },
  });
}
