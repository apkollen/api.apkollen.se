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
 * _Changes to these types must be accompanied to changes with the `sortOrder`
 * validation in the validation schemas_
 */

/**
 * Type representing data for a product at BorderShop.
 * The data is always current, to stay searchable over time.
 */
export type Product = {
  articleNbr: number;
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  currentRank?: number;
  review?: ProductReview;
};

/**
 * Type defining a price history entry of a bordershop product.
 */
export type ProductHistoryEntry = {
  unitVolume: number;
  unitPrice: number;
  alcvol: number;
  apk: number;
  retrievedDate: Date;
};

export type ProductReview = {
  score: number;
  text: string;
  reviewerName: string;
  createdDate: Date;
};

export type DeadProductHistoryEntry = {
  markedDeadDate: Date;
  markedRevivedDate: Date | null;
}