import type { ProductHistoryEntryResponse, ProductReviewResponse } from './res';

export type DatabaseProductHistoryEntry = Omit<
  ProductHistoryEntryResponse,
  'retrievedDate' | 'markedAsDeadDate' | 'markedAsDead'
> & {
  // ISO timestamp
  retrievedTimestamp: number;
  markedAsDeadTimestamp?: number;
};

export type DatabaseProductReviewResponse = Omit<ProductReviewResponse, 'createdDate'> & {
  createdTimestamp: number;
};
