-- Migration 005: Add period support to recurring_transactions
-- start_month/end_month define when a recurring transaction is active
-- Both NULL = always active (current behavior)
-- start_month = end_month = one-time (pontual)
-- Both set, different = recurring with defined period

ALTER TABLE recurring_transactions
  ADD COLUMN start_month text,
  ADD COLUMN end_month text;
