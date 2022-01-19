export type ProductHistoryEntryResponse = {
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  unitVolume: number;
  unitPrice: number;
  alcvol: number;
  apk: number;
  articleNbr: number;
  rank: number;
  retrievedDate: Date;
  markedAsDead: boolean;
  markedAsDeadDate?: Date;
  reviewScore?: number;
};

export type ProductReviewResponse = {
  score: number;
  text: string;
  reviewerName: string;
  createdDate: Date;
};
