import { Knex } from 'knex';
import db from './db';
import { ProductHistoryEntry, ProductReview } from './models';
import { DatabaseProductHistoryEntry, DatabaseProductReview } from './models/db';
import { FullSearchProductRequest, TopListSearchProductRequest } from './models/req';

const PRODUCT_HISTORY_TABLE = 'bs_product_history_entry';
const DEAD_LINK_TABLE = 'dead_bs_product';
const REVIEW_TABLE = 'bs_product_review';

/**
 * Adds a query for an interval
 * @param query
 * @param obj
 * @param startKey
 * @param endKey
 * @param coloumnName
 */
const addIntervalWhereToQuery = <T>(
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

/**
 * Adds where clause to chain multiple `WHERE LIKE`-statements together
 * correctly
 * @param query Query on which to add the chain
 * @param column Name of the column to use
 * @param values Values to be chained together
 */
const addMultipleWhereLikeToQuery = (query: Knex.QueryBuilder, column: string, values: string[] | undefined) => {
  if (values != null) {
    // Need to chain to ensure correct paranthesis placement
    query.where((q) => {
      values.forEach((n, i) => {
        if (i == 0) {
          q.whereLike(column, `%${n}%`)
        } else {
          q.or.whereLike(column, `%${n}%`)
        }
      })
    })
  }
}

/**
 * Select product history coloumn names as camelCase
 * @param query Query from which to select
 * @param fromTable Table in which `bs_product_article_nbr` is to be taken
 */
const selectCamelCaseProductHistory = (query: Knex.QueryBuilder, fromTable: string) => {
  query
    .select('url')
    .select('product_name AS productName')
    .select('category', 'subcategory')
    .select('unit_volume AS unitVolume')
    .select('unit_price AS unitPrice')
    .select('alcvol', 'apk')
    .select(`${fromTable}.bs_product_article_nbr AS articleNbr`)
    .select('retrieved_timestamp AS retrievedTimestamp');
};

/**
 * Converts a entry in the database to actual history entry
 * @param dbpr Result from database
 */
const reduceDbPosthistoryEntry = (dbpr: DatabaseProductHistoryEntry): ProductHistoryEntry => {
  let markedAsDead = false;
  if (dbpr.markedAsDeadTimestamp != null) {
    // If we have a timestamp for when marked as dead, it IS marked as dead!
    markedAsDead = true;
  }

  const { retrievedTimestamp, ...reduced } = dbpr;

  return {
    ...reduced,
    markedAsDead,
    retrievedDate: new Date(retrievedTimestamp),
    markedAsDeadDate:
      dbpr.markedAsDeadTimestamp != null ? new Date(dbpr.markedAsDeadTimestamp) : undefined,
  };
};

/**
 * Searches the database for only the latest entries of
 * products not marked as dead
 * @param pr A query for products in the APKollen top list
 * @returns A list of the latest, live, product history entries, including
 * their current rank
 */
export const searchTopList = async (
  pr: TopListSearchProductRequest,
): Promise<ProductHistoryEntry[]> => {
  const query = db.queryBuilder<DatabaseProductHistoryEntry>();

  // Name of our CTE to keep track of only latest retrievals
  const cteName = 'latest_product_entries';

  // We only want latest, so we create CTE of latest instance
  // of each product
  query.with(
    cteName,
    db(PRODUCT_HISTORY_TABLE)
      .select('*')
      .rowNumber('rank', db.raw('ORDER BY apk DESC')) // We need row numbers from complete valid CTE, not just articleNbrs
      .max('retrieved_timestamp')
      .whereNotIn('bs_product_article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'))
      .groupBy('bs_product_article_nbr'),
  );

  // Now we make selection
  selectCamelCaseProductHistory(query, cteName);

  addMultipleWhereLikeToQuery(query, 'product_name', pr.productName);

  if (pr.category != null) {
    query.whereIn('category', pr.category);
  }

  if (pr.subcategory != null) {
    query.whereIn('subcategory', pr.subcategory);
  }

  // We add the interval queries
  addIntervalWhereToQuery<{ min?: number; max?: number }>(
    query,
    pr.unitVolume,
    'min',
    'max',
    'unit_volume',
  );
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.unitPrice, 'min', 'max', 'unit_price');
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.alcvol, 'min', 'max', 'alcvol');
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.apk, 'min', 'max', 'apk');

  if (pr.articleNbr != null) {
    query.whereIn(`${cteName}.bs_product_article_nbr`, pr.articleNbr);
  }

  // Add reviews, outer means "If not there, insert null"
  query.leftOuterJoin(
    REVIEW_TABLE,
    `${cteName}.bs_product_article_nbr`,
    'bs_product_review.bs_product_article_nbr',
  );

  // We make this selection from the CTE
  query.from(cteName);

  if (pr.sortOrder != null) {
    // Handle that we have timestamp in db but date in API
    const key = pr.sortOrder.key === 'retrievedDate' ? 'retrievedTimestamp' : pr.sortOrder.key;
    query.orderBy(key as string, pr.sortOrder.order);
  }

  if (pr.maxItems != null) {
    query.limit(pr.maxItems);
  }

  if (pr.offset != null) {
    query.offset(pr.offset);
  }

  const resRows = (await query) as DatabaseProductHistoryEntry[];
  const res = resRows.map(
    (dbpr: DatabaseProductHistoryEntry): ProductHistoryEntry => reduceDbPosthistoryEntry(dbpr),
  );

  return res;
};

