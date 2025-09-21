export type NotificationDTO = {
  body: null | string;
  createdAt: string; // ISO
  data: unknown;
  id: number;
  readAt: null | string; // ISO o null
  title: null | string;
  type: null | string; // p.ej. 'ALERT' | 'SYSTEM' | ...
  user: {
    firstName: null | string;
    id: number;
    image: null | string;
    lastName: null | string;
  } | null;
};
