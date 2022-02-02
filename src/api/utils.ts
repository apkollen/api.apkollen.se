import { Knex } from 'knex';
import { DeadProductHistoryEntry, ProductHistoryEntry } from '../models';
import { DbDeadProductHistoryEntry, DbProductHistoryEntry } from '../models/db';

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
 * Select product history coloumn names as camelCase, with optional
 * review information
 * @param query Query from which to select
 * @param fromTable Table in which `bs_product_article_nbr` is to be taken
 * @param withRank If rank should be selected
 * @param withReview If review information should be selected
 */
export const selectCamelCaseProductHistory = (
  query: Knex.QueryBuilder,
  fromTable: string,
  withRank: boolean,
  withReview: boolean,
) => {
  query
    .select('url')
    .select('product_name AS productName')
    .select('category', 'subcategory')
    .select('unit_volume AS unitVolume')
    .select('unit_price AS unitPrice')
    .select('alcvol', 'apk')
    .select(`${fromTable}.bs_product_article_nbr AS articleNbr`)
    .select('retrieved_timestamp AS retrievedTimestamp');

  if (withRank) {
    query.select('rank AS currentRank');
  }

  if (withReview) {
    query
      .select('review_score AS score')
      .select('review_text AS text')
      .select('reviewer_name AS reviewerName')
      .select('review_created_timestamp AS createdTimestamp');
  }
};

/**
 * Converts an entry in the database to actual history entry
 * @param dbpr Result from database
 */
export const reduceDbPostHistoryEntry = (dbpr: DbProductHistoryEntry): ProductHistoryEntry => {
  const { retrievedTimestamp, score, text, reviewerName, createdTimestamp, ...reduced } = dbpr;

  const phe: ProductHistoryEntry = {
    ...reduced,
    retrievedDate: new Date(retrievedTimestamp),
  };

  // If review exists, add it
  if (score != null && text != null && reviewerName != null && createdTimestamp != null) {
    phe.review = {
      score,
      text,
      reviewerName,
      createdDate: new Date(createdTimestamp),
    };
  } else {
    phe.review = null;
  }

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
