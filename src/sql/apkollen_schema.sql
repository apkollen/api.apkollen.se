/**
 * Copyright 2022 Emil Jonathan Eriksson
 *
 *
 * This file is part of apkapi-ts.
 *
 * apkapi-ts is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation, version 3.
 *
 * apkapi-ts is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with apkapi-ts.
 * If not, see <https://www.gnu.org/licenses/>.
 */
BEGIN TRANSACTION;

-- Product information unrelated to APK is
-- stored here, so they are searchable over time
CREATE TABLE IF NOT EXISTS bs_product (
    article_nbr INTEGER NOT NULL,
    url TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT NOT NULL,
    latest_history_entry_date DATETIME,
    PRIMARY KEY(article_nbr),
    FOREIGN KEY(article_nbr, latest_history_entry_date)
    REFERENCES bs_product_history_entry(bs_product_article_nbr, retrieved_date)
);

CREATE TABLE IF NOT EXISTS bs_product_review (
    bs_product_article_nbr INTEGER NOT NULL,
    review_score REAL NOT NULL,
    review_text TEXT NOT NULL,
    reviewer_name TEXT NOT NULL,
    review_created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bs_product_article_nbr) REFERENCES bs_product(article_nbr),
    PRIMARY KEY(bs_product_article_nbr)
);

CREATE TABLE IF NOT EXISTS dead_bs_product_history_entry (
    bs_product_article_nbr INTEGER NOT NULL,
    marked_dead_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    marked_revived_date DATETIME DEFAULT NULL,
    PRIMARY KEY(bs_product_article_nbr, marked_dead_date),
    FOREIGN KEY(bs_product_article_nbr) REFERENCES bs_product(article_nbr)
);

CREATE TABLE IF NOT EXISTS bs_product_history_entry (
    unit_volume REAL NOT NULL,
    unit_price REAL NOT NULL,
    alcvol REAL NOT NULL,
    apk REAL NOT NULL,
    bs_product_article_nbr INTEGER NOT NULL,
    retrieved_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bs_product_article_nbr) REFERENCES bs_product(article_nbr),
    PRIMARY KEY(bs_product_article_nbr, retrieved_date)
);

-- #########
-- # Views #
-- #########

CREATE VIEW IF NOT EXISTS current_dead_bs_product_article_nbr AS
    SELECT bs_product_article_nbr
    FROM dead_bs_product_history_entry
    WHERE marked_revived_date IS NULL
    GROUP BY bs_product_article_nbr
    HAVING MAX(marked_dead_date);

CREATE VIEW IF NOT EXISTS current_bs_product_rank AS
    SELECT bs_product_article_nbr, ROW_NUMBER() OVER(ORDER BY apk DESC) AS current_rank
    FROM bs_product_history_entry
    WHERE bs_product_article_nbr NOT IN current_dead_bs_product_article_nbr
    GROUP BY bs_product_article_nbr
    HAVING MAX(retrieved_date);

-- ############
-- # Triggers #
-- ############

-- Products should always reference latest history entry retrieval date
CREATE TRIGGER IF NOT EXISTS bs_product_latest_retrieval
    AFTER INSERT ON bs_product_history_entry
BEGIN
    UPDATE bs_product
    SET latest_history_entry_date = NEW.retrieved_date
    WHERE bs_product.article_nbr = NEW.bs_product_article_nbr;
END;

-- Only one non-revived per product
CREATE TRIGGER IF NOT EXISTS single_non_revived_dead_bs_product
    BEFORE INSERT ON dead_bs_product_history_entry
    WHEN EXISTS (
        SELECT bs_product_article_nbr
        FROM dead_bs_product_history_entry
        WHERE dead_bs_product_history_entry.bs_product_article_nbr = NEW.bs_product_article_nbr
        AND marked_revived_date IS NULL
    )
BEGIN
    -- The rest of the transaction (other dead products) may be
    -- valid, so we only rollback this statement with abort
    SELECT RAISE(ABORT, 'Only one non-revived entry per article');
END;

-- If a product is retrieved, it cannot be marked as dead
CREATE TRIGGER IF NOT EXISTS revive_bs_product_on_retrieval
    AFTER INSERT ON bs_product_history_entry
    WHEN NEW.bs_product_article_nbr IN current_dead_bs_product_article_nbr
BEGIN
    UPDATE dead_bs_product_history_entry
    SET marked_revived_date = CURRENT_TIMESTAMP
    WHERE dead_bs_product_history_entry.bs_product_article_nbr = NEW.bs_product_article_nbr
    AND dead_bs_product_history_entry.marked_revived_date IS NULL;
END;

-- ###########
-- # Indexes #
-- ###########

-- Since updating these are rare and batched, we can afford indexing

-- Searches are made directly on names
DROP INDEX IF EXISTS idx_product_names;
CREATE INDEX idx_product_names ON bs_product(product_name);

DROP INDEX IF EXISTS idx_product_categories;
CREATE INDEX idx_product_categories ON bs_product(category, subcategory);

-- APK is default sorting and often used (including by ranking),
-- so important index
DROP INDEX IF EXISTS idx_product_history_apk;
CREATE INDEX IF NOT EXISTS idx_product_history_apk ON bs_product_history_entry(apk);

DROP INDEX IF EXISTS idx_product_history_misc;
CREATE INDEX IF NOT EXISTS idx_product_histories ON bs_product_history_entry(alcvol, unit_volume, unit_price);

END TRANSACTION;