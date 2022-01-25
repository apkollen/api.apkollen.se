import { Schema } from 'express-validator/src/middlewares/schema';

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

  sortOrder: {
    optional: true,
    isObject: true,
  },
  'sortOrder.key': {
    // CHANGE IF PRODUCT DATA IS EVER CHANGED!
    errorMessage: 'sortOrder key must be of sortable member of the product properties',
    isIn: {
      // Confusing type workaround, just add valid keys to inner array
      // note that timestamps and possibly undefined SHOULD NOT BE SORTABLE,
      // as there is no guarantee that these are available to the SQL query
      options: [
        [
          'productName',
          'category',
          'subcategory',
          'unitVolume',
          'unitPrice',
          'alcvol',
          'apk',
          'articleNbr',
        ],
      ],
    },
  },
  'sortOrder.order': {
    errorMessage: 'sortOrder order must either be "asc" or "desc"',
    isIn: {
      options: [['asc', 'desc']],
    },
  },
};

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
