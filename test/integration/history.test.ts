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
import { FullHistoryResponse } from '../../src/models/res';

import request = require('supertest');

const BASE_ROUTE = '/bs/products/history';

const KNOWN_HISTORY = {
  articleNbr: 2033433,
  historyLength: 7,
  markedDeadHistoryLength: 2,
};

describe('getting product history', () => {
  const r = request(app);

  it('fails with 404 without articleNbr', async () => {
    await r.get(`${BASE_ROUTE}/`).expect(404);
  });

  it('returns 400 for invalid articleNbr', async () => {
    await r.get(`${BASE_ROUTE}/not-a-number`).expect(400);
  });

  it('returns for valid article number', async () => {
    await r.get(`${BASE_ROUTE}/${KNOWN_HISTORY.articleNbr}`).expect(200);
  });

  it('returns empty history for non-existant articleNbr', async () => {
    const res = await r.get(`${BASE_ROUTE}/666`).expect(200);

    const fhr = res.body as FullHistoryResponse;

    expect(fhr).not.toBeNull();
    expect(Object.keys(fhr)).toHaveLength(2);
    expect(fhr.history).toHaveLength(0);
    expect(fhr.markedDeadHistory).toHaveLength(0);
  });

  it('sorts history based on retrieval date', async () => {
    const res = await r.get(`${BASE_ROUTE}/${KNOWN_HISTORY.articleNbr}`).expect(200);

    const fhr = res.body as FullHistoryResponse;

    // Check sort copied array locally
    const sortedHistory = fhr.history
      .slice()
      .sort((a, b) => new Date(b.retrievedDate).getTime() - new Date(a.retrievedDate).getTime());
    const sortedMarkedDeadHistory = fhr.markedDeadHistory
      .slice()
      .sort((a, b) => new Date(b.markedDeadDate).getTime() - new Date(a.markedDeadDate).getTime());

    // Should be exactly equal
    expect(fhr.history).toStrictEqual(sortedHistory);
    expect(fhr.markedDeadHistory).toStrictEqual(sortedMarkedDeadHistory);
  });

  it('returns valid history for valid articleNbr', async () => {
    const res = await r.get(`${BASE_ROUTE}/${KNOWN_HISTORY.articleNbr}`).expect(200);

    const fhr = res.body as FullHistoryResponse;

    expect(fhr).not.toBeNull();
    expect(Object.keys(fhr)).toHaveLength(2);
    expect(fhr.history).toHaveLength(KNOWN_HISTORY.historyLength);
    expect(fhr.markedDeadHistory).toHaveLength(KNOWN_HISTORY.markedDeadHistoryLength);

    // Check validity of death history
    expect(Object.keys(fhr.markedDeadHistory[0])).toHaveLength(2);
    expect(fhr.markedDeadHistory[0].markedRevivedDate).not.toBeNull();
    expect(fhr.markedDeadHistory[0].markedRevivedDate).not.toBeNull();

    // Check validity of history
    fhr.history.forEach((e) => {
      expect(Object.keys(e)).toHaveLength(5);
      expect(e.alcvol).not.toBeNull();
      expect(e.apk).not.toBeNull();
      expect(e.retrievedDate).not.toBeNull();
      expect(e.unitPrice).not.toBeNull();
      expect(e.unitVolume).not.toBeNull();
    });
  });
});
