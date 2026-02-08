-- ============================================
-- FinApp: Seed default categories for new users
-- ============================================

-- Function to insert default categories for a user
create or replace function public.seed_default_categories()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Receita categories
  insert into public.categories (user_id, name, type) values
    (new.id, 'Salário', 'receita'),
    (new.id, 'Freelance', 'receita'),
    (new.id, 'Investimentos', 'receita'),
    (new.id, 'Outros', 'receita');

  -- Despesa categories
  insert into public.categories (user_id, name, type) values
    (new.id, 'Alimentação', 'despesa'),
    (new.id, 'Transporte', 'despesa'),
    (new.id, 'Moradia', 'despesa'),
    (new.id, 'Saúde', 'despesa'),
    (new.id, 'Educação', 'despesa'),
    (new.id, 'Lazer', 'despesa'),
    (new.id, 'Outros', 'despesa');

  return new;
end;
$$;

-- Trigger: seed categories when a new profile is created
create trigger on_profile_created_seed_categories
  after insert on public.profiles
  for each row execute procedure public.seed_default_categories();
