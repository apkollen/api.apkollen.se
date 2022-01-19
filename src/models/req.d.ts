import type { DatabaseProduct } from './db';

export type ProductRequest = {
  name?: string[];
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
  articleNbr?: number;
  onlyNewest?: boolean
  retrievedDate?: {
    start?: Date;
    end?: Date;
  };
  markedAsDead?: boolean;
  sortOrder?: {
    key: keyof DatabaseProduct;
    order: 'asc' | 'desc';
  };
  maxItems: number;
  offset: number;
};

export type SubcategoryRequest = {
  category: string[];
};
