-- ============================================
-- Migration 026: 4º tipo de transação — `investimento`
--
-- Investimento NÃO é consumo; é alocação de ganho já realizado. Debita
-- a conta origem (como despesa) mas NÃO entra em KPIs de receita/despesa
-- do mês. Corrige o savings rate que hoje aparece deflacionado por
-- aportes contabilizados como despesa.
--
-- Muda apenas constraints CHECK (aditivas) e adiciona coluna em
-- monthly_closings. Nenhum dado existente é afetado.
--
-- Rollback:
--   ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
--   ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
--     CHECK (type IN ('receita', 'despesa', 'transferencia'));
--   (análogo para recurring_transactions e categories)
--   ALTER TABLE monthly_closings DROP COLUMN total_investment_cents;
-- ============================================

-- 1. Ampliar CHECK em transactions.type
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('receita', 'despesa', 'transferencia', 'investimento'));

-- 2. Ampliar CHECK em recurring_transactions.type
ALTER TABLE recurring_transactions DROP CONSTRAINT IF EXISTS recurring_transactions_type_check;
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_type_check
  CHECK (type IN ('receita', 'despesa', 'transferencia', 'investimento'));

-- 3. Ampliar CHECK em categories.type
--    Permite categorias de tipo investimento (ex.: "Aporte Ações", "Reserva").
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_type_check;
ALTER TABLE categories ADD CONSTRAINT categories_type_check
  CHECK (type IN ('receita', 'despesa', 'investimento'));

-- NOTA: As constraints de consistência de transferência existentes
-- (`transfers_consistency` em transactions e `recurring_transfers_consistency`
-- em recurring_transactions) já cobrem o caso novo: investimento != 'transferencia',
-- portanto sua cláusula `(type != 'transferencia' AND destination_account_id IS NULL)`
-- força destination_account_id = NULL em investimento, que é o comportamento desejado.

-- 4. Coluna de snapshot de investimento em monthly_closings
ALTER TABLE monthly_closings
  ADD COLUMN total_investment_cents BIGINT NOT NULL DEFAULT 0;

ALTER TABLE monthly_closings
  ADD CONSTRAINT monthly_closings_investment_positive
  CHECK (total_investment_cents >= 0);