/**
 * Searches through the whole history of product entries
 * @param pr A full search request of the APKollen database
 * @returns A list of all product history entries matching the search. **Does _not_
 * include current rank of any product.**
 */
export const searchAllHistoryEntries = async (
  pr: FullSearchProductRequest,
): Promise<ProductHistoryEntry[]> => {
  const query = db.queryBuilder<DatabaseProductHistoryEntry>();

  const cteName = 'valid_date_interval_bs_product_history_entry';

  // First we create CTE with all products to query from, i.e. either newest or in an interval
  if (pr.retrievedDate) {
    // We must build our CTE
    const dateIntervalCte = db(PRODUCT_HISTORY_TABLE).select('*');

    if (pr.retrievedDate.start != null) {
      const startTimestamp = pr.retrievedDate.start.getTime();
      dateIntervalCte.where('retrieved_timestamp', '<=', startTimestamp);
    }

    if (pr.retrievedDate.end != null) {
      const endTimestamp = pr.retrievedDate.end.getTime();
      dateIntervalCte.where('retrieved_timestamp', '>=', endTimestamp);
    }

    // Now we add this selection to our query as CTE
    query.with(cteName, dateIntervalCte);
  } else {
    // We assume they want everything
    query.with(cteName, db(PRODUCT_HISTORY_TABLE).select('*'));
  }

  // Now we make selection
  selectCamelCaseProductHistory(query, cteName);

  if (pr.includeMarkedAsDead) {
    // Join will only be made if this is true
    query.select('dead_bs_product.marked_dead_timestamp AS markedAsDeadTimestamp');
  }

  addMultipleWhereLikeToQuery(query, 'product_name', pr.productName);

  if (pr.category != null) {
    query.whereIn('category', pr.category);
  }

  if (pr.subcategory != null) {
    query.whereIn('subcategory', pr.subcategory);
  }

  addIntervalWhereToQuery<{ min?: number; max?: number }>(
    query,
    pr.unitVolume,
    'min',
    'max',
    'unit_volume',
  );
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.unitPrice, 'min', 'max', 'unit_price');
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.alcvol, 'min', 'max', 'alcvol');
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.apk, 'min', 'max', 'apk');

  if (pr.articleNbr != null) {
    query.whereIn(`${cteName}.bs_product_article_nbr`, pr.articleNbr);
  }

  if (!pr.includeMarkedAsDead) {
    // Only select those not in the DEAD_LINK_TABLE
    query.whereNotIn(
      `${cteName}.bs_product_article_nbr`,
      db(DEAD_LINK_TABLE).select('bs_product_article_nbr'),
    );
  } else {
    // Add marked as dead dates, also indicates if something has been marked as dead
    // outer here means if not found in dead links, mark as NULL
    query.leftOuterJoin(
      DEAD_LINK_TABLE,
      `${cteName}.bs_product_article_nbr`,
      'dead_bs_product.bs_product_article_nbr',
    );
  }

  // Add reviews, outer means "If not there, insert null"
  query.leftOuterJoin(
    REVIEW_TABLE,
    `${cteName}.bs_product_article_nbr`,
    'bs_product_review.bs_product_article_nbr',
  );

  // We make this selection for the valid dates
  query.from(cteName);

  if (pr.sortOrder != null) {
    // Handle that we have timestamp in db but date in API
    const key = pr.sortOrder.key === 'retrievedDate' ? 'retrievedTimestamp' : pr.sortOrder.key;
    query.orderBy(key as string, pr.sortOrder.order);
  }

  if (pr.maxItems != null) {
    query.limit(pr.maxItems);
  }

  if (pr.offset != null) {
    query.offset(pr.offset);
  }

  const resRows = (await query) as DatabaseProductHistoryEntry[];
  const res = resRows.map(
    (dbpr: DatabaseProductHistoryEntry): ProductHistoryEntry => reduceDbPosthistoryEntry(dbpr),
  );

  return res;
};

