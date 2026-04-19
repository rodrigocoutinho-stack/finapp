-- ============================================
-- Migration 024: Remove "PF | Lucro PJ" from default seed
-- Reason: with the net-revenue-block concept (migration 023), the PJ
-- group's (receitas − despesas) is consolidated as a single income line
-- in the PF view. A separate "PF | Lucro PJ" category would double-count.
-- Only affects new signups — existing users' categories are untouched.
-- ============================================

CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- ── RECEITAS ──────────────────────────────────────────────

  -- Receitas PF (sem "Lucro PJ" — agora calculado via bloco PJ)
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Salário CLT',             'receita', 'recurring',   false, 'Receitas PF'),
    (NEW.id, 'PF | Aluguel imóvel',          'receita', 'recurring',   false, 'Receitas PF'),
    (NEW.id, 'PF | Rendimentos financeiros', 'receita', 'historical',  false, 'Receitas PF'),
    (NEW.id, 'PF | Contribuição esposa',     'receita', 'recurring',   false, 'Receitas PF'),
    (NEW.id, 'PF | Reembolsos',              'receita', 'historical',  false, 'Receitas PF');

  -- Pessoa Jurídica (receita)
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PJ | Receita de serviços',     'receita', 'recurring',   false, 'Pessoa Jurídica');

  -- ── DESPESAS ──────────────────────────────────────────────

  -- Pessoa Jurídica (despesa)
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PJ | Impostos',                'despesa', 'recurring',   false, 'Pessoa Jurídica'),
    (NEW.id, 'PJ | Contabilidade',           'despesa', 'recurring',   false, 'Pessoa Jurídica');

  -- Despesas Essenciais Fixas
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Moradia',                 'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (NEW.id, 'PF | Serviços essenciais',     'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (NEW.id, 'PF | Educação',                'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (NEW.id, 'PF | Saúde',                   'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (NEW.id, 'PF | Transporte fixo',         'despesa', 'recurring',   true,  'Despesas Essenciais Fixas');

  -- Variáveis Essenciais
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Alimentação',             'despesa', 'historical',  true,  'Variáveis Essenciais'),
    (NEW.id, 'PF | Casa & rotina',           'despesa', 'historical',  true,  'Variáveis Essenciais'),
    (NEW.id, 'PF | Família / criança',       'despesa', 'historical',  true,  'Variáveis Essenciais'),
    (NEW.id, 'PF | Pet',                     'despesa', 'historical',  true,  'Variáveis Essenciais');

  -- Variáveis Discricionárias
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Lazer',                   'despesa', 'historical',  false, 'Variáveis Discricionárias'),
    (NEW.id, 'PF | Compras pessoais',        'despesa', 'historical',  false, 'Variáveis Discricionárias'),
    (NEW.id, 'PF | Viagens',                 'despesa', 'historical',  false, 'Variáveis Discricionárias'),
    (NEW.id, 'PF | Presentes',               'despesa', 'historical',  false, 'Variáveis Discricionárias');

  -- Contribuições / Fiscal
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Doações / Dízimo',        'despesa', 'historical',  false, 'Contribuições / Fiscal'),
    (NEW.id, 'PF | Impostos pessoais',       'despesa', 'historical',  false, 'Contribuições / Fiscal');

  -- Extraordinários
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Despesas extraordinárias', 'despesa', 'historical', false, 'Extraordinários');

  -- Investimentos e Reserva
  INSERT INTO public.categories (user_id, name, type, projection_type, is_essential, category_group) VALUES
    (NEW.id, 'PF | Investimentos',           'despesa', 'recurring',   false, 'Investimentos e Reserva'),
    (NEW.id, 'PF | Reserva',                 'despesa', 'recurring',   false, 'Investimentos e Reserva');

  RETURN NEW;
END;
$$;
