/**
 * Copyright 2022 Emil Jonathan Eriksson
 *
 *
 * This file is part of apkapi-ts.
 *
 * apkapi-ts is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, version 3.
 *
 * apkapi-ts is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with apkapi-ts.
 * If not, see <https://www.gnu.org/licenses/>.
 */
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
    const res = await r.get(BASE_ROUTE).expect(200);
    const body = res.body as Record<string, string[]>;

    expect(Object.keys(body)).toHaveLength(CATEGORIES.length);
    expect(Object.keys(body)).toEqual(expect.arrayContaining(CATEGORIES));

    // To make TS happy
    expect(body['Öl & Cider']).toEqual(expect.arrayContaining(KNOWN_CATEGORIES['Öl & Cider']));
    expect(body.Vin).toEqual(expect.arrayContaining(KNOWN_CATEGORIES.Vin));
    expect(body.Sprit).toEqual(expect.arrayContaining(KNOWN_CATEGORIES.Sprit));
  });
});
