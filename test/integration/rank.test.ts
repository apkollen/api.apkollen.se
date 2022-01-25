import request from 'supertest';
import app from '../../src/app';
import db from '../../src/db';

const BASE_ROUTE = '/bs/products/rank';

const KNOWN_RANKS = [
  {
    articleNbr: 2033433, // Bear Beer
    rank: 1,
  },
  {
    articleNbr: 2110205, // Viiking 12,0
    rank: 2,
  },
  {
    articleNbr: 2043913, // Miintu
    rank: 5,
  },
];

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('getting product rank', () => {
  it('fails with 400 without articleNbrs', async () => {
    await request(app).post(BASE_ROUTE).send({}).expect(400);
  });

  it('returns null for unknown articleNbrs, but known articleNbr still returns OK rank', async () => {
    const res = await request(app)
      .post(BASE_ROUTE)
      .send({ articleNbrs: [666, KNOWN_RANKS[2].articleNbr] });

    expect(res.statusCode).toEqual(200);
    expect(res.body[666]).toBeNull();
    expect(res.body[KNOWN_RANKS[2].articleNbr]).toEqual(KNOWN_RANKS[2].rank);
  });

  it('returns correct rank for single product', async () => {
    const res = await request(app)
      .post(BASE_ROUTE)
      .send({ articleNbrs: [KNOWN_RANKS[1].articleNbr] });

    expect(res.statusCode).toEqual(200);
    expect(res.body[KNOWN_RANKS[1].articleNbr]).toEqual(KNOWN_RANKS[1].rank);
  });

  it('returns correct rank for multiple products', async () => {
    const res = await request(app)
      .post(BASE_ROUTE)
      .send({ articleNbrs: KNOWN_RANKS.map((a) => a.articleNbr) });

    expect(res.statusCode).toEqual(200);
    KNOWN_RANKS.forEach((a) => {
      expect(res.body[a.articleNbr]).toEqual(a.rank);
    });
  });
});
