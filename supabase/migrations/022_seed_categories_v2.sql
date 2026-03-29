-- ============================================
-- FinApp: Updated default categories for new users
-- Replaces original seed with full category hierarchy (27 categories, 8 groups)
-- Existing users are NOT affected — only new signups
-- ============================================

create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- ── RECEITAS ──────────────────────────────────────────────

  -- Receitas PF
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Salário CLT',             'receita', 'recurring',   false, 'Receitas PF'),
    (new.id, 'PF | Lucro PJ',                'receita', 'recurring',   false, 'Receitas PF'),
    (new.id, 'PF | Aluguel imóvel',          'receita', 'recurring',   false, 'Receitas PF'),
    (new.id, 'PF | Rendimentos financeiros', 'receita', 'historical',  false, 'Receitas PF'),
    (new.id, 'PF | Contribuição esposa',     'receita', 'recurring',   false, 'Receitas PF'),
    (new.id, 'PF | Reembolsos',              'receita', 'historical',  false, 'Receitas PF');

  -- Pessoa Jurídica (receita)
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PJ | Receita de serviços',     'receita', 'recurring',   false, 'Pessoa Jurídica');

  -- ── DESPESAS ──────────────────────────────────────────────

  -- Pessoa Jurídica (despesa)
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PJ | Impostos',                'despesa', 'recurring',   false, 'Pessoa Jurídica'),
    (new.id, 'PJ | Contabilidade',           'despesa', 'recurring',   false, 'Pessoa Jurídica');

  -- Despesas Essenciais Fixas
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Moradia',                 'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (new.id, 'PF | Serviços essenciais',     'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (new.id, 'PF | Educação',                'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (new.id, 'PF | Saúde',                   'despesa', 'recurring',   true,  'Despesas Essenciais Fixas'),
    (new.id, 'PF | Transporte fixo',         'despesa', 'recurring',   true,  'Despesas Essenciais Fixas');

  -- Variáveis Essenciais
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Alimentação',             'despesa', 'historical',  true,  'Variáveis Essenciais'),
    (new.id, 'PF | Casa & rotina',           'despesa', 'historical',  true,  'Variáveis Essenciais'),
    (new.id, 'PF | Família / criança',       'despesa', 'historical',  true,  'Variáveis Essenciais'),
    (new.id, 'PF | Pet',                     'despesa', 'historical',  true,  'Variáveis Essenciais');

  -- Variáveis Discricionárias
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Lazer',                   'despesa', 'historical',  false, 'Variáveis Discricionárias'),
    (new.id, 'PF | Compras pessoais',        'despesa', 'historical',  false, 'Variáveis Discricionárias'),
    (new.id, 'PF | Viagens',                 'despesa', 'historical',  false, 'Variáveis Discricionárias'),
    (new.id, 'PF | Presentes',               'despesa', 'historical',  false, 'Variáveis Discricionárias');

  -- Contribuições / Fiscal
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Doações / Dízimo',        'despesa', 'historical',  false, 'Contribuições / Fiscal'),
    (new.id, 'PF | Impostos pessoais',       'despesa', 'historical',  false, 'Contribuições / Fiscal');

  -- Extraordinários
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Despesas extraordinárias', 'despesa', 'historical', false, 'Extraordinários');

  -- Investimentos e Reserva
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Investimentos',           'despesa', 'recurring',   false, 'Investimentos e Reserva'),
    (new.id, 'PF | Reserva',                 'despesa', 'recurring',   false, 'Investimentos e Reserva');

  return new;
end;
$$;
