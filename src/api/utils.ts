import { Knex } from 'knex';

import { DeadProductHistoryEntry, Product, ProductHistoryEntry } from '../models';
import { DbDeadProductHistoryEntry, DbProduct, DbProductHistoryEntry } from '../models/db';

/**
 * Adds a where statement for an interval to a query
 * @param query Query on which to add the clause
 * @param obj Object that contains interval
 * @param startKey Key of start of interval
 * @param endKey Key of end of interval
 * @param columnName Name of the column to use
 */
export const addIntervalWhereToQuery = <T>(
  query: Knex.QueryBuilder,
  obj: T | undefined,
  startKey: keyof T,
  endKey: keyof T,
  columnName: string,
) => {
  if (obj != null) {
    if (obj[startKey] != null) {
      query.where(columnName, '>=', obj[startKey]);
    }

    if (obj[endKey] != null) {
      query.where(columnName, '<=', obj[endKey]);
    }
  }
};

/**
 * Adds where clause to chain multiple `WHERE LIKE`-statements together
 * correctly
 * @param query Query on which to add the chain
 * @param columnName Name of the column to use
 * @param values Values to be chained together
 */
export const addMultipleWhereLikeToQuery = (
  query: Knex.QueryBuilder,
  columnName: string,
  values: string[] | undefined,
) => {
  if (values != null) {
    // Need to chain to ensure correct paranthesis placement
    query.where((q) => {
      values.forEach((n, i) => {
        if (i === 0) {
          q.whereLike(columnName, `%${n}%`);
        } else {
          q.or.whereLike(columnName, `%${n}%`);
        }
      });
    });
  }
};

/**
 * Select product history coloumn names as camelCase
 * @param query Query from which to select
 * @param withProductInfo If static product information should be is to be included
 * @param fromTable Table in which `bs_product_article_nbr` is to be taken
 */
export const selectCamelCaseProductHistory = (
  query: Knex.QueryBuilder,
) => {
  query
    .select('unit_volume AS unitVolume')
    .select('unit_price AS unitPrice')
    .select('alcvol', 'apk')
    .select('retrieved_timestamp AS retrievedTimestamp');
}

/**
 * Select static product info as camelCase
 * @param query Query from which to select
 * @param fromTable Table in which `bs_product_article_nbr` is to be taken
 */
export const selectCamelCaseProductInfo = (
  query: Knex.QueryBuilder,
  fromTable: string
  ) => {
    query.select('url')
    .select(`${fromTable ?? ''}.bs_product_article_nbr AS articleNbr`)
    .select('product_name AS productName')
    .select('category', 'subcategory')
    .select('rank AS currentRank')
    .select('review_score AS score')
    .select('review_text AS text')
    .select('reviewer_name AS reviewerName')
    .select('review_created_timestamp AS createdTimestamp');
  }

export const reduceDbProduct = (dp: DbProduct): Product => {
  const { score, text, reviewerName, createdTimestamp, ...reduced } = dp;

  const p: Product = { ...reduced };

  // If review exists, add it
  if (score != null && text != null && reviewerName != null && createdTimestamp != null) {
    p.review = {
      score,
      text,
      reviewerName,
      createdDate: new Date(createdTimestamp),
    };
  }

  return p;
}

/**
 * Converts an entry in the database to actual history entry
 * @param dbpr Result from database
 */
export const reduceDbProductHistoryEntry = (dbpr: DbProductHistoryEntry): ProductHistoryEntry => {
  const { retrievedTimestamp, ...reduced } = dbpr;

  const phe: ProductHistoryEntry = {
    ...reduced,
    retrievedDate: new Date(retrievedTimestamp),
  };

  return phe;
};

export const reduceDbDeadPostHistoryEntry = (
  md: DbDeadProductHistoryEntry,
): DeadProductHistoryEntry => {
  const { markedDeadTimestamp, markedRevivedTimestamp, articleNbr, ...reduced } = md;

  return {
    ...reduced,
    markedDeadDate: new Date(markedDeadTimestamp),
    markedRevivedDate: markedRevivedTimestamp == null ? null : new Date(markedDeadTimestamp),
  };
};
