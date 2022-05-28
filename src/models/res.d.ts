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
 * These are generally inferred by Refactor in VSCode
 */

export type SearchProductResponse = {
  currentRank: number | undefined;
  articleNbr: number;
  url: string;
  productName: string;
  category: string;
  subcategory: string;
  latestHistoryEntryDate: Date | null;
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
