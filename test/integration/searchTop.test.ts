import request = require('supertest');
import app from '../../src/app';
import db from '../../src/db';
import { ProductHistoryEntry } from '../../src/models';
import { TopListSearchProductRequest } from '../../src/models/req';

const BASE_ROUTE = '/bs/products/search/current';

const KNOWN_TOP_LIST_LENGTH = 5;

beforeAll(async () => {
  // Setup in-memory DB
  await db.migrate.latest();
  await db.seed.run();
});

describe('searching the top list', () => {
  const r = request(app);
  
  // Should return only viiking
  const SPECIFIC_SEARCH_EXPECTED_RESULT: Partial<ProductHistoryEntry> = {
    url: 'https://www.bordershop.com/se/ol-cider/dansk-ol/harboe-viiking-strong-beer-120-2110205',
    productName: 'Harboe Viiking Strong Beer 12,0%',
    category: 'Öl & Cider',
    subcategory: 'Dansk Öl',
    alcvol: 12,
    articleNbr: 2110205,
  }
  const SPECIFIC_SEARCH: TopListSearchProductRequest = {
    productName: ['bear', 'viiking', 'merlot'],
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
    articleNbr: [2108382, 2108382, 2110205, 2033432] // Does not include bear beer, but does merlot (twice!)
  }

  it('returns the correct amount of products for all search', async () => {
    const res = await r.post(BASE_ROUTE).send({}).expect(200);

    expect(res.body).toHaveLength(KNOWN_TOP_LIST_LENGTH);
  });

  it('does not return duplicate products', async () => {
    const res = await r.post(BASE_ROUTE).send({}).expect(200);

    expect(res.body).toHaveLength(KNOWN_TOP_LIST_LENGTH);

    const resBody = res.body as ProductHistoryEntry[];
    
    const names = resBody.map((pr) => pr.productName);
    expect(names).toHaveLength((new Set(names)).size);

    const articleNbrs = resBody.map((pr) => pr.articleNbr);
    expect(articleNbrs).toHaveLength((new Set(articleNbrs)).size)
  });

  it('returns expected result for specific search', async () => {
    const res = await r.post(BASE_ROUTE).send(SPECIFIC_SEARCH).expect(200);

    expect(res.body).toHaveLength(1);

    const resBody = res.body as ProductHistoryEntry[]

    expect(resBody[0]).toMatchObject(SPECIFIC_SEARCH_EXPECTED_RESULT);
  });
});
