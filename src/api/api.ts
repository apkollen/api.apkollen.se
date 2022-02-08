import db from '../db';
import { ProductHistoryEntry, ProductReview } from '../models';
import {
  DbDeadProductHistoryEntry,
  DbProductCurrentRank,
  DbProductHistoryEntry,
  DbProductReview,
} from '../models/db';
import { FullSearchProductRequest, TopListSearchProductRequest } from '../models/req';
import { ProductHistoryResponse } from '../models/res';
import {
  PRODUCT_TABLE,
  PRODUCT_HISTORY_TABLE,
  DEAD_LINK_TABLE,
  REVIEW_TABLE,
  TOP_LIST_VIEW,
} from './constants';
import {
  addIntervalWhereToQuery,
  addMultipleWhereLikeToQuery,
  selectCamelCaseProductHistory,
  reduceDbPostHistoryEntry,
  reduceDbDeadPostHistoryEntry,
} from './utils';

/**
 * Searches the database for only the latest entries of
 * products not marked as dead
 * @param pr A query for products in the APKollen top list
 * @param debug If `Knex` should output debug information, including complete query
 * @returns A list of the latest, live, product history entries, including
 * their current rank
 */
export const searchTopList = async (
  pr: TopListSearchProductRequest,
  debug = false,
): Promise<ProductHistoryEntry[]> => {
  const query = db<DbProductHistoryEntry>(TOP_LIST_VIEW);

  // Now we make selection
  selectCamelCaseProductHistory(query, TOP_LIST_VIEW, true, true);

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
  addIntervalWhereToQuery<{ min?: number; max?: number }>(
    query,
    pr.unitPrice,
    'min',
    'max',
    'unit_price',
  );
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.alcvol, 'min', 'max', 'alcvol');
  addIntervalWhereToQuery<{ min?: number; max?: number }>(query, pr.apk, 'min', 'max', 'apk');

  if (pr.articleNbr != null) {
    query.whereIn(`${TOP_LIST_VIEW}.bs_product_article_nbr`, pr.articleNbr);
  }

  // Add reviews, outer means "If not there, insert null"
  query.leftOuterJoin(
    REVIEW_TABLE,
    `${TOP_LIST_VIEW}.bs_product_article_nbr`,
    'bs_product_review.bs_product_article_nbr',
  );

  if (pr.sortOrder != null) {
    // Handle that we have timestamp in db but date in API
    const key = pr.sortOrder.key === 'retrievedDate' ? 'retrievedTimestamp' : pr.sortOrder.key;
    query.orderBy(key as string, pr.sortOrder.order);
  } else {
    query.orderBy('apk', 'desc');
  }

  if (pr.maxItems != null) {
    query.limit(pr.maxItems);
  }

  if (pr.offset != null) {
    query.offset(pr.offset);
  }

  const resRows = (await query.debug(debug)) as DbProductHistoryEntry[];
  const res = resRows.map(
    (dbpr: DbProductHistoryEntry): ProductHistoryEntry => reduceDbPostHistoryEntry(dbpr),
  );

  return res;
};

/**
 * Searches through the whole history of product entries
 * @param pr A full search request of the APKollen database
 * @param debug If `Knex` should output debug information, including complete query
 * @returns A list of all product history entries matching the search. **Does _not_
 * include current rank of any product.**
 */
export const searchAllHistoryEntries = async (
  pr: FullSearchProductRequest,
  debug = false,
): Promise<ProductHistoryEntry[]> => {
  const query = db.queryBuilder<DbProductHistoryEntry>();

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
  selectCamelCaseProductHistory(query, cteName, false, true);
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
  addIntervalWhereToQuery<{ min?: number; max?: number }>(
    query,
    pr.unitPrice,
    'min',
    'max',
    'unit_price',
  );
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

  // We make this selection for the valid dates
  query.from(cteName);

  if (pr.sortOrder != null) {
    // Handle that we have timestamp in db but date in API
    const key = pr.sortOrder.key === 'retrievedDate' ? 'retrievedTimestamp' : pr.sortOrder.key;
    query.orderBy(key as string, pr.sortOrder.order);
  } else {
    query.orderBy('apk', 'desc');
  }

  if (pr.maxItems != null) {
    query.limit(pr.maxItems);
  }

  if (pr.offset != null) {
    query.offset(pr.offset);
  }

  const resRows = (await query.debug(debug)) as DbProductHistoryEntry[];
  const res = resRows.map(
    (dbpr: DbProductHistoryEntry): ProductHistoryEntry => reduceDbPostHistoryEntry(dbpr),
  );

  return res;
};

/**
 * Get complete history of products with specified article numbers,
 * or `undefined` if no history on the product is held
 * @param articleNbrs List of article numbers to get history from
 */
