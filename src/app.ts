import express from 'express';
import cors from 'cors';
import { ProductRequest } from './models/req';
import { getAllCategories, getProducts } from './db';
import { ProductResponse } from './models/res';

console.log('Starting startup...');

export const app = express();

app.use(
  cors({
    origin: '*',
  }),
);

app.post('/products', async (req, res) => {
  const pr: ProductRequest = req.query;
  let rp: ProductResponse[];

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

app.get('/categories', async (_, res) => {
  try {
    const categories = await getAllCategories();
    res.send(categories);
  } catch (err) {
    console.error(`Error when getting categories!:\n\t${JSON.stringify(err)}`);
    res.send(500);
  }
});
