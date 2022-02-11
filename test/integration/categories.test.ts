import app from '../../src/app';

import path = require('path');
import request = require('supertest');

// For prisma to find testing DB
process.env.PRISMA_URL = `file:${path.join(__dirname, '../db/test_db.sqlite')}`;

const BASE_ROUTE = '/bs/categories';

const KNOWN_CATEGORIES = {
  'Öl & Cider': ['Dansk Öl'],
  Vin: ['Rött vin', 'Vitt vin'],
  Sprit: ['Likör'],
};

describe('getting categories', () => {
  const r = request(app);
  const CATEGORIES = Object.keys(KNOWN_CATEGORIES);

  it('returns correct categories', async () => {
    const res = await r.get(BASE_ROUTE);
    const body = res.body as Record<string, string[]>;

    expect(res.statusCode).toEqual(200);
    expect(Object.keys(body)).toHaveLength(CATEGORIES.length);
    expect(Object.keys(body)).toEqual(expect.arrayContaining(CATEGORIES));

    // To make TS happy
    expect(body['Öl & Cider']).toEqual(expect.arrayContaining(KNOWN_CATEGORIES['Öl & Cider']));
    expect(body.Vin).toEqual(expect.arrayContaining(KNOWN_CATEGORIES.Vin));
    expect(body.Sprit).toEqual(expect.arrayContaining(KNOWN_CATEGORIES.Sprit));
  });
});