export const getProductHistory = async (
  articleNbrs: number[],
): Promise<Record<number, ProductHistoryResponse>> => {
  const historyQuery = db<DbProductHistoryEntry>(PRODUCT_HISTORY_TABLE);
  selectCamelCaseProductHistory(historyQuery, PRODUCT_HISTORY_TABLE, false, false);
  historyQuery.leftJoin(
    PRODUCT_TABLE,
    `${PRODUCT_HISTORY_TABLE}.bs_product_article_nbr`,
    `${PRODUCT_TABLE}.article_nbr`,
  );
  historyQuery.whereIn('articleNbr', articleNbrs).orderBy('retrievedTimestamp');

  const deadHistoryQuery = db<DbDeadProductHistoryEntry>(DEAD_LINK_TABLE)
    .select(db.ref('bs_product_article_nbr').as('articleNbr'))
    .select(db.ref('marked_dead_timestamp').as('markedDeadTimestamp'))
    .select(db.ref('marked_revived_timestamp').as('markedRevivedTimestamp'))
    .whereIn('articleNbr', articleNbrs)
    .orderBy('markedDeadTimestamp');

  const [historyRows, deadHistoryRows] = await Promise.all([historyQuery, deadHistoryQuery]);

  let res: Record<number, ProductHistoryResponse> = {};

  res = historyRows.reduce<Record<number, ProductHistoryResponse>>((acc, row) => {
    if (!acc[row.articleNbr]) {
      acc[row.articleNbr] = {
        history: [],
        markedDeadHistory: [],
      };
    }

    acc[row.articleNbr].history.push(reduceDbPostHistoryEntry(row));

    return acc;
  }, res);

  res = deadHistoryRows.reduce((acc, row: DbDeadProductHistoryEntry) => {
    if (!acc[row.articleNbr]) {
      acc[row.articleNbr] = {
        history: [],
        markedDeadHistory: [],
      };
    }

    acc[row.articleNbr].markedDeadHistory.push(reduceDbDeadPostHistoryEntry(row));

    return acc;
  }, res);

  return res;
};

/**
 * Retrieves product reviews for specified article numbers, and returns a record
 * mapping each article number to their review if it exists
 * @param articleNbrs
 */
export const getProductReview = async (
  articleNbrs: number[],
): Promise<Record<number, ProductReview>> => {
  const rows: DbProductReview[] | undefined = await db<DbProductReview>(REVIEW_TABLE)
    .select('review_score AS score')
    .select('review_text AS text')
    .select('reviewer_name AS reviewerName')
    .select('review_created_timestamp AS createdTimestamp')
    .select('bs_product_article_nbr AS articleNbr')
    .whereIn('bs_product_article_nbr', articleNbrs);

  const res: Record<number, ProductReview> = {};

  rows.forEach((row) => {
    const { createdTimestamp, articleNbr, ...reduced } = row;

    const pr: ProductReview = {
      ...reduced,
      createdDate: new Date(createdTimestamp),
    };

    res[row.articleNbr] = pr;
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
): Promise<Record<number, number>> => {
  const rows: DbProductCurrentRank[] = await db<DbProductCurrentRank>(TOP_LIST_VIEW)
    .select(db.ref('bs_product_article_nbr').as('articleNbr'))
    .select(db.ref('rank').as('currentRank'))
    .whereIn('bs_product_article_nbr', articleNbrs);

  const res: Record<number, number> = {};
  rows.forEach((row) => {
    res[row.articleNbr] = row.currentRank;
  });

  return res;
};

/**
 * Returns current count of products not marked as dead.
 */
export const getCurrentProductCount = async (): Promise<number | undefined> => {
  const row = await db<DbProductHistoryEntry>(TOP_LIST_VIEW)
    .count<Record<string, number>>()
    .first();

  return row != null ? row['count(*)'] : undefined;
};

export const getAllCategories = async (): Promise<string[]> => {
  const rows = await db<DbProductHistoryEntry>(PRODUCT_TABLE).distinct('category');
  return rows.map((r) => r.category);
};

/**
 * Returns _all_ subcategories to the categories provided, as a Record
 * matching each category with their subcategories, if the category
 * has any subcategories.
 * @param categories List of category names
 */
export const getSubcatFromCats = async (
  categories: string[],
): Promise<Record<string, string[]>> => {
  const rows = await db<DbProductHistoryEntry>(PRODUCT_TABLE)
    .select('category', 'subcategory') // Any subcategory will only ever have one parent category
    .distinct()
    .whereIn('category', categories);

  const res: Record<string, string[]> = {};
  return rows.reduce((acc, row) => {
    if (!acc[row.category]) {
      acc[row.category] = [];
    }

    acc[row.category].push(row.subcategory);

    return acc;
  }, res);
};
