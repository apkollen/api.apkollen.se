export type SortableProductRequestKey = keyof Omit<ProductRequest, 'onlyNewest' | 'includeMarkedAsDead' | 'sortOrder' | 'maxItems' | 'offset'>

export type SearchProductsRequest = {
  productName?: string[];
  category?: string[];
  subcategory?: string[];
  unitVolume?: {
    min?: number;
    max?: number;
  };
  unitPrice?: {
    min?: number;
    max?: number;
  };
  alcvol?: {
    min?: number;
    max?: number;
  };
  apk?: {
    min?: number;
    max?: number;
  };
  articleNbr?: number[];
  onlyNewest?: boolean;
  retrievedDate?: {
    start?: Date;
    end?: Date;
  };
  includeMarkedAsDead?: boolean;
  sortOrder?: {
    key: SortableProductRequestKey;
    order: 'asc' | 'desc';
  };
  maxItems?: number;
  offset?: number;
};