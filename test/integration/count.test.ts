import request from 'supertest';
import app from '../../src/app';
import db from '../../src/db';

const BASE_ROUTE = '/bs/products/count';

const KNOWN_COUNT = 5; // We have one dead product

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('getting product count', () => {
  const r = request(app);

  it('returns correct number of live products', async () => {
    const res = await r.get(BASE_ROUTE);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toEqual(KNOWN_COUNT);
  });
});
