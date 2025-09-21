import type { InfiniteData } from '@tanstack/react-query';
import type { Page } from '@/types/pagination';

export const flattenInfinite = <T>(data?: InfiniteData<Page<T>>): T[] =>
  data?.pages.flatMap((p) => p.items) ?? [];

export function cleanParams<T extends Record<string, unknown>>(
  p: T,
): Partial<T> {
  const out: Partial<T> = {};
  Object.entries(p).forEach(([k, v]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (v !== undefined && v !== null) {
      (out as any)[k] = v;
    }
  });
  return out;
}
