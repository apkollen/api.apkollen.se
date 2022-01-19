import { knex, Knex } from 'knex';
import { start } from 'repl';
import { DatabaseProductResponse } from './models/db';
import { ProductRequest } from './models/req';
import { ProductResponse } from './models/res';

const PRODUCT_TABLE = 'bs_product';
const DEAD_LINK_TABLE = 'dead_bs_product';
const REVIEW_TABLE = 'bs_product_review';

let db: Knex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: process.env.DB_FILE ?? '',
  },
  useNullAsDefault: true,
});

(async () => await db.raw('PRAGMA foreign_keys = ON;'))();

const addIntervalQuery = <T>(
  query: Knex.QueryBuilder,
  obj: T | undefined,
  startKey: keyof T,
  endKey: keyof T,
  coloumnName: string,
) => {
  if (obj != null) {
    if (obj[startKey] != null) {
      query.where(coloumnName, '<=', startKey as number);
    }

    if (obj[endKey] != null) {
      query.where(coloumnName, '>=', endKey as number);
    }
  }
};

export const getProducts = async (pr: ProductRequest): Promise<ProductResponse[]> => {
  const query = db<DatabaseProductResponse>(PRODUCT_TABLE);

  // First we create CTE with all products to query from, i.e. either newest or in an interval
  const validDateProductCteName = 'valid_date_product';
  if (pr.onlyNewest) {
    // We only want latest, so we create CTE of latest instance
    // of each product
    query.with(
      validDateProductCteName,
      db(PRODUCT_TABLE).select('*').max('retrieved_timestamp').groupBy('article_nbr'),
    );
  } else if (pr.retrievedDate) {
    // We must build our CTE
    const dateIntervalCte = db(PRODUCT_TABLE).select('*');

    if (pr.retrievedDate.start != null) {
      const startTimestamp = pr.retrievedDate.start.getTime();
      dateIntervalCte.where('retrieved_timestamp', '<=', startTimestamp);
    }

    if (pr.retrievedDate.end != null) {
      const endTimestamp = pr.retrievedDate.end.getTime();
      dateIntervalCte.where('retrieved_timestamp', '>=', endTimestamp);
    }

    // Now we add this selection to our query as CTE
    query.with(validDateProductCteName, dateIntervalCte);
  } else {
    // We assume they want everything
    query.with(validDateProductCteName, db(PRODUCT_TABLE).select('*'));
  }

  // Now we make selection
  query.select(`
    url,
    product_name AS productName,
    category, subcategory,
    unit_volume AS unitVolume,
    unit_price AS unitPrice,
    alcvol, apk,
    article_nbr AS articleNbr,
    ROW_NUMBER() OVER(ORDER BY apk) AS rank,
    retrieved_timestamp AS retrievedTimestamp,
    marked_dead_timestamp AS markedAsDeadTimestamp
    bs_product_review.review_score AS reviewScore,
  `);

  if (pr.productName != null) {
    query.whereIlike(
      'name',
      pr.productName.map((n) => `%${n}%`),
    );
  }

  if (pr.category != null) {
    query.whereIn('category', pr.category);
  }

  if (pr.subcategory != null) {
    query.whereIn('subcategory', pr.subcategory);
  }

  addIntervalQuery<{ min?: number; max?: number }>(
    query,
    pr.unitVolume,
    'min',
    'max',
    'unit_volume',
  );
  addIntervalQuery<{ min?: number; max?: number }>(query, pr.unitPrice, 'min', 'max', 'unit_price');
  addIntervalQuery<{ min?: number; max?: number }>(query, pr.alcvol, 'min', 'max', 'alcvol');
  addIntervalQuery<{ min?: number; max?: number }>(query, pr.apk, 'min', 'max', 'apk');

  if (pr.articleNbr != null) {
    query.whereIn('article_nbr', pr.articleNbr);
  }

  if (!pr.includeMarkedAsDead) {
    query.whereNotIn('article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'));
  } else {
    // Add marked as dead dates, also indicates if something has been marked as dead
    query.leftJoin(DEAD_LINK_TABLE, 'bs_product.article_nbr', 'dead_bs_product.bs_product_article_nbr')
  }

  // Add reviews
  query.leftJoin(
    REVIEW_TABLE,
    'bs_product.article_nbr',
    'bs_product_review.bs_product_article_nbr',
  );

  // We make this selection for the valid dates
  const resRows = await query.from(validDateProductCteName);

  const res = resRows.map((dbpr): ProductResponse => {
    let markedAsDead = false;
    if (dbpr.markedAsDeadTimestamp != null) {
      // If we have a timestamp for when marked as dead, it IS marked as dead!
      markedAsDead = true;
    }
    
    return {
      ...dbpr,
      markedAsDead,
      retrievedDate: new Date(dbpr.retreivedTimestamp),
      markedAsDeadDate: new Date(dbpr.markedAsDeadTimestamp),
    }
  });

  return res;
};