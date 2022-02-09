import { PrismaClient } from '@prisma/client';

import { SearchProductRequest } from '../models/req';

const prisma = new PrismaClient();
class BsProductApi {
  async searchProducts(sr: SearchProductRequest) {
    const res = await prisma.bsProduct.findMany({
      where: {
        OR: [
          { category: 'Öl & Cider' },
        ]
      },
      include: {
        history: {
          select: {
            apk: true,
            retrievedDate: true,
          }
        },
      },
      orderBy: {
        latestHistoryEntry: {
          apk: 'asc'
        }
      }
    });
    console.log(JSON.stringify(res));
  }
}

const api = new BsProductApi();
api.searchProducts({ category: ['hello'], includeDead: false });

export default BsProductApi;
