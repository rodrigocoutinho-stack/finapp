-- ============================================
-- Migration 025: Competency override per transaction
-- Adiciona `competency_month` (YYYY-MM) opcional em transactions.
-- Quando NULL, a competência é derivada de `date` + closing_day.
-- Quando preenchido, sobrepõe a derivação.
--
-- Caso de uso: conta de abril paga em atraso em 15/mai com closing_day=10 —
-- a data do pagamento cai em maio mas a competência pertence a abril.
-- ============================================

-- 1) Coluna
ALTER TABLE transactions
  ADD COLUMN competency_month TEXT;

-- 2) CHECK de formato YYYY-MM (usa [0-9] em vez de \d para compatibilidade POSIX)
ALTER TABLE transactions
  ADD CONSTRAINT transactions_competency_month_format
  CHECK (
    competency_month IS NULL
    OR competency_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  );

-- 3) Índice parcial para consultas por competência quando override presente
CREATE INDEX idx_transactions_competency_month
  ON transactions (user_id, competency_month)
  WHERE competency_month IS NOT NULL;
