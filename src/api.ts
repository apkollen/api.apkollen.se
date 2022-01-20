import { Knex } from 'knex';
import db from './db';
import { ProductHistoryEntry, ProductReview } from './models';
import { DatabaseProductHistoryEntry, DatabaseProductReview } from './models/db';
import { SearchProductsRequest } from './models/req';

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

/**
 * Select product history coloumn names as camelCase
 * @param query Query from which to select
 * @param fromTable Table in which `bs_product_article_nbr` is to be taken
 */
const selectCamelCaseProductHistory = (query: Knex.QueryBuilder, fromTable: string) => {
  query.select('url')
    .select('product_name AS productName')
    .select('category', 'subcategory')
    .select('unit_volume AS unitVolume')
    .select('unit_price AS unitPrice')
    .select('alcvol', 'apk')
    .select(`${fromTable}.bs_product_article_nbr AS articleNbr`)
    .select('retrieved_timestamp AS retrievedTimestamp');
}

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
 * Get complete history of products with specified article numbers
 * @param articleNbrs List of article numbers to get history from
 */
export const getProductHistory = async (articleNbrs: number[]): Promise<Record<number, ProductHistoryEntry[]>> => {
  const query = db<DatabaseProductHistoryEntry>(PRODUCT_HISTORY_TABLE);
  selectCamelCaseProductHistory(query, PRODUCT_HISTORY_TABLE);
  query.whereIn('article_nbr', articleNbrs).orderBy('retrievedTimestamp');

  const rows = await query;

  let res: Record<number, ProductHistoryEntry[]> = {};

  // Ensure all have empty lists to begin with
  articleNbrs.forEach(i => res[i] = []);
  rows.forEach((v: DatabaseProductHistoryEntry) => {
    res[v.articleNbr].push(reduceDbPosthistoryEntry(v));
  });

  return res;
}

/**
 * 
 * @param pr 
 */
export const searchProducts = async (pr: SearchProductsRequest): Promise<ProductHistoryEntry[]> => {
  const query = db.queryBuilder<DatabaseProductHistoryEntry>();

  // First we create CTE with all products to query from, i.e. either newest or in an interval
  if (pr.onlyNewest) {
    // We only want latest, so we create CTE of latest instance
    // of each product
    query.with(
      'valid_bs_product_history_entry',
      db(PRODUCT_HISTORY_TABLE).select('*').max('retrieved_timestamp').groupBy('valid_bs_product_history_entry.bs_product_article_nbr'),
    );
  } else if (pr.retrievedDate) {
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
    query.with('valid_bs_product_history_entry', dateIntervalCte);
  } else {
    // We assume they want everything
    query.with('valid_bs_product_history_entry', db(PRODUCT_HISTORY_TABLE).select('*'));
  }

  // Now we make selection
  selectCamelCaseProductHistory(query, 'valid_bs_product_history_entry');

  if (pr.includeMarkedAsDead) {
    // Join will only be made if this is true
    query.select('dead_bs_product.marked_dead_timestamp AS markedAsDeadTimestamp');
  }

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
    query.whereIn('valid_bs_product_history_entry.bs_product_article_nbr', pr.articleNbr);
  }

  if (!pr.includeMarkedAsDead) {
    // Only select those not in the DEAD_LINK_TABLE
    query.whereNotIn('valid_bs_product_history_entry.bs_product_article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'));
  } else {
    // Add marked as dead dates, also indicates if something has been marked as dead
    // outer here means if not found in dead links, mark as NULL
    query.leftOuterJoin(
      DEAD_LINK_TABLE,
      'valid_bs_product_history_entry.bs_product_article_nbr',
      'dead_bs_product.bs_product_article_nbr',
    );
  }

  // Add reviews, outer means "If not there, insert null"
  query.leftOuterJoin(
    REVIEW_TABLE,
    'valid_bs_product_history_entry.bs_product_article_nbr',
    'bs_product_review.bs_product_article_nbr',
  );

  // We make this selection for the valid dates
  query.from('valid_bs_product_history_entry');

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
  const res = resRows.map((dbpr: DatabaseProductHistoryEntry): ProductHistoryEntry => {
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
  });

  return res;
};

/**
 * Retrieves product reviews for specified article numbers, and returns a record
 * mapping each article number to their review (or null, if none is found)
 * @param articleNbrs 
 */
export const getProductReview = async (articleNbrs: number[]): Promise<Record<number, ProductReview | null>> => {
  const rows: DatabaseProductReview[] = await db<DatabaseProductReview>(REVIEW_TABLE)
    .select('review_score AS score')
    .select('review_text AS text')
    .select('reviewer_name AS reviewerName')
    .select('review_created_timestamp AS createdTimestamp')
    .select('bs_product_article_nbr AS articleNbr')
    .whereIn('bs_product_article_nbr', articleNbrs);

  let res: Record<number, ProductReview | null> = {};
  articleNbrs.forEach(i => res[i] = null);
  rows.forEach((v: DatabaseProductReview) => {
    const { createdTimestamp, articleNbr, ...reduced} = v;

    const pr: ProductReview = {
      ...reduced,
      createdDate: new Date(createdTimestamp),
    }

    res[v.articleNbr] = pr;
  });

  return res;
};

/**
 * Returns current ranks of products with provided article numbers, or `undefined` if
 * it currently holds no rank, as a record mapping article number to ranking.
 * @param articleNbrs 
 */
export const getCurrentProductRank = async (articleNbrs: number[]): Promise<Record<number, number | null>> => {
  const rows = await db.queryBuilder()
    .with(
      'latest_retrievals',
      db(PRODUCT_HISTORY_TABLE).select('bs_product_article_nbr', 'apk').max('retrieved_timestamp').groupBy('bs_product_article_nbr'),
    )
    .rowNumber('rank', 'apk')
    .select('latest_retrievals.bs_product_article_nbr AS articleNbr')
    .whereIn('latest_retrievals.bs_product_article_nbr', articleNbrs)
    .from('latest_retrievals')
    .whereNotIn('latest_retrievals.bs_product_article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'));
  
  let res: Record<number, number | null> = {};
  articleNbrs.forEach(i => res[i] = null);
  rows.forEach((row) => {
    res[row.articleNbr] = row.rank;
  });

  return res;
};

/**
 * Returns current count of products not marked as dead
 */
export const getCurrentProductCount = async (): Promise<number | undefined> => {
  const row = await db.queryBuilder()
    .with(
      'latest_retrievals',
      db(PRODUCT_HISTORY_TABLE).select('bs_product_article_nbr').max('retrieved_timestamp').groupBy('bs_product_article_nbr'),
    )
    .count<Record<string, number>>()
    .from('latest_retrievals')
    .whereNotIn('latest_retrievals.bs_product_article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'))
    .first();

  return row != null ? row['count(*)'] : undefined;
};

export const getAllCategories = async (): Promise<string[]> => {
  return db<string[]>(PRODUCT_HISTORY_TABLE).distinct('category');
};

/**
 * Returns all subcategories to the categories provided
 * @param categories List of category names
 */
export const getSubcatFromCats = async (categories: string[]): Promise<string[]> => {
  return db<string[]>(PRODUCT_HISTORY_TABLE).select('subcategory').distinct().whereIn('category', categories);
};