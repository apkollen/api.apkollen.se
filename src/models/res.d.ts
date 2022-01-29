import { ProductHistoryEntry, DeadProductHistoryEntry } from './index'

/**
 * Represents the search response, but does not include
 * information about if products was marked dead. This
 * can either be done with a request specifying all responses
 * to be alive, or by using a `ProductHistoryResponse`
 */
export type ProductSearchResponse = ProductHistoryEntry[];

/**
 * Represents the history response for a single product.
 * This includes all retrievals, as well as when the product
 * was marked as dead.
 */
export type ProductHistoryResponse = {
  history: ProductSearchResponse,
  markedDeadHistory: DeadProductHistoryEntry[],
};