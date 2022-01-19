import type { ProductResponse, ProductReviewResponse } from './res';

export type DatabaseProductResponse = Omit<
  ProductResponse,
  'retrievedDate' | 'markedAsDeadDate' | 'markedAsDead'
> & {
  // ISO timestamp
  retreivedTimestamp: number;
  markedAsDeadTimestamp?: number;
};

export type DatabaseProductReviewResponse = Omit<ProductReviewResponse, 'createdDate'> & {
  createdTimestamp: number;
};