/**
 * Get complete history of products with specified article numbers
 * @param articleNbrs List of article numbers to get history from
 */
export const getProductHistory = async (
  articleNbrs: number[],
): Promise<Record<number, ProductHistoryEntry[]>> => {
  const query = db<DatabaseProductHistoryEntry>(PRODUCT_HISTORY_TABLE);
  selectCamelCaseProductHistory(query, PRODUCT_HISTORY_TABLE);
  query.whereIn('articleNbr', articleNbrs).orderBy('retrievedTimestamp');

  const rows = await query;

  let res: Record<number, ProductHistoryEntry[]> = {};

  // Ensure all have empty lists to begin with
  articleNbrs.forEach((i) => (res[i] = []));
  rows.forEach((v: DatabaseProductHistoryEntry) => {
    res[v.articleNbr].push(reduceDbPosthistoryEntry(v));
  });

  return res;
};

/**
 * Retrieves product reviews for specified article numbers, and returns a record
 * mapping each article number to their review (or null, if none is found)
 * @param articleNbrs
 */
export const getProductReview = async (
  articleNbrs: number[],
): Promise<Record<number, ProductReview | null>> => {
  const rows: DatabaseProductReview[] = await db<DatabaseProductReview>(REVIEW_TABLE)
    .select('review_score AS score')
    .select('review_text AS text')
    .select('reviewer_name AS reviewerName')
    .select('review_created_timestamp AS createdTimestamp')
    .select('bs_product_article_nbr AS articleNbr')
    .whereIn('bs_product_article_nbr', articleNbrs);

  let res: Record<number, ProductReview | null> = {};
  articleNbrs.forEach((i) => (res[i] = null));
  rows.forEach((v: DatabaseProductReview) => {
    const { createdTimestamp, articleNbr, ...reduced } = v;

    const pr: ProductReview = {
      ...reduced,
      createdDate: new Date(createdTimestamp),
    };

    res[v.articleNbr] = pr;
  });

  return res;
};

/**
 * Returns current ranks of products with provided article numbers, or `undefined` if
 * it currently holds no rank, as a record mapping article number to ranking.
 * @param articleNbrs
 */
export const getCurrentProductRank = async (
  articleNbrs: number[],
): Promise<Record<number, number | null>> => {
  const rows = await db
    .queryBuilder()
    .with(
      'latest_retrievals',
      db(PRODUCT_HISTORY_TABLE)
        .select('bs_product_article_nbr', 'apk')
        .rowNumber('rank', db.raw('ORDER BY apk DESC')) // We need row numbers from complete valid CTE, not just articleNbrs
        .max('retrieved_timestamp')
        .whereNotIn('bs_product_article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'))
        .groupBy('bs_product_article_nbr'),
    )
    .select('latest_retrievals.bs_product_article_nbr AS articleNbr')
    .select('rank')
    .whereIn('latest_retrievals.bs_product_article_nbr', articleNbrs)
    .from('latest_retrievals');

  let res: Record<number, number | null> = {};
  articleNbrs.forEach((i) => (res[i] = null));
  rows.forEach((row) => {
    res[row.articleNbr] = row.rank;
  });

  return res;
};

/**
 * Returns current count of products not marked as dead
 */
export const getCurrentProductCount = async (): Promise<number | undefined> => {
  const row = await db
    .queryBuilder()
    .with(
      'latest_retrievals',
      db(PRODUCT_HISTORY_TABLE)
        .select('bs_product_article_nbr')
        .max('retrieved_timestamp')
        .groupBy('bs_product_article_nbr'),
    )
    .count<Record<string, number>>()
    .from('latest_retrievals')
    .whereNotIn(
      'latest_retrievals.bs_product_article_nbr',
      db(DEAD_LINK_TABLE).select('bs_product_article_nbr'),
    )
    .first();

  return row != null ? row['count(*)'] : undefined;
};

export const getAllCategories = async (): Promise<string[]> => {
  const rows = await db<DatabaseProductHistoryEntry>(PRODUCT_HISTORY_TABLE).distinct('category');
  return rows.map((r) => r.category);
};

/**
 * Returns all subcategories to the categories provided
 * @param categories List of category names
 */
export const getSubcatFromCats = async (categories: string[]): Promise<string[]> => {
  const rows = await db<DatabaseProductHistoryEntry>(PRODUCT_HISTORY_TABLE)
    .select('subcategory')
    .distinct()
    .whereIn('category', categories);
  return rows.map((r) => r.subcategory);
};
