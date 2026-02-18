-- Migration 010: Composite indexes for query performance
-- These indexes support the most frequent query patterns in the app:
-- transactions filtered by user + date range, and by account + date range.

-- Index for dashboard/transacoes queries: WHERE user_id = ? AND date BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, date DESC);

-- Index for account-specific queries (import duplicate detection, per-account history)
CREATE INDEX IF NOT EXISTS idx_transactions_account_date
  ON transactions (account_id, date DESC);

-- Index for recurring_transactions filtered by user + active status
CREATE INDEX IF NOT EXISTS idx_recurring_user_active
  ON recurring_transactions (user_id, is_active);

-- Index for investment_entries by investment (used in dashboard + evolution chart)
CREATE INDEX IF NOT EXISTS idx_investment_entries_investment_date
  ON investment_entries (investment_id, date DESC);

-- Index for category_rules by user (used during import auto-categorization)
CREATE INDEX IF NOT EXISTS idx_category_rules_user
  ON category_rules (user_id);
