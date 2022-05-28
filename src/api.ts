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
import { PrismaClient } from '@prisma/client';

import { SearchProductRequest } from './models/req';
import { FullHistoryResponse, SearchProductResponse } from './models/res';

const prisma = new PrismaClient();
class BsProductApi {
  /**
   * Searches for products matching the search
   * query, using the latest history entry for values
   * related to price.
   * @param sr
   */
  async searchProducts(sr: SearchProductRequest): Promise<SearchProductResponse[]> {
    // We start by making some dynamic fields

    let deathInclusion;
    if (sr.includeDead) {
      deathInclusion = {};
    } else {
      // None where marked revived date is null
      // date
      deathInclusion = {
        markedDeadHistory: {
          none: {
            markedRevivedDate: null,
          },
        },
      };
    }

    // Messy type to make TS happy
    let orderBy:
      | {
          [key: string]: string;
        }
      | {
          [key: string]: {
            [key: string]: string;
          };
        };
    if (sr.sortOrder?.key == null) {
      // Default sorting is apk for latest history entry
      orderBy = {
        latestHistoryEntry: {
          apk: 'desc',
        },
      };
    } else if (
      sr.sortOrder?.key === 'productName' ||
      sr.sortOrder?.key === 'category' ||
      sr.sortOrder?.key === 'subcategory' ||
      sr.sortOrder?.key === 'articleNbr'
    ) {
      // We order by static product info
      orderBy = {};
      orderBy[sr.sortOrder.key] = sr.sortOrder.order;
    } else {
      // We order by latest history entry
      // Default sorting is apk for latest history entry
      orderBy = {
        latestHistoryEntry: {},
      };
      orderBy.latestHistoryEntry[sr.sortOrder.key] = sr.sortOrder.order;
    }

    // undefined values are ignored when query is created,
    // neat AF!
    const res = await prisma.bsProduct.findMany({
      orderBy: { ...orderBy },
      take: sr.maxItems,
      skip: sr.offset,
      where: {
        ...deathInclusion,
        productName: { contains: sr.productName },
        category: { in: sr.category },
        subcategory: { in: sr.subcategory },
        latestHistoryEntry: {
          unitVolume: {
            gte: sr.unitVolume?.min,
            lte: sr.unitVolume?.max,
          },
          unitPrice: {
            gte: sr.unitPrice?.min,
            lte: sr.unitPrice?.max,
          },
          alcvol: {
            gte: sr.alcvol?.min,
            lte: sr.alcvol?.max,
          },
          apk: {
            gte: sr.apk?.min,
            lte: sr.apk?.max,
          },
          articleNbr: { in: sr.articleNbr },
        },
      },
      include: {
        latestHistoryEntry: false, // Would be duplicate
        currentRank: {
          select: {
            currentRank: true,
            articleNbr: false,
          },
        },
        history: {
          select: {
            unitVolume: true,
            unitPrice: true,
            alcvol: true,
            apk: true,
            articleNbr: false, // We don't want duplicate information
            retrievedDate: true,
          },
          take: sr.maxProductHistoryEntries,
          orderBy: {
            retrievedDate: 'desc',
          },
        },
        markedDeadHistory: {
          select: {
            articleNbr: false, // No duplicate
            markedDeadDate: true,
            markedRevivedDate: true,
          },
          take: sr.maxDeadProductHistoryEntries,
          orderBy: {
            markedDeadDate: 'desc',
          },
        },
      },
    });

    // Ensure currentRank is only number, not double object
    const reducedRes = res.map((p) => {
      const { currentRank, ...reduced } = p;
      return {
        ...reduced,
        currentRank: currentRank?.currentRank,
      };
    });

    return reducedRes;
  }

  /**
   * Find full APK history, and when product was marked dead
   * @param articleNbr
   */
  async getFullHistory(articleNbr: number): Promise<FullHistoryResponse> {
    const [history, markedDeadHistory] = await Promise.all([
      prisma.bsProductHistoryEntry.findMany({
        select: {
          unitVolume: true,
          unitPrice: true,
          alcvol: true,
          apk: true,
          articleNbr: false, // We don't want duplicate information
          retrievedDate: true,
        },
        where: {
          articleNbr,
        },
        orderBy: {
          retrievedDate: 'desc',
        },
      }),
      prisma.deadBsProductHistoryEntry.findMany({
        select: {
          articleNbr: false, // No duplicate
          markedDeadDate: true,
          markedRevivedDate: true,
        },
        where: {
          articleNbr,
        },
        orderBy: {
          markedDeadDate: 'desc',
        },
      }),
    ]);

    return { history, markedDeadHistory };
  }

  /**
   * Returns count of products, either including
   * those currently marked as dead or not
   * @param includeDead If products currently marked as dead should be
   * included or not
   */
  async getProductCount(includeDead: boolean): Promise<number> {
    if (includeDead) {
      return prisma.bsProduct.count();
    } else {
      return prisma.bsProduct.count({
        where: {
          markedDeadHistory: {
            none: {
              markedRevivedDate: null,
            },
          },
        },
      });
    }
  }

  /**
   * Finds all categories and subcategories ever used by a product
   * in the DB, using categories as keys for lists of subcategories
   */
  async getAllCategories(): Promise<Record<string, string[]>> {
    const res = await prisma.bsProduct.findMany({
      select: {
        category: true,
        subcategory: true,
      },
      distinct: ['subcategory'],
    });

    // Reduce result
    return res.reduce((acc, row) => {
      // If category not in record, create the key
      if (!acc[row.category]) {
        acc[row.category] = [];
      }

      acc[row.category].push(row.subcategory);

      return acc;
    }, {} as Record<string, string[]>);
  }
}

export default BsProductApi;
