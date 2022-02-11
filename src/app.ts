import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import { SearchProductRequest } from './models/req';
import BsProductApi from './api/api';
import { searchProductRequestSchema, sortOrderValidationChain } from './validation';
import { body, checkSchema, validationResult } from 'express-validator';

if (process.env.NODE_ENV !== 'test') console.log('Starting startup...');

interface TypedRequestBody<T> extends Request {
  body: T
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
      console.log(sr);
      res.send(await api.searchProducts(sr));
    } catch (err) {
      console.error(
        `Error when trying to handle query ${JSON.stringify(sr)} with error:\n\t`, err
      );
      res.sendStatus(500);
    }
  },
);

// app.post(
//   '/bs/products/history',
//   body('articleNbrs').exists().isArray().notEmpty(),
//   async (req: TypedRequestBody<{ articleNbrs: number[] }>, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { articleNbrs } = req.body;

//     try {
//       const histories = await getProductHistory(articleNbrs);
//       res.send(histories);
//     } catch (err) {
//       console.error(
//         `Error when trying to handle history query ${JSON.stringify(
//           articleNbrs,
//         )} with error:\n\t`, err
//       );
//       res.sendStatus(500);
//     }
//   },
// );

// app.post(
//   '/bs/products/review',
//   body('articleNbrs').exists().isArray().notEmpty(),
//   async (req: TypedRequestBody<{ articleNbrs: number[] }>, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { articleNbrs } = req.body;

//     try {
//       const reviews = await getProductReview(articleNbrs);
//       res.send(reviews);
//     } catch (err) {
//       console.error(
//         `Error when trying to handle review query ${JSON.stringify(
//           articleNbrs,
//         )} with error:\n\t`, err
//       );
//       res.sendStatus(500);
//     }
//   },
// );

// app.post(
//   '/bs/products/rank',
//   body('articleNbrs').exists().isArray().notEmpty(),
//   async (req: TypedRequestBody<{ articleNbrs: number[] }>, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { articleNbrs } = req.body;

//     try {
//       const ranks = await getCurrentProductRank(articleNbrs);
//       res.send(ranks);
//     } catch (err) {
//       console.error(
//         `Error when trying to handle rank query ${JSON.stringify(
//           articleNbrs,
//         )} with error:\n\t`, err
//       );
//       res.sendStatus(500);
//     }
//   },
// );

// app.get('/bs/products/count', (_, res) => {
//   getCurrentProductCount()
//     .then((count) => res.send([count]))
//     .catch((err) => {
//       console.error(`Error when trying to handle get of count with error:\n\t`, err);
//       res.sendStatus(500);
//     });
// });

// app.get('/bs/categories', (_, res) => {
//   getAllCategories()
//     .then((categories) => res.send(categories))
//     .catch((err) => {
//       console.error(`Error when getting categories:\n\t`, err);
//       res.send(500);
//     });
// });

// app.post(
//   '/bs/subcategories',
//   body('categories').isArray().notEmpty(),
//   async (req: TypedRequestBody<{ categories: string[] }>, res: Response) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { categories } = req.body;

//     try {
//       const subcategories = await getSubcatFromCats(categories);
//       res.send(subcategories);
//     } catch (err) {
//       console.error(`Error when getting subcategories:\n\t`, err);
//       res.send(500);
//     }
//   },
// );

export default app;
