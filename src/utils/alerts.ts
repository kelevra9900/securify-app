// src/utils/alerts.ts
import type { ApiRecentAlert } from '@/hooks/alerts/useSummaryReports';

type CardSummary = {
  open: number;
  rejected: number;
  resolved: number;
  total: number;
};

export function mapCountersToCard(c: {
  created: number;
  rejected: number;
  resolved: number;
}): CardSummary {
  const total = (c?.created ?? 0) + (c?.resolved ?? 0) + (c?.rejected ?? 0);
  return {
    open: c?.created ?? 0, // "CREATED" = abierto
    rejected: c?.rejected ?? 0, // "REJECTED"
    resolved: c?.resolved ?? 0, // "SOLVED"
    total,
  };
}

type ListCardItem = {
  date: string;
  id: string;
  image?: null | string;
  status: 'pending' | 'rejected' | 'resolved';
  title: string;
};

const statusMap: Record<ApiRecentAlert['status'], ListCardItem['status']> = {
  CREATED: 'pending',
  REJECTED: 'rejected',
  SOLVED: 'resolved',
};

export function formatShortDate(iso: string, locale = 'es-MX'): string {
  // Ej: "25 ago, 12:30 p. m."
  const d = new Date(iso);
  const dd = d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
  const tt = d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dd}, ${tt}`;
}

export function mapRecentToCardItems(
  recent: ApiRecentAlert[],
  locale?: string,
): ListCardItem[] {
  return (recent ?? []).map((r) => ({
    date: formatShortDate(r.createdAt, locale),
    id: String(r.id),
    image: r.image ?? undefined,
    status: statusMap[r.status],
    title: r.title,
  }));
}
