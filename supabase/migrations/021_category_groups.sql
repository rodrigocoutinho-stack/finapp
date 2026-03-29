-- Migration 021: Category Groups
-- Adds optional grouping field for categories (same pattern as account_group)

ALTER TABLE categories ADD COLUMN category_group TEXT DEFAULT NULL;

CREATE INDEX idx_categories_group ON categories(user_id, category_group);
