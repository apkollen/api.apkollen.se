import request = require('supertest');
import app from '../../src/app';
import db from '../../src/db';

const BASE_ROUTE = '/bs/subcategories';

const KNOWN_SUBCATS = [
  {
    category: 'Öl & Cider',
    subcategories: ['Dansk Öl'],
  },
  {
    category: 'Vin',
    subcategories: ['Vitt vin', 'Rött vin'],
  },
  {
    category: 'Sprit',
    subcategories: ['Likör'],
  },
];

const FAKE_CATEGORY = 'Not at all a category';

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('getting subcategories', () => {
  const r = request(app);

  it('fails with 400 without category', async () => {
    await r.post(BASE_ROUTE).send({}).expect(400);
  });

  it('returns empty list for unknown categories, but known categories still returns OK rank', async () => {
    const res = await r
      .post(BASE_ROUTE)
      .send({ categories: [FAKE_CATEGORY, KNOWN_SUBCATS[1].category] });

    const resBody = res.body as Record<string, string[]>

    expect(Object.keys(resBody)).toHaveLength(2);

    expect(res.statusCode).toEqual(200);
    expect(resBody[FAKE_CATEGORY]).toEqual([]);
    expect(resBody[KNOWN_SUBCATS[1].category]).toEqual(
      expect.arrayContaining(KNOWN_SUBCATS[1].subcategories),
    );
  });

  it('returns correct subcategory for single category', async () => {
    const res = await r
      .post(BASE_ROUTE)
      .send({ categories: [KNOWN_SUBCATS[2].category] });

    const resBody = res.body as Record<string, string[]>

    expect(Object.keys(resBody)).toHaveLength(1);

    expect(res.statusCode).toEqual(200);
    expect(resBody[KNOWN_SUBCATS[2].category]).toEqual(
      expect.arrayContaining(KNOWN_SUBCATS[2].subcategories),
    );
  });

  it('returns correct subcategories for multiple categories', async () => {
    const res = await r
      .post(BASE_ROUTE)
      .send({ categories: KNOWN_SUBCATS.map((e) => e.category) });

    const resBody = res.body as Record<string, string[]>

    expect(Object.keys(resBody)).toHaveLength(Object.keys(KNOWN_SUBCATS).length);

    expect(res.statusCode).toEqual(200);
    KNOWN_SUBCATS.forEach((e) => {
      expect(resBody[e.category]).toEqual(expect.arrayContaining(e.subcategories));
    });
  });
});
