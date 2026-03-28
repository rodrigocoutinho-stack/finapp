-- Migration 020: Agrupamento de contas
-- Adiciona campo account_group (nullable) para separar contas por grupo (ex: PJ, PF, Investimentos)

ALTER TABLE accounts ADD COLUMN account_group TEXT DEFAULT NULL;

-- Index for efficient GROUP BY / DISTINCT queries
CREATE INDEX idx_accounts_group ON accounts(user_id, account_group);
