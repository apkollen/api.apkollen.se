/**
 * Type defining a history entry of a bordershop product. May contain additional
 * data not found by `bsscraper`.
 * `currentRank` is only provided in the context where it is certain that this
 * is the latest entry and it is live (i.e. not dead)
 *
 * _Changes to this type must be accompanied to changes with the `sortOrder`
 * validation in the validation schemas_
 */
export type ProductHistoryEntry = {
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  unitVolume: number;
  unitPrice: number;
  alcvol: number;
  apk: number;
  articleNbr: number;
  retrievedDate: Date;
  markedAsDead: boolean;
  markedAsDeadDate?: Date;

  // Current ranking of all BorderShop products. Only
  // valid if this is the latest history entry.
  currentRank?: number;
  review: ProductReview | null;
};

export type ProductReview = {
  score: number;
  text: string;
  reviewerName: string;
  createdDate: Date;
};
