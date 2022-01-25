import { ProductHistoryEntry } from './index';

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
}

type BaseSearchProductRequest = BaseProductRequest & {
  maxItems?: number;
  offset?: number;
  sortOrder?: {
    key: keyof Omit<ProductHistoryEntry, 'markedAsDead', 'markedAsDeadDate'>;
    order: 'asc' | 'desc';
  };
}

export type FullSearchProductRequest = BaseSearchProductRequest & {
  includeMarkedAsDead?: boolean;
  retrievedDate?: {
    start?: Date;
    end?: Date;
  };
};

export type ToplistSearchProductRequest = BaseSearchProductRequest;