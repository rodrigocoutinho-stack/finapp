-- ============================================
-- FinApp: Investments
-- ============================================

-- Tabela de investimentos
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  product text NOT NULL CHECK (product IN (
    'cdb', 'lci_lca', 'tesouro_selic', 'tesouro_prefixado', 'tesouro_ipca',
    'fundo', 'acao', 'fii', 'cri_cra', 'debenture', 'outro'
  )),
  indexer text NOT NULL CHECK (indexer IN (
    'cdi', 'prefixado', 'ipca', 'selic', 'ibovespa', 'outro'
  )),
  rate text,
  maturity_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
  ON public.investments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investments"
  ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investments"
  ON public.investments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investments"
  ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_investments_account ON public.investments(account_id);
CREATE INDEX idx_investments_active ON public.investments(user_id, is_active);

-- Tabela de lançamentos de investimentos
CREATE TABLE public.investment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('aporte', 'resgate', 'saldo')),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.investment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investment entries"
  ON public.investment_entries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own investment entries"
  ON public.investment_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investment entries"
  ON public.investment_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own investment entries"
  ON public.investment_entries FOR DELETE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX idx_investment_entries_user_id ON public.investment_entries(user_id);
CREATE INDEX idx_investment_entries_investment ON public.investment_entries(investment_id);
CREATE INDEX idx_investment_entries_date ON public.investment_entries(investment_id, date);
