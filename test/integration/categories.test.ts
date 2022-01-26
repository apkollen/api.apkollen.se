import request from 'supertest';
import app from '../../src/app';
import db from '../../src/db';

const BASE_ROUTE = '/bs/categories';

const KNOWN_CATEGORIES = ['Öl & Cider', 'Vin', 'Sprit'];

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('getting categories', () => {
  const r = request(app);

  it('returns correct categories', async () => {
    const res = await r.get(BASE_ROUTE);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(expect.arrayContaining(KNOWN_CATEGORIES));
  });
});
