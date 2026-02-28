-- Migration 013: Goals (Metas Financeiras)
-- Tabela para metas financeiras com prazo, progresso e vínculo opcional a conta

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_cents INTEGER NOT NULL CHECK (target_cents > 0 AND target_cents <= 100000000000),
  current_cents INTEGER NOT NULL DEFAULT 0 CHECK (current_cents >= 0),
  deadline DATE NOT NULL,
  horizon TEXT NOT NULL DEFAULT 'short' CHECK (horizon IN ('short', 'medium', 'long')),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  icon TEXT NOT NULL DEFAULT 'default',
  color TEXT NOT NULL DEFAULT 'emerald',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- SELECT: user can only see own goals
CREATE POLICY "goals_select" ON goals
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: user can only insert own goals, account must belong to user
CREATE POLICY "goals_insert" ON goals
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      account_id IS NULL
      OR EXISTS (SELECT 1 FROM accounts WHERE accounts.id = account_id AND accounts.user_id = auth.uid())
    )
  );

-- UPDATE: user can only update own goals, account must belong to user
CREATE POLICY "goals_update" ON goals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      account_id IS NULL
      OR EXISTS (SELECT 1 FROM accounts WHERE accounts.id = account_id AND accounts.user_id = auth.uid())
    )
  );

-- DELETE: user can only delete own goals
CREATE POLICY "goals_delete" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Index for active goals per user (most common query)
CREATE INDEX idx_goals_user_active ON goals (user_id, is_active);
