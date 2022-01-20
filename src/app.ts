import express from 'express';
import cors from 'cors';
import { ProductRequest } from './models/req';
import {
  getAllCategories,
  getProducts,
  getProductReview,
  getProductCurrentRank,
  getProductCurrentCount,
  getSubcatFromCats,
} from './api';
import { ProductHistoryEntryResponse } from './models/res';

console.log('Starting startup...');

export const app = express();

app.use(
  cors({
    origin: '*',
  }),
);

app.post('/bs/products', async (req, res) => {
  const pr: ProductRequest = req.query;
  let rp: ProductHistoryEntryResponse[];

  try {
    rp = await getProducts(pr);
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

app.post('/bs/products/current', async (req, res) => {
  
})

app.get('/bs/products/history/:articleNbr', async (req, res) => {
  try {
  const articleNbr: number = Number.parseInt(req.params.articleNbr);
  const history = await getProducts({
    articleNbr: [articleNbr],
    onlyNewest: false,
    includeMarkedAsDead: true,
    sortOrder: {
      key: 'retrievedDate',
      order: 'desc',
    },
  });
  res.send(history);
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get('/bs/products/review/:articleNbr', async (req, res) => {
  try {
    const articleNbr: number = Number.parseInt(req.params.articleNbr);
    const review = await getProductReview(articleNbr);
    res.send(review);
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get('/bs/products/current-rank/:articleNbr', async (req, res) => {
  try {
    const articleNbr: number = Number.parseInt(req.params.articleNbr);
    const rank = await getProductCurrentRank(articleNbr);
    res.send([rank]);
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get('/bs/products/current-count', async (_, res) => {
  try {
    const count = await getProductCurrentCount();
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

app.get('/bs/subcategories', async (req, res) => {
  try {
    const { categories } = req?.query;

    if (!Array.isArray(categories)) {
      res.sendStatus(400);
    } else {
      if (categories.length === 0) {
        res.send([]);
      } else {
        const subcategories = await getSubcatFromCats(categories as string[]);
        res.send(subcategories);
      }
    }
  } catch (err) {
    console.error(`Error when getting categories!:\n\t${JSON.stringify(err)}`);
    res.send(500);
  }
});

export default app;
