import { Prisma, PrismaClient } from '@prisma/client';

import { SearchProductRequest } from '../models/req';

const prisma = new PrismaClient({
  log: ['query', 'info'],
});
class BsProductApi {
  async searchProducts(sr: SearchProductRequest) {
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
          take: sr.maxDeadProductHistoryEntries,
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
    console.log(JSON.stringify(res));
  }
}

const api = new BsProductApi();
api.searchProducts({ category: ['Öl & Cider'], includeDead: false });

export default BsProductApi;
