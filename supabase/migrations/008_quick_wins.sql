-- Migration 008: Quick Wins (Fase 3A)
-- 1. Tag de reserva de emergência em contas
-- 2. Regras de categorização automática

-- 1. Reserva de emergência
ALTER TABLE accounts ADD COLUMN is_emergency_reserve BOOLEAN DEFAULT FALSE;

-- 2. Regras de categorização automática
CREATE TABLE category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_category_rules_user ON category_rules(user_id);

-- RLS
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rules"
  ON category_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
