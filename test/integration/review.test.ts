import request = require('supertest');

import app from '../../src/app';
import db from '../../src/db';
import { ProductReview } from '../../src/models';

const BASE_ROUTE = '/bs/products/review';

const KNOWN_REVIEWS: { articleNbr: number; review: ProductReview | null }[] = [
  {
    articleNbr: 2033433, // Bear Beer
    review: null,
  },
  {
    articleNbr: 2110205, // Viiking 12,0
    review: {
      score: 4.5,
      text: 'Helt enkelt bäst.\nSmaken är som baken, smakar mest skit.',
      reviewerName: 'Emil',
      createdDate: new Date('2022-01-19 21:59:07'),
    },
  },
  {
    articleNbr: 2043913, // Miintu
    review: null,
  },
];

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('getting product review', () => {
  const r = request(app);

  /**
   * Converts all instances of ISO string
   * in response body to actual `Date`
   * @param resBody
   */
  const convertResDateString = (resBody: Record<number, ProductReview | null>) => {
    if (resBody == null) return;
    (Object.keys(resBody) as unknown as Array<number>).forEach((k) => {
      const rec = resBody[k];
      if (rec != null) {
        if (rec.createdDate != null) {
          rec.createdDate = new Date(rec.createdDate);
        }
      }
    });
  };

  it('fails with 400 without articleNbrs', async () => {
    await r.post(BASE_ROUTE).send({}).expect(400);
  });

  it('returns null for unknown articleNbrs, but known articleNbr still returns OK review', async () => {
    const res = await r.post(BASE_ROUTE).send({ articleNbrs: [666, KNOWN_REVIEWS[1].articleNbr] });

    const resBody = res.body as Record<number, ProductReview | null>;

    convertResDateString(resBody);

    expect(res.statusCode).toEqual(200);
    expect(resBody[666]).toBeNull();
    expect(resBody[KNOWN_REVIEWS[1].articleNbr]).toEqual(KNOWN_REVIEWS[1].review);
  });

  it('returns correct review for single product', async () => {
    const res = await r.post(BASE_ROUTE).send({ articleNbrs: [KNOWN_REVIEWS[1].articleNbr] });

    const resBody = res.body as Record<number, ProductReview | null>;

    convertResDateString(resBody);

    expect(res.statusCode).toEqual(200);
    expect(resBody[KNOWN_REVIEWS[1].articleNbr]).toEqual(KNOWN_REVIEWS[1].review);
  });

  it('returns correct review for multiple products', async () => {
    const res = await r
      .post(BASE_ROUTE)
      .send({ articleNbrs: KNOWN_REVIEWS.map((a) => a.articleNbr) });

    const resBody = res.body as Record<number, ProductReview | null>;

    convertResDateString(resBody);

    expect(res.statusCode).toEqual(200);
    KNOWN_REVIEWS.forEach((a) => {
      expect(resBody[a.articleNbr]).toEqual(a.review);
    });
  });
});
