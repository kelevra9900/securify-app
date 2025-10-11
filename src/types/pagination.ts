export type Page<T> = {
  hasMore: boolean;
  items: T[];
  nextCursor: number | null;
};

export type PageParams = {
  cursor?: number;
  limit?: number;
};
