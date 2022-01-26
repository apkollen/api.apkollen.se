import request from 'supertest';
import app from '../../src/app';
import db from '../../src/db';

const BASE_ROUTE = '/bs/products/history';
const VALID_ARTICLE_NBR_0 = 2110205; // Viiking 12,0

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
    const res = await r
      .post(BASE_ROUTE)
      .send({ articleNbrs: [VALID_ARTICLE_NBR_0] });

    expect(res.statusCode).toEqual(200);
  });
});
