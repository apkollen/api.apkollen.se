import request from 'supertest';
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
  it('fails with 400 without category', async () => {
    await request(app).post(BASE_ROUTE).send({}).expect(400);
  });

  it('returns empty list for unknown categories, but known categories still returns OK rank', async () => {
    const res = await request(app)
      .post(BASE_ROUTE)
      .send({ categories: [FAKE_CATEGORY, KNOWN_SUBCATS[1].category] });

    expect(res.statusCode).toEqual(200);
    expect(res.body[FAKE_CATEGORY]).toEqual([]);
    expect(res.body[KNOWN_SUBCATS[1].category]).toEqual(
      expect.arrayContaining(KNOWN_SUBCATS[1].subcategories),
    );
  });

  it('returns correct subcategory for single category', async () => {
    const res = await request(app)
      .post(BASE_ROUTE)
      .send({ categories: [KNOWN_SUBCATS[2].category] });

    expect(res.statusCode).toEqual(200);
    expect(res.body[KNOWN_SUBCATS[2].category]).toEqual(
      expect.arrayContaining(KNOWN_SUBCATS[2].subcategories),
    );
  });

  it('returns correct subcategories for multiple categories', async () => {
    const res = await request(app)
      .post(BASE_ROUTE)
      .send({ categories: KNOWN_SUBCATS.map((e) => e.category) });

    expect(res.statusCode).toEqual(200);
    KNOWN_SUBCATS.forEach((e) => {
      expect(res.body[e.category]).toEqual(expect.arrayContaining(e.subcategories));
    });
  });
});
