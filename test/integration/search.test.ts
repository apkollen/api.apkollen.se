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
import { SearchProductRequest } from '../../src/models/req';
import { SearchProductResponse } from '../../src/models/res';

import request = require('supertest');

const BASE_ROUTE = '/bs/products/search';

const KNOWN_TOP_LIST_LENGTH = 5;
const KNOWN_TOTAL_PRODUCT_AMOUNT = 6;

describe('searching the top list', () => {
  const r = request(app);
  
  const LATEST_HISTORY_ENTRY_DATE = new Date('2022-01-19T21:58:49.000Z');

  // Should return only viiking
  const SPECIFIC_SEARCH_EXPECTED_RESULT: SearchProductResponse = {
    currentRank: 2,
    articleNbr: 2110205,
    url: 'https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-viiking-strong-beer-120-2110205',
    productName: 'Harboe Viiking Strong Beer 12,0%',
    category: 'Öl & Cider',
    subcategory: 'Dansk Öl',
    latestHistoryEntryDate: LATEST_HISTORY_ENTRY_DATE,
    history: [
      {
        alcvol: 12,
        apk: 9.324009324009324,
        retrievedDate: LATEST_HISTORY_ENTRY_DATE,
        unitPrice: 4.25,
        unitVolume: 33,
      },
    ],
    markedDeadHistory: [],
  };

  const SPECIFIC_SEARCH: SearchProductRequest = {
    productName: 'e',
    category: ['Öl & Cider', 'Vin', 'Sprit'],
    subcategory: ['Dansk Öl', 'Vitt vin'],
    unitVolume: {
      min: 2,
    },
    unitPrice: {
      max: 300,
    },
    alcvol: {},
    apk: {
      min: 5,
      max: 10,
    },
    articleNbr: [2108382, 2108382, 2110205, 2033432], // Does not include bear beer, but does merlot (twice!)
    includeDead: false,
  };

  it('returns the correct amount of products for top list search', async () => {
    const res = await r.post(BASE_ROUTE).send({ includeDead: false }).expect(200);

    expect(res.body).toHaveLength(KNOWN_TOP_LIST_LENGTH);
  });

  it('does not return duplicate products', async () => {
    const res = await r.post(BASE_ROUTE).send({ includeDead: false }).expect(200);

    expect(res.body).toHaveLength(KNOWN_TOP_LIST_LENGTH);

    const spr = res.body as SearchProductResponse[];

    const names = spr.map((pr) => pr.productName);
    expect(names).toHaveLength(new Set(names).size);

    const articleNbrs = spr.map((pr) => pr.articleNbr);
    expect(articleNbrs).toHaveLength(new Set(articleNbrs).size);
  });

  it('returns expected result for specific search', async () => {
    const res = await r.post(BASE_ROUTE).send(SPECIFIC_SEARCH).expect(200);

    expect(res.body).toHaveLength(1);

    const spr = res.body as SearchProductResponse[];

    if (spr[0] != null) {
      // Make latestHistoryEntryDate an actual date
      spr[0].latestHistoryEntryDate = new Date(spr[0].latestHistoryEntryDate ?? 0);

      // Make retrievedDate actual date
      spr[0].history = spr[0].history.map((h) => {
        const { retrievedDate, ...reduced } = h;
        return {
          ...reduced,
          retrievedDate: new Date(retrievedDate),
        };
      });
    }

    expect(spr[0]).toMatchObject(SPECIFIC_SEARCH_EXPECTED_RESULT);
  });

  it('returns 400 if sortOrder present but not both properties', async () => {
    await Promise.all([
      r
        .post(BASE_ROUTE)
        .send({ sortOrder: { key: 'apk' }, includeDead: false })
        .expect(400),
      r
        .post(BASE_ROUTE)
        .send({ sortOrder: { order: 'desc' }, includeDead: false })
        .expect(400),
      r
        .post(BASE_ROUTE)
        .send({ sortOrder: { key: 'apk', order: 'desc' }, includeDead: false })
        .expect(200),
    ]);
  });

  it('returns 400 on using invalid sortOrder', async () => {
    // Depends on `src/validation.ts`
    await Promise.all([
      r
        .post(BASE_ROUTE)
        .send({ sortOrder: { key: 'not valid', order: 'desc' }, includeDead: false })
        .expect(400),
      r
        .post(BASE_ROUTE)
        .send({ sortOrder: { key: 'unitVolume', order: 'adooooga' }, includeDead: false })
        .expect(400),
      r
        .post(BASE_ROUTE)
        .send({ sortOrder: { key: 'unitVolume', order: 'desc' }, includeDead: false })
        .expect(200),
    ]);
  });

  it('defaults to sorting by APK', async () => {
    const res = await r.post(BASE_ROUTE).send({ includeDead: false }).expect(200);

    const spr = res.body as SearchProductResponse[];

    const sortedCopy = spr.slice().sort((a, b) => b.history[0].apk - a.history[0].apk);

    expect(spr).toStrictEqual(sortedCopy);
  });
});

