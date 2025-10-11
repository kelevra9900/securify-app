/* eslint-disable @typescript-eslint/no-explicit-any */
// src/data/services/attendances.ts
import {instance} from '../instance';

/** === TIPOS (compártelos con el hook para evitar duplicados) === */
export type AttendanceDTO = {
  checkIn: null | string;
  checkOut: null | string;
  createdAt: string; // ISO
  id: number;
  location?: {lat: null | number; lng: null | number} | null;
  site?: any | null;
  status: string; // 'ON_SITE' | 'OFF_SITE' | ...
  user?: {
    firstName?: null | string;
    id: number;
    image?: null | string;
    lastName?: null | string;
  };
};

export type Page<T> = {
  hasMore: boolean;
  items: T[];
  nextCursor: null | number;
};

export type GlobalPaginationParams = {
  cursor?: number;
  from?: string; // ISO yyyy-mm-dd (opcional)
  limit?: number;
  to?: string; // ISO yyyy-mm-dd (opcional)
};

/** Lista paginada de asistencias (cursor-based, DESC por id) */
export async function getAttendances(
  params: GlobalPaginationParams = {},
): Promise<Page<AttendanceDTO>> {
  // Solo manda al backend los params definidos
  const query: Record<string,any> = {};
  if (params.cursor != null) {
    query.cursor = params.cursor;
  }
  if (params.limit != null) {
    query.limit = params.limit;
  }
  if (params.from) {
    query.from = params.from;
  }
  if (params.to) {
    query.to = params.to;
  }

  const {data} = await instance.get<Page<AttendanceDTO>>(
    'mobile/attendances',
    {params: query},
  );

  // Normalización suave (evita undefined inesperados)
  const items = (data.items ?? []).map((it) => ({
    checkIn: it.checkIn ?? null,
    checkOut: it.checkOut ?? null,
    createdAt: it.createdAt,
    id: it.id,
    location: it.location ?? null,
    site: it.site ?? null,
    status: it.status,
    user: it.user
      ? {
        firstName: it.user.firstName ?? null,
        id: it.user.id,
        image: it.user.image ?? null,
        lastName: it.user.lastName ?? null,
      }
      : undefined,
  }));

  return {
    hasMore: Boolean(data.hasMore),
    items,
    nextCursor: data.nextCursor ?? null,
  };
}

/** Detalle de una asistencia */
export async function getAttendanceDetail(id: number): Promise<AttendanceDTO> {
  const {data} = await instance.get<AttendanceDTO>(
    `mobile/attendances/${id}`,
  );
  // (Opcional) normaliza igual que arriba si lo necesitas
  return {
    checkIn: data.checkIn ?? null,
    checkOut: data.checkOut ?? null,
    createdAt: data.createdAt,
    id: data.id,
    location: data.location ?? null,
    site: data.site ?? null,
    status: data.status,
    user: data.user
      ? {
        firstName: data.user.firstName ?? null,
        id: data.user.id,
        image: data.user.image ?? null,
        lastName: data.user.lastName ?? null,
      }
      : undefined,
  };
}
