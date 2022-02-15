/**
 * These are generally inferred by Refactor in VSCode
 */

export type SearchProductResponse = {
  currentRank: number | undefined;
  articleNbr: number;
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  markedDeadHistory: { markedDeadDate: Date; markedRevivedDate: Date | null }[];
  history: {
    apk: number;
    unitVolume: number;
    unitPrice: number;
    alcvol: number;
    retrievedDate: Date;
  }[];
};

export type FullHistoryResponse = {
  history: {
    unitVolume: number;
    unitPrice: number;
    alcvol: number;
    apk: number;
    retrievedDate: Date;
  }[];
  markedDeadHistory: { markedDeadDate: Date; markedRevivedDate: Date | null }[];
};
