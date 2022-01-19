export type ProductResponse = {
  name: string;
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
};

export type ProductReviewResponse = {
  score: number;
  text: string;
  reviewerName: string;
  createdDate: Date;
};
