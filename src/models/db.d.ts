import type { ProductHistoryEntry, ProductReview } from './index';

export type DatabaseProductHistoryEntry = Omit<
  ProductHistoryEntry,
  'retrievedDate' | 'markedAsDeadDate' | 'markedAsDead'
> & {
  // ISO timestamp
  retrievedTimestamp: number;
  markedAsDeadTimestamp?: number;
};

export type DatabaseProductReview = Omit<ProductReview, 'createdDate'> & {
  articleNbr: number,
  createdTimestamp: number;
};
