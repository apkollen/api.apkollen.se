import app from '../../src/app';

import path = require('path');
import request = require('supertest');

// For prisma to find testing DB
process.env.PRISMA_URL = `file:${path.join(__dirname, '../db/test_db.sqlite')}`;

const BASE_ROUTE = '/bs/products/count';

// We have one dead product
const KNOWN_COUNT = {
  current: 5,
  all: 6,
};

describe('getting product count', () => {
  const r = request(app);

  it('returns correct number of live products', async () => {
    const res = await r.get(BASE_ROUTE).expect(200);
    const body = res.body as Record<string, number>

    expect(body.current).toEqual(KNOWN_COUNT.current);
    expect(body.all).toEqual(KNOWN_COUNT.all);
  });
});
