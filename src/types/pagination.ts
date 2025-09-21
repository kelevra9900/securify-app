export type Page<T> = {
  hasMore: boolean;
  items: T[];
  nextCursor: null | number;
};
