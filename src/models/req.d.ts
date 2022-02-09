import { ProductHistoryEntry } from './index';

/**
 * Changes to these types _must_ be done along with appropriate changes
 * to the validation schemas!
 */

type BaseProductRequest = {
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
};

type SearchProductRequest = BaseProductRequest & {
  maxItems?: number;
  offset?: number;
  sortOrder?: {
    key: keyof Omit<ProductHistoryEntry, 'markedAsDead', 'markedAsDeadDate'>;
    order: 'asc' | 'desc';
  };
  includeDead: boolean;
};