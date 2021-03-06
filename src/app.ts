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
import cors from 'cors';
import express from 'express';
import { Request, Response } from 'express';
import { checkSchema, validationResult } from 'express-validator';

import BsProductApi from './api';
import { SearchProductRequest } from './models/req';
import { searchProductRequestSchema, sortOrderValidationChain } from './validation';

if (process.env.NODE_ENV !== 'test') {
  console.log('Starting startup...')
};

interface TypedRequestBody<T> extends Request {
  body: T;
}

const app = express();
const api = new BsProductApi();

app.use(
  cors({
    origin: '*',
  }),
);

app.use(express.json());

app.post(
  '/bs/products/search',
  checkSchema(searchProductRequestSchema),
  sortOrderValidationChain,
  async (req: TypedRequestBody<SearchProductRequest>, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sr: SearchProductRequest = req.body;

    try {
      res.send(await api.searchProducts(sr));
    } catch (err) {
      console.error(`Error when trying to handle query ${JSON.stringify(sr)} with error:\n\t`, err);
      res.sendStatus(500);
    }
  },
);

app.get('/bs/products/history/:articleNbr', (req, res: Response) => {
  const articleNbr = Number.parseInt(req.params.articleNbr);
  if (!Number.isSafeInteger(articleNbr)) {
    res.sendStatus(400);
  } else {
    api
      .getFullHistory(articleNbr)
      .then((h) => {
        res.send(h);
      })
      .catch((err) => {
        console.error(
          `Error when trying to handle history query for product ${articleNbr} with error:\n\t`,
          err,
        );
        res.sendStatus(500);
      });
  }
});

app.get('/bs/products/count', (_, res) => {
  Promise.all([api.getProductCount(false), api.getProductCount(true)])
    .then(([current, all]) => {
      res.send({
        current,
        all,
      });
    })
    .catch((err) => {
      console.log('Error when trying to get current product count', err);
      res.sendStatus(500);
    });
});

app.get('/bs/categories', (_, res) => {
  api
    .getAllCategories()
    .then((categories) => res.send(categories))
    .catch((err) => {
      console.error(`Error when getting categories:\n\t`, err);
      res.send(500);
    });
});

export default app;
