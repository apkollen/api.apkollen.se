import { knex, Knex } from 'knex';
import 'dotenv/config';
import path from 'path';

let db: Knex;

if (process.env.NODE_ENV === 'test') {
  // jest will use 'test' as Node env, so we'll run
  // new db in memory for that so we have separate for each
  // test suite
  db = knex({
    client: 'better-sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    // Set up tables
    migrations: {
      directory: path.join(__dirname, '../test/db/migrations'),
    },
    // We define how to populate in-memory db with seed DB
    seeds: {
      directory: path.join(__dirname, '../test/db/seeds'),
    },
  });
} else {
  db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: process.env.DB_PATH ?? '',
    },
    useNullAsDefault: true,
  });
}

// Ensure foreign keys are checked
(async () => await db.raw('PRAGMA foreign_keys = ON;'))();

export default db;
