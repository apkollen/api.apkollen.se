import { knex, Knex } from 'knex';
import 'dotenv/config';

const db: Knex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: process.env.DB_PATH ?? '',
  },
  useNullAsDefault: true,
});

(async () => await db.raw('PRAGMA foreign_keys = ON;'))();

export default db;
