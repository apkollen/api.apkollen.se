import { Schema } from 'express-validator/src/middlewares/schema';
import { body } from 'express-validator';

/**
 * This file contains schemas to be used to validate search requests
 * according to their type definition. Chanes in either must be accompanied
 * with changes to the other.
 */

const baseProductRequestSchema: Schema = {
  productName: {
    optional: true,
    isArray: true,
  },
  category: {
    optional: true,
    isArray: true,
  },
  subcategory: {
    optional: true,
    isArray: true,
  },
  articleNbr: {
    optional: true,
    isArray: true,
  },

  // Nested interval properties
  // change this if other types of min-max is added (not likely)
  '*.min': {
    optional: true,
    isNumeric: true, // number, not just int
  },
  '*.max': {
    optional: true,
    isNumeric: true,
  },
};

export const baseSearchProductRequestSchema: Schema = {
  ...baseProductRequestSchema,
  maxItems: {
    optional: true,
    isInt: true,
    toInt: true, // Convert to int if possible
  },
  offset: {
    optional: true,
    isInt: true,
    toInt: true, // Convert to int if possible
  },
  includeDead: {
    isBoolean: true,
  },
  maxProductHistoryEntries: {
    optional: true,
    isInt: true,
    toInt: true, // Convert to int if possible
  },
  maxDeadProductHistoryEntries: {
    optional: true,
    isInt: true,
    toInt: true, // Convert to int if possible
  },

  // sortOrder is custom chain
};

interface StrictObject {
  [key: string]: string
}

export const sortOrderValidationChain = body('sortOrder')
  .if(body('sortOrder').exists())
  .custom((sortOrder) => {
    const so = sortOrder as StrictObject;

    if (so.key == null) {
      return false;
    }

    // CHANGE IF PRODUCT DATA IS EVER CHANGED!
    const validKeys = [
      'productName',
      'category',
      'subcategory',
      'unitVolume',
      'unitPrice',
      'alcvol',
      'apk',
      'articleNbr',
    ];

    return validKeys.includes(so.key);
  })
  .withMessage('sortOrder key must be of sortable member of the product properties')
  .custom((sortOrder) => {
    const so = sortOrder as StrictObject;

    if (so.order == null) {
      return false;
    }

    const validOrder = ['asc', 'desc'];

    return validOrder.includes(so.order);
  })
  .withMessage('sortOrder order must either be "asc" or "desc"');

export const fullSearchProductRequestSchema: Schema = {
  ...baseProductRequestSchema,
  includeMarkedAsDead: {
    optional: true,
    isBoolean: true,
  },
  'retrievedDate.start': {
    optional: true,
    isDate: true,
  },
  'retrievedDate.end': {
    optional: true,
    isDate: true,
  },
};
