/**
 * _Changes to these types must be accompanied to changes with the `sortOrder`
 * validation in the validation schemas_
 */

/**
 * Type representing data for a product at BorderShop.
 * The data is always current, to stay searchable over time.
 */
export type Product = {
  articleNbr: number;
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  currentRank?: number;
  review?: ProductReview;
};

/**
 * Type defining a price history entry of a bordershop product.
 */
export type ProductHistoryEntry = {
  unitVolume: number;
  unitPrice: number;
  alcvol: number;
  apk: number;
  retrievedDate: Date;
};

export type ProductReview = {
  score: number;
  text: string;
  reviewerName: string;
  createdDate: Date;
};

export type DeadProductHistoryEntry = {
  markedDeadDate: Date;
  markedRevivedDate: Date | null;
}