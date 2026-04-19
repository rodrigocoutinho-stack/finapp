-- ============================================
-- Script manual — LIMPEZA DE DADOS DE TESTE
-- ============================================
-- Uso: execute no SQL Editor do Supabase, trocando :user_id pelo UUID do usuário.
--
-- ATENÇÃO:
--   • Este script é destrutivo. Aplica-se apenas a dados de teste.
--   • NÃO EXECUTAR em usuários reais sem confirmação explícita.
--   • Preserva contas e categorias — apenas movimentação é apagada.
--   • Reseta balance_cents de cada conta para o initial_balance_cents.
--
-- Para obter o UUID do usuário:
--   SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
-- ============================================

DO $$
DECLARE
  target_user UUID := '00000000-0000-0000-0000-000000000000'; -- <-- TROCAR AQUI
BEGIN
  -- Transações
  DELETE FROM transactions WHERE user_id = target_user;

  -- Transações planejadas (recorrentes/pontuais)
  DELETE FROM recurring_transactions WHERE user_id = target_user;

  -- Investimentos (entries → investments)
  DELETE FROM investment_entries
    WHERE investment_id IN (SELECT id FROM investments WHERE user_id = target_user);
  DELETE FROM investments WHERE user_id = target_user;

  -- Metas
  DELETE FROM goals WHERE user_id = target_user;

  -- Dívidas
  DELETE FROM debts WHERE user_id = target_user;

  -- Fechamentos mensais
  DELETE FROM monthly_closings WHERE user_id = target_user;

  -- Trilha de auditoria
  DELETE FROM audit_logs WHERE user_id = target_user;

  -- Regras de importação
  DELETE FROM category_rules WHERE user_id = target_user;

  -- Reseta saldo das contas ao valor inicial
  UPDATE accounts
    SET balance_cents = initial_balance_cents
    WHERE user_id = target_user;

  RAISE NOTICE 'Limpeza concluída para o usuário %', target_user;
END $$;
