import { knex, Knex } from 'knex';
import { ProductRequest } from './models/req';
import { ProductResponse } from './models/res';

let db: Knex = knex({
    client: 'better-sqlite3',
    connection: {
        filename: process.env.DB_FILE ?? '',
    },
    useNullAsDefault: true,
});

(async () => await db.raw('PRAGMA foreign_keys = ON;'))();

const getProducts = async (pr: ProductRequest): Promise<ProductResponse> => {
    // First we create CTE with all products to query from, i.e. either newest or in an interval
    const validDateProductCteName = 'valid_date_product';
};