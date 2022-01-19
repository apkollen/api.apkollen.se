export type DatabaseProduct = {
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  unitVolume: number;
  unitPrice: number;
  alcvol: number;
  apk: number;
  articleNbr: number;

  // ISO timestamp
  retreivedDate: number;
};