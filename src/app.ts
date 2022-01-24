import express from 'express';
import cors from 'cors';
import { SearchProductsRequest } from './models/req';
import {
  getProductReview,
  getProductHistory,
  searchProducts,
  getCurrentProductRank,
  getCurrentProductCount,
  getAllCategories,
  getSubcatFromCats,
} from './api';
import { ProductHistoryEntry } from './models/index';
import { body, query, validationResult } from 'express-validator';

console.log('Starting startup...');

export const app = express();

app.use(
  cors({
    origin: '*',
  }),
);

app.use(express.json());

app.post('/bs/products/search', async (req, res) => {
  const pr: SearchProductsRequest = req.query;
  let rp: ProductHistoryEntry[];

  try {
    rp = await searchProducts(pr);
    res.send(rp);
  } catch (err) {
    if (err instanceof TypeError) {
      // Probably something wrong with request
      res.sendStatus(400);
    } else {
      console.error(
        `Error when getting products!:\n\t${JSON.stringify(
          err,
        )}\n\tWith request query: ${JSON.stringify(req.query)}`,
      );
      res.sendStatus(500);
    }
  }
});

app.post(
  '/bs/products/history',
  body('articleNbrs').exists().isArray().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { articleNbrs } = req?.body;

      const histories = await getProductHistory(articleNbrs as unknown as number[]);
      res.send(histories);
    } catch (err) {
      res.sendStatus(500);
    }
  },
);

app.post('/bs/products/review',  body('articleNbrs').exists().isArray().notEmpty(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { articleNbrs } = req?.body;

    const reviews = await getProductReview(articleNbrs as unknown as number[]);
    res.send(reviews);
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get('/bs/products/rank', body('articleNbrs').exists().isArray().notEmpty(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { articleNbrs } = req?.body;

    const ranks = await getCurrentProductRank(articleNbrs as unknown as number[]);
    res.send(ranks);
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get('/bs/products/count', async (_, res) => {
  try {
    const count = await getCurrentProductCount();
    res.send([count]);
  } catch (err) {
    res.sendStatus(500);
  }
});

app.get('/bs/categories', async (_, res) => {
  try {
    const categories = await getAllCategories();
    res.send(categories);
  } catch (err) {
    console.error(`Error when getting categories!:\n\t${JSON.stringify(err)}`);
    res.send(500);
  }
});

app.get('/bs/subcategories', body('categories').isArray().notEmpty(), async (req, res) => {
  try {
    const { categories } = req?.body;

    const subcategories = await getSubcatFromCats(categories as string[]);
    res.send(subcategories);
  } catch (err) {
    console.error(`Error when getting categories!:\n\t${JSON.stringify(err)}`);
    res.send(500);
  }
});

export default app;
