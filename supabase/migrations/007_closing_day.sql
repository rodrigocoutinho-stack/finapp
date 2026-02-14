-- Migration 007: Add closing_day to profiles
-- Allows users to set a custom closing day for their financial periods.
-- Default 1 = standard calendar month (no change in behavior).

ALTER TABLE profiles
  ADD COLUMN closing_day integer NOT NULL DEFAULT 1
  CHECK (closing_day >= 1 AND closing_day <= 28);
