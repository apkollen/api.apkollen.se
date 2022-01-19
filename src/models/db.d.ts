export type DatabaseProductResponse = {
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  unitVolume: number;
  unitPrice: number;
  alcvol: number;
  apk: number;
  articleNbr: number;
  rank: number,

  // ISO timestamp
  retreivedTimestamp: number;
  markedAsDeadTimestamp?: number;
  reviewScore?: number,
};