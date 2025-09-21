/* eslint-disable @typescript-eslint/no-explicit-any */
// src/api/types/announcements.ts

/** Envoltorio estándar de la API */
export type ApiEnvelope<T> = {
  data: T;
  ok: true;
  serverTimeISO: string; // ISO UTC desde el servidor
};

/* ───────────────────────────── Detalle ───────────────────────────── */

/** Shape “crudo” que viene del backend (snake/camel mixto) */
export type AnnouncementDetailServer = {
  author?: { id: number; name: string } | null;
  content: string;
  createdAt: string; // ISO
  environmentName?: null | string;
  id: number;
  image?: null | string;
  is_approved?: boolean | null;
  title: string;
  updatedAt: string; // ISO
};

/** Shape listo para UI (camelCase) */
export type AnnouncementDetail = {
  author?: { id: number; name: string } | null;
  content: string;
  createdAtISO: string;
  environmentName?: null | string;
  id: number;
  image?: null | string;
  isApproved: boolean;
  title: string;
  updatedAtISO: string;
};

export type AnnouncementDetailResponse = ApiEnvelope<AnnouncementDetailServer>;

/* ───────────────────────────── Lista (paginada) ───────────────────────────── */

export type PageMeta = {
  hasNext: boolean;
  hasPrev: boolean;
  page: number;
  pageSize: number;
  total: number;
};

/** Item de lista (puedes ajustarlo a lo que devuelva tu endpoint de listado) */
export type AnnouncementListItemServer = {
  createdAt: string; // ISO
  environmentName?: null | string;
  excerpt?: null | string; // opcional si tu API lo expone
  id: number;
  image?: null | string;
  is_approved?: boolean | null;
  title: string;
};

export type AnnouncementListItem = {
  createdAtISO: string;
  environmentName?: null | string;
  excerpt?: null | string;
  id: number;
  image?: null | string;
  isApproved: boolean;
  title: string;
};

export type AnnouncementListResponse = ApiEnvelope<{
  items: AnnouncementListItemServer[];
  meta: PageMeta;
}>;

/* ───────────────────────────── Type guards (opcionales) ───────────────────────────── */

export function isAnnouncementDetailResponse(
  x: unknown,
): x is AnnouncementDetailResponse {
  if (!x || typeof x !== 'object') {
    return false;
  }
  const r = x as any;
  return (
    r.ok === true &&
    typeof r.serverTimeISO === 'string' &&
    typeof r.data?.id === 'number'
  );
}

export function isAnnouncementListResponse(
  x: unknown,
): x is AnnouncementListResponse {
  if (!x || typeof x !== 'object') {
    return false;
  }
  const r = x as any;
  return (
    r.ok === true &&
    typeof r.serverTimeISO === 'string' &&
    Array.isArray(r.data?.items) &&
    typeof r.data?.meta?.page === 'number'
  );
}

/* ───────────────────────────── Mappers a camelCase ───────────────────────────── */

export function mapAnnouncementDetail(
  s: AnnouncementDetailServer,
): AnnouncementDetail {
  return {
    author: s.author ?? null,
    content: s.content,
    createdAtISO: s.createdAt,
    environmentName: s.environmentName ?? null,
    id: s.id,
    image: s.image ?? null,
    isApproved: Boolean(s.is_approved),
    title: s.title,
    updatedAtISO: s.updatedAt,
  };
}

export function mapAnnouncementListItem(
  s: AnnouncementListItemServer,
): AnnouncementListItem {
  return {
    createdAtISO: s.createdAt,
    environmentName: s.environmentName ?? null,
    excerpt: s.excerpt ?? null,
    id: s.id,
    image: s.image ?? null,
    isApproved: Boolean(s.is_approved),
    title: s.title,
  };
}
