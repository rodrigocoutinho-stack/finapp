-- ============================================
-- Migration 023: Category Groups
-- Creates category_groups table with is_net_revenue_block flag
-- Enables "net revenue block" concept: a group whose expenses are
-- deducted from revenues (e.g. PJ holding with taxes and operational costs
-- netted into a single "distributed profit" income line for PF view).
-- ============================================

CREATE TABLE category_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_net_revenue_block BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT category_groups_user_name_unique UNIQUE (user_id, name),
  CONSTRAINT category_groups_name_not_empty CHECK (length(trim(name)) > 0)
);

-- Partial index for fast lookup of net-revenue blocks per user
CREATE INDEX idx_category_groups_user_net_revenue
  ON category_groups (user_id)
  WHERE is_net_revenue_block = true;

-- RLS
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own category groups"
  ON category_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own category groups"
  ON category_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own category groups"
  ON category_groups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own category groups"
  ON category_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_category_groups_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER category_groups_set_updated_at
  BEFORE UPDATE ON category_groups
  FOR EACH ROW EXECUTE PROCEDURE public.touch_category_groups_updated_at();

-- ============================================
-- Seed default groups for new users
-- Only "Pessoa Jurídica" is flagged as net revenue block
-- ============================================
CREATE OR REPLACE FUNCTION public.seed_default_category_groups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.category_groups (user_id, name, is_net_revenue_block) VALUES
    (NEW.id, 'Receitas PF',                 false),
    (NEW.id, 'Pessoa Jurídica',             true),
    (NEW.id, 'Despesas Essenciais Fixas',   false),
    (NEW.id, 'Variáveis Essenciais',        false),
    (NEW.id, 'Variáveis Discricionárias',   false),
    (NEW.id, 'Contribuições / Fiscal',      false),
    (NEW.id, 'Extraordinários',             false),
    (NEW.id, 'Investimentos e Reserva',     false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_seed_category_groups
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.seed_default_category_groups();

-- ============================================
-- Backfill: create groups for existing users based on distinct
-- category_group values already present in their categories.
-- "Pessoa Jurídica" is flagged as net revenue block.
-- ============================================
INSERT INTO public.category_groups (user_id, name, is_net_revenue_block)
SELECT DISTINCT
  c.user_id,
  c.category_group AS name,
  (c.category_group = 'Pessoa Jurídica') AS is_net_revenue_block
FROM public.categories c
WHERE c.category_group IS NOT NULL
ON CONFLICT (user_id, name) DO NOTHING;
