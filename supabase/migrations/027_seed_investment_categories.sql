-- ============================================
-- Migration 027: Seed — PF | Investimentos e PF | Reserva viram type='investimento'
--
-- As duas categorias já existiam no trigger seed_default_categories (migration 022)
-- como type='despesa'. Agora que o 4º tipo foi criado (migration 026), o seed é
-- atualizado para que NOVOS usuários recebam essas categorias no tipo correto.
--
-- Usuários existentes NÃO são afetados por esta migration (o trigger só dispara em
-- signup). Para eles, usar o script de reclassificação dedicado.
--
-- Rollback: re-aplicar a migration 022 (que tem as mesmas categorias com
-- type='despesa'). Seguro porque `create or replace` é idempotente.
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
    (new.id, 'PJ | Contabilidade',           'despesa', 'recurring',   false, 'Pessoa Jurídica'),
    (new.id, 'PJ | Impostos',                'despesa', 'historical',  false, 'Pessoa Jurídica');

  -- Moradia
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Moradia',                 'despesa', 'recurring',   true,  'Moradia'),
    (new.id, 'PF | Serviços essenciais',     'despesa', 'historical',  true,  'Moradia'),
    (new.id, 'PF | Casa & rotina',           'despesa', 'historical',  false, 'Moradia');

  -- Alimentação
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Alimentação',             'despesa', 'historical',  true,  'Alimentação');

  -- Transporte
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Transporte fixo',         'despesa', 'recurring',   true,  'Transporte');

  -- Saúde
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Saúde',                   'despesa', 'recurring',   true,  'Saúde');

  -- Educação
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Educação',                'despesa', 'recurring',   true,  'Educação');

  -- Família / Pessoal
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Família / criança',       'despesa', 'historical',  false, 'Família / Pessoal'),
    (new.id, 'PF | Pet',                     'despesa', 'historical',  false, 'Família / Pessoal'),
    (new.id, 'PF | Compras pessoais',        'despesa', 'historical',  false, 'Família / Pessoal'),
    (new.id, 'PF | Presentes',               'despesa', 'historical',  false, 'Família / Pessoal');

  -- Lazer & Viagens
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Lazer',                   'despesa', 'historical',  false, 'Lazer & Viagens'),
    (new.id, 'PF | Viagens',                 'despesa', 'historical',  false, 'Lazer & Viagens');

  -- Contribuições / Fiscal
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Doações / Dízimo',        'despesa', 'recurring',   false, 'Contribuições / Fiscal'),
    (new.id, 'PF | Impostos pessoais',       'despesa', 'historical',  false, 'Contribuições / Fiscal');

  -- Extraordinários
  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Despesas extraordinárias', 'despesa', 'historical', false, 'Extraordinários');

  -- ── INVESTIMENTOS ─────────────────────────────────────────
  -- (Migrado de type='despesa' em 022 para type='investimento' em 027)

  insert into public.categories (user_id, name, type, projection_type, is_essential, category_group) values
    (new.id, 'PF | Investimentos',           'investimento', 'recurring',   false, 'Investimentos e Reserva'),
    (new.id, 'PF | Reserva',                 'investimento', 'recurring',   false, 'Investimentos e Reserva');

  return new;
end;
$$;
