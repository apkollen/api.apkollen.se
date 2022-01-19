import { Knex } from 'knex';
import db from './db';
import { DatabaseProductHistoryEntry, DatabaseProductReviewResponse } from './models/db';
import { ProductRequest, SortableProductRequestKey } from './models/req';
import { ProductHistoryEntryResponse, ProductReviewResponse } from './models/res';

const PRODUCT_HISTORY_TABLE = 'bs_product_history_entry';
const DEAD_LINK_TABLE = 'dead_bs_product';
const REVIEW_TABLE = 'bs_product_review';

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

export const getProducts = async (pr: ProductRequest): Promise<ProductHistoryEntryResponse[]> => {
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
  query.select('url')
    .select('product_name AS productName')
    .select('category', 'subcategory')
    .select('unit_volume AS unitVolume')
    .select('unit_price AS unitPrice')
    .select('alcvol', 'apk')
    .select('valid_bs_product_history_entry.bs_product_article_nbr AS articleNbr')
    .rowNumber('rank', 'apk')
    .select('retrieved_timestamp AS retrievedTimestamp')
    .select('bs_product_review.review_score AS reviewScore')

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
    query.orderBy(key, pr.sortOrder.order);
  }

  if (pr.maxItems != null) {
    query.limit(pr.maxItems);
  }

  if (pr.offset != null) {
    query.offset(pr.offset);
  }

  const resRows = (await query) as DatabaseProductHistoryEntry[];
  const res = resRows.map((dbpr: DatabaseProductHistoryEntry): ProductHistoryEntryResponse => {
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

export const getProductReview = async (articleNbr: number): Promise<ProductReviewResponse> => {
  const row: DatabaseProductReviewResponse = await db<DatabaseProductReviewResponse>(REVIEW_TABLE)
    .select('review_score AS score')
    .select('review_text AS text')
    .select('reviewer_name AS reviewerName')
    .select('review_created_timestamp AS createdTimestamp')
    .where('bs_product_article_nbr', articleNbr)
    .first();
  return {
    ...row,
    createdDate: new Date(row.createdTimestamp),
  };
};

/**
 * Returns current rank of product with provided articleNbr, or `undefined` if
 * it currently holds no rank
 * @param articleNbr 
 */
export const getProductCurrentRank = async (articleNbr: number): Promise<number | undefined> => {
  console.log(articleNbr);
  const row = await db.queryBuilder()
    .with(
      'latest_retrievals',
      db(PRODUCT_HISTORY_TABLE).select('bs_product_article_nbr', 'apk').max('retrieved_timestamp').groupBy('bs_product_article_nbr'),
    )
    .rowNumber('rank', 'apk')
    .where('latest_retrievals.bs_product_article_nbr', articleNbr)
    .from('latest_retrievals')
    .whereNotIn('latest_retrievals.bs_product_article_nbr', db(DEAD_LINK_TABLE).select('bs_product_article_nbr'))
    .first();

  return row?.rank;
};

/**
 * Returns current count of products not marked as dead
 */
export const getProductCurrentCount = async (): Promise<number | undefined> => {
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
