-- Migration 016: Debts (Gestão de Dívidas)
-- Tabela para controle de dívidas com juros, parcelas e simulação de pagamento extra

CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('emprestimo', 'financiamento', 'cartao', 'cheque_especial', 'outro')),
  original_amount_cents INTEGER NOT NULL CHECK (original_amount_cents > 0 AND original_amount_cents <= 100000000000),
  remaining_amount_cents INTEGER NOT NULL CHECK (remaining_amount_cents >= 0),
  monthly_payment_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_payment_cents >= 0),
  interest_rate_monthly NUMERIC(8,4) NOT NULL DEFAULT 0 CHECK (interest_rate_monthly >= 0),
  start_date DATE NOT NULL,
  due_date DATE,
  total_installments INTEGER CHECK (total_installments IS NULL OR total_installments > 0),
  paid_installments INTEGER NOT NULL DEFAULT 0 CHECK (paid_installments >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "debts_select" ON debts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "debts_insert" ON debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "debts_update" ON debts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "debts_delete" ON debts
  FOR DELETE USING (auth.uid() = user_id);

-- Index for active debts per user
CREATE INDEX idx_debts_user_active ON debts (user_id, is_active);
