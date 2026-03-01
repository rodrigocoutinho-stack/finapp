-- 018: Fechamento mensal persistente com snapshot de KPIs
-- Permite salvar dados do fechamento mensal e comparar mês a mês.

CREATE TABLE monthly_closings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,                          -- formato YYYY-MM
  total_income_cents BIGINT NOT NULL DEFAULT 0,
  total_expense_cents BIGINT NOT NULL DEFAULT 0,
  savings_rate NUMERIC(6,2),                    -- percentual (ex: 15.50)
  runway_months NUMERIC(6,1),                   -- meses de runway
  reserve_months NUMERIC(6,1),                  -- meses de reserva de emergência
  budget_deviation NUMERIC(6,2),                -- desvio orçamentário %
  fixed_expense_pct NUMERIC(6,2),               -- % gasto fixo
  total_balance_cents BIGINT,                   -- saldo total das contas no momento do fechamento
  notes TEXT,                                   -- observações do usuário (opcional)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Um fechamento por mês por usuário
  CONSTRAINT monthly_closings_unique_month UNIQUE (user_id, month),
  -- Valores não negativos
  CONSTRAINT monthly_closings_income_positive CHECK (total_income_cents >= 0),
  CONSTRAINT monthly_closings_expense_positive CHECK (total_expense_cents >= 0),
  -- Formato do mês
  CONSTRAINT monthly_closings_month_format CHECK (month ~ '^\d{4}-\d{2}$')
);

-- Índice para consultas por usuário ordenadas por mês
CREATE INDEX idx_monthly_closings_user_month ON monthly_closings (user_id, month DESC);

-- RLS
ALTER TABLE monthly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own closings"
  ON monthly_closings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own closings"
  ON monthly_closings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own closings"
  ON monthly_closings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own closings"
  ON monthly_closings FOR DELETE
  USING (auth.uid() = user_id);
