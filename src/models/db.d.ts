import type { Product, ProductHistoryEntry, ProductReview, DeadProductHistoryEntry } from './index';

export type DbProduct = Omit<Product, 'review' | 'history'> & {
  currentRank: number;

  // From ProductReview
  score?: number;
  text?: string;
  reviewerName?: string;
  createdTimestamp?: number;
};

export type DbProductHistoryEntry = Omit<ProductHistoryEntry, 'retrievedDate'> & {
  articleNbr: number;

  // ISO timestamp
  retrievedTimestamp: number;
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
};