describe('searching for all products', () => {
  const r = request(app);

  it('returns expected amount of total products', async () => {
    const res = await r.post(BASE_ROUTE).send({ includeDead: true }).expect(200);

    expect(res.body).toHaveLength(KNOWN_TOTAL_PRODUCT_AMOUNT);
  });

  it('has histories sorted by retrieval date', async () => {
    const res = await r.post(BASE_ROUTE).send({ includeDead: true }).expect(200);

    const spr = res.body as SearchProductResponse[];

    spr.forEach((s) => {
      // Check sort copied array locally
      const sortedHistory = s.history
        .slice()
        .sort((a, b) => new Date(b.retrievedDate).getTime() - new Date(a.retrievedDate).getTime());
      const sortedMarkedDeadHistory = s.markedDeadHistory
        .slice()
        .sort(
          (a, b) => new Date(b.markedDeadDate).getTime() - new Date(a.markedDeadDate).getTime(),
        );

      // Should be exactly equal
      expect(s.history).toStrictEqual(sortedHistory);
      expect(s.markedDeadHistory).toStrictEqual(sortedMarkedDeadHistory);
    });
  });

  it('sorts properly on productName', async () => {
    const res = await r
      .post(BASE_ROUTE)
      .send({ sortOrder: { key: 'productName', order: 'asc' }, includeDead: true })
      .expect(200);

    const spr = res.body as SearchProductResponse[];

    const sortedCopy = spr.slice().sort((a, b) => a.productName.localeCompare(b.productName));

    expect(spr).toStrictEqual(sortedCopy);
  });

  it('limits history in search when requested', async () => {
    let res = await r
      .post(BASE_ROUTE)
      .send({ articleNbr: [2033433], includeDead: false, maxProductHistoryEntries: 2 })
      .expect(200);

    let spr = res.body as SearchProductResponse[];

    expect(spr).toHaveLength(1);
    expect(spr[0].history).toHaveLength(2);

    // Now without limit
    res = await r.post(BASE_ROUTE).send({ articleNbr: [2033433], includeDead: false });

    // Bear beer should have more than two history entries
    spr = res.body as SearchProductResponse[];

    expect(spr).toHaveLength(1);
    expect(spr[0].history).not.toHaveLength(2);
  });

  it('limits marked dead history in search when requested', async () => {
    let res = await r
      .post(BASE_ROUTE)
      .send({ articleNbr: [2033433], includeDead: false, maxDeadProductHistoryEntries: 1 })
      .expect(200);

    let spr = res.body as SearchProductResponse[];

    expect(spr).toHaveLength(1);
    expect(spr[0].markedDeadHistory).toHaveLength(1);

    // Now without limit
    res = await r.post(BASE_ROUTE).send({ articleNbr: [2033433], includeDead: false });

    // Bear beer should have more than two history entries
    spr = res.body as SearchProductResponse[];

    expect(spr).toHaveLength(1);
    expect(spr[0].markedDeadHistory).not.toHaveLength(1);
  });
});
