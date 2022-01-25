exports.up = async function(knex) {
  // This is basically just a copy/paste of `init.sql` in the `bsscraper` repo
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS "bs_product" (
        "article_nbr" INTEGER NOT NULL,
        PRIMARY KEY("article_nbr")
    )`);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS "bs_product_history_entry" (
        "url" TEXT NOT NULL,
        "product_name" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "subcategory" TEXT NOT NULL,
        "unit_volume" REAL NOT NULL,
        "unit_price" REAL NOT NULL,
        "alcvol" REAL NOT NULL,
        "apk" REAL NOT NULL,
        "bs_product_article_nbr" INTEGER NOT NULL,
        "retrieved_timestamp" INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY("bs_product_article_nbr") REFERENCES "bs_product"("article_nbr"),
        PRIMARY KEY("bs_product_article_nbr", "retrieved_timestamp")
    )
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS "dead_bs_product" (
        "bs_product_article_nbr" INTEGER NOT NULL,
        "marked_dead_timestamp" INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY("bs_product_article_nbr") REFERENCES "bs_product"("article_nbr"),
        PRIMARY KEY("bs_product_article_nbr")
    );
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS "bs_product_review" (
        "bs_product_article_nbr" INTEGER NOT NULL,
        "review_score" REAL NOT NULL,
        "review_text" TEXT NOT NULL,
        "reviewer_name" TEXT NOT NULL,
        "review_created_timestamp" INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY("bs_product_article_nbr") REFERENCES "bs_product"("article_nbr"),
        PRIMARY KEY("bs_product_article_nbr")
    );
  `);
}

exports.down = async function(knex) {
  // Do nothing, it's just in-memory anyway
}