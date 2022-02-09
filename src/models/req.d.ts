/**
 * Changes to these types _must_ be done along with appropriate changes
 * to the validation schemas!
 */

interface MinMaxRange {
  min?: number;
  max?: number;
}

export type SearchProductRequest = {
  productName?: string;
  category?: string[];
  subcategory?: string[];
  unitVolume?: MinMaxRange;
  unitPrice?: MinMaxRange;
  alcvol?: MinMaxRange;
  apk?: MinMaxRange;
  articleNbr?: number[];

  maxItems?: number;
  offset?: number;
  sortOrder?: {
    key:
      | 'productName'
      | 'category'
      | 'subcategory'
      | 'unitVolume'
      | 'unitPrice'
      | 'alcvol'
      | 'apk'
      | 'articleNbr';
    order: 'asc' | 'desc';
  };
  includeDead: boolean;
  maxProductHistoryEntries?: number;
  maxDeadProductHistoryEntries?: number;
};
