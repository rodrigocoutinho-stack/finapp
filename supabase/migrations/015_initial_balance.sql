-- Migration 015: Initial Balance for Account Reconciliation
-- Adds initial_balance_cents to accounts for reconciliation calculation.
-- Formula: calculated_balance = initial_balance_cents + SUM(receitas) - SUM(despesas)
-- Divergence = balance_cents - calculated_balance

-- Add column
ALTER TABLE accounts ADD COLUMN initial_balance_cents INTEGER NOT NULL DEFAULT 0;

-- Backfill: set initial_balance_cents so existing accounts reconcile without divergence.
-- initial_balance_cents = balance_cents - (SUM(receitas) - SUM(despesas))
UPDATE accounts
SET initial_balance_cents = accounts.balance_cents - COALESCE(
  (
    SELECT SUM(
      CASE WHEN t.type = 'receita' THEN t.amount_cents
           WHEN t.type = 'despesa' THEN -t.amount_cents
           ELSE 0
      END
    )
    FROM transactions t
    WHERE t.account_id = accounts.id
  ),
  0
);
