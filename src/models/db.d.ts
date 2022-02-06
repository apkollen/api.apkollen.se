import type { ProductHistoryEntry, ProductReview, DeadProductHistoryEntry } from './index';

export type DbProductHistoryEntry = Omit<
  ProductHistoryEntry,
  'retrievedDate' | 'markedAsDeadDate' | 'markedAsDead'
> & {
  // ISO timestamp
  retrievedTimestamp: number;

  currentRank?: number;

  // From ProductReview
  score?: number;
  text?: string;
  reviewerName?: string;
  createdTimestamp?: number;
};

export type DbProductReview = Omit<ProductReview, 'createdDate'> & {
  articleNbr: number;
  createdTimestamp: number;
};

export type DbDeadProductHistoryEntry = {
  articleNbr: number;
  markedDeadTimestamp: number;
  markedRevivedTimestamp: number | null;
};

export type DbProductCurrentRank = {
  articleNbr: number;
  currentRank: number;
}
