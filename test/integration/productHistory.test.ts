import app from '../../src/app';
import db from '../../src/db';
import { ProductHistoryResponse } from '../../src/models/res';

import request = require('supertest');
import { DeadProductHistoryEntry, ProductHistoryEntry } from '../../src/models';

const BASE_ROUTE = '/bs/products/history';

const KNOWN_HISTORY = [
  {
    articleNbr: 2110205,
    name: 'Harboe Viiking Strong Beer 12,0%',
    historyLength: 1,
    markedDeadHistoryLength: 0,
  },
  {
    articleNbr: 2033433,
    name: 'Harboe Bear Beer Strong 7,7%',
    historyLength: 7,
    markedDeadHistoryLength: 1,
  },
];

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('getting product history', () => {
  const r = request(app);

  it('fails with 400 without articleNbrs', async () => {
    await r.post(BASE_ROUTE).send({}).expect(400);
  });

  it('returns for valid article number', async () => {
    const res = await r.post(BASE_ROUTE).send({ articleNbrs: [KNOWN_HISTORY[0].articleNbr] });

    expect(res.statusCode).toEqual(200);
  });

  it('returns multiple histories of valid lengths, even with invalid articleNbr', async () => {
    const res = await r
      .post(BASE_ROUTE)
      .send({ articleNbrs: [...KNOWN_HISTORY.map((h) => h.articleNbr), 666] });

    const resBody = res.body as Record<number, ProductHistoryResponse>;

    // Response has correct number of entries
    expect(Object.keys(resBody)).toHaveLength(Object.keys(KNOWN_HISTORY).length);

    expect(resBody[666]).toBeUndefined();

    KNOWN_HISTORY.forEach((kh) => {
      const a = kh.articleNbr;
      const history: ProductHistoryEntry[] = resBody[a].history;
      const markedDeadHistory: DeadProductHistoryEntry[] = resBody[a].markedDeadHistory;

      expect(history).toHaveLength(kh.historyLength);
      expect(markedDeadHistory).toHaveLength(kh.markedDeadHistoryLength);

      // Name and articleNbr same for all history entries for
      // this product
      history.forEach((h) => {
        expect(kh.name).toEqual(h.productName);
        expect(kh.articleNbr).toEqual(h.articleNbr);
      })
    });
  });
});
