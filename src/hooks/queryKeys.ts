// src/hooks/queryKeys.ts
export const QK = {
  attendance: (id: number) => ['attendances', 'detail', id] as const,
  attendances: (f?: { from?: string; limit?: number; to?: string }) =>
    ['attendances', f ?? {}] as const,
  notification: (id: number) => ['notifications', 'detail', id] as const,

  notifications: (f?: {
    limit?: number;
    type?: string;
    unreadOnly?: boolean;
  }) => ['notifications', f ?? {}] as const,
  unreadCount: ['notifications', 'unread', 'count'] as const,
};
