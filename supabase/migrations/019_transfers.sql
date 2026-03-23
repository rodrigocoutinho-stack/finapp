-- Migration 019: Suporte a transferências entre contas
-- Adiciona type 'transferencia' em transactions e recurring_transactions
-- com destination_account_id e category_id nullable

-- 1. Ampliar CHECK em transactions
ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('receita', 'despesa', 'transferencia'));

-- 2. Campo destination_account_id
ALTER TABLE transactions ADD COLUMN destination_account_id UUID
  REFERENCES accounts(id) ON DELETE SET NULL;

-- 3. Tornar category_id nullable (transferências não têm categoria)
ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;

-- 4. Consistência: transferencia ↔ destination, receita/despesa ↔ sem destination
ALTER TABLE transactions ADD CONSTRAINT transfers_consistency CHECK (
  (type = 'transferencia' AND destination_account_id IS NOT NULL AND account_id != destination_account_id)
  OR (type != 'transferencia' AND destination_account_id IS NULL)
);

-- 5. Índice para queries por conta destino
CREATE INDEX idx_transactions_destination_account
  ON transactions(destination_account_id) WHERE destination_account_id IS NOT NULL;

-- 6. Repetir para recurring_transactions
ALTER TABLE recurring_transactions DROP CONSTRAINT recurring_transactions_type_check;
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_type_check
  CHECK (type IN ('receita', 'despesa', 'transferencia'));

ALTER TABLE recurring_transactions ADD COLUMN destination_account_id UUID
  REFERENCES accounts(id) ON DELETE SET NULL;

ALTER TABLE recurring_transactions ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transfers_consistency CHECK (
  (type = 'transferencia' AND destination_account_id IS NOT NULL AND account_id != destination_account_id)
  OR (type != 'transferencia' AND destination_account_id IS NULL)
);
