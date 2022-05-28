/**
 * Copyright 2022 Emil Jonathan Eriksson
 *
 *
 * This file is part of apkapi-ts.
 *
 * apkapi-ts is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, version 3.
 *
 * apkapi-ts is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with apkapi-ts.
 * If not, see <https://www.gnu.org/licenses/>.
 */

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
