exports.up = async function(knex) {
  // This is basically just a copy/paste of `init.sql` in the `bsscraper` repo
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS "bs_product" (
        "article_nbr" INTEGER NOT NULL,
        PRIMARY KEY("article_nbr")
    )`);

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

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS dead_bs_product (
        bs_product_article_nbr INTEGER NOT NULL,
        marked_dead_timestamp INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        marked_revived_timestamp INTEGER DEFAULT NULL,
        FOREIGN KEY(bs_product_article_nbr) REFERENCES bs_product(article_nbr)
    );
  `);

  await knex.raw(`
    CREATE VIEW IF NOT EXISTS current_dead_bs_product_article_nbr AS
      SELECT bs_product_article_nbr
      FROM dead_bs_product
      WHERE marked_revived_timestamp IS NULL
      GROUP BY bs_product_article_nbr
      HAVING MAX(marked_dead_timestamp);
  `);

  await knex.raw(`
    -- Only one non-revived per product
    CREATE TRIGGER IF NOT EXISTS single_non_revived_dead_bs_product
        BEFORE INSERT ON dead_bs_product
    BEGIN
        SELECT
            CASE
                WHEN 
                    EXISTS (
                        SELECT bs_product_article_nbr
                        FROM dead_bs_product
                        WHERE dead_bs_product.bs_product_article_nbr = NEW.bs_product_article_nbr
                        AND marked_revived_timestamp IS NULL
                    )
                THEN
                    RAISE (ABORT, 'Only one non-revived entry per article')
                END;
    END;
  `)

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
    CREATE VIEW IF NOT EXISTS current_bs_top_list AS
      SELECT *, ROW_NUMBER() OVER(ORDER BY apk DESC) AS rank, MAX(retrieved_timestamp)
      FROM bs_product_history_entry
      WHERE bs_product_article_nbr NOT IN (
          SELECT bs_product_article_nbr
          FROM dead_bs_product
      )
      GROUP BY bs_product_article_nbr;
  `);

  await knex.raw(`
    -- Only one non-revived per product
    CREATE TRIGGER IF NOT EXISTS single_non_revived_dead_bs_product
        BEFORE INSERT ON dead_bs_product
    BEGIN
        SELECT
            CASE
                WHEN 
                    EXISTS (
                        SELECT bs_product_article_nbr
                        FROM dead_bs_product
                        WHERE dead_bs_product.bs_product_article_nbr = NEW.bs_product_article_nbr
                        AND marked_revived_timestamp IS NULL
                    )
                THEN
                    RAISE (ABORT, 'Only one non-revived entry per article')
                END;
    END;
  `)
}

exports.down = async function(knex) {
  // Do nothing, it's just in-memory anyway
}