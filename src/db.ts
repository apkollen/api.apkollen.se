import { knex, Knex } from 'knex';

const db: Knex = knex({
  client: 'better-sqlite3',
  connection: {
    filename: process.env.DB_FILE ?? '',
  },
  useNullAsDefault: true,
});

(async () => await db.raw('PRAGMA foreign_keys = ON;'))();

export default db;
