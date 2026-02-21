-- Migration 012: Security Hardening
-- 1. Fix adjust_account_balance RPC (search_path, row count, magnitude limit)
-- 2. Strengthen transactions INSERT policy (validate account_id ownership)
-- 3. Strengthen category_rules policy (validate category_id ownership)
-- 4. Add CHECK constraint on reserve_target_months

-- ============================================
-- 1. Harden adjust_account_balance RPC
-- ============================================
CREATE OR REPLACE FUNCTION adjust_account_balance(p_account_id UUID, p_delta BIGINT)
RETURNS VOID AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  -- Magnitude guard: reject deltas above 10 million BRL (1 billion cents)
  IF ABS(p_delta) > 1000000000 THEN
    RAISE EXCEPTION 'Delta fora do intervalo aceitável';
  END IF;

  UPDATE public.accounts
  SET balance_cents = balance_cents + p_delta
  WHERE id = p_account_id
    AND user_id = auth.uid();

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'Conta não encontrada ou acesso negado';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================
-- 2. Strengthen transactions INSERT policy
--    Validate that account_id and category_id belong to the same user
-- ============================================
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND account_id IN (SELECT id FROM public.accounts WHERE user_id = auth.uid())
    AND category_id IN (SELECT id FROM public.categories WHERE user_id = auth.uid())
  );

-- ============================================
-- 3. Strengthen category_rules policy
--    Validate that category_id belongs to the same user
-- ============================================
DROP POLICY IF EXISTS "Users can manage own rules" ON public.category_rules;

CREATE POLICY "Users can manage own rules"
  ON public.category_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND category_id IN (SELECT id FROM public.categories WHERE user_id = auth.uid())
  );

-- ============================================
-- 4. Add CHECK constraint on reserve_target_months
-- ============================================
ALTER TABLE public.profiles
  ADD CONSTRAINT check_reserve_target_months
  CHECK (reserve_target_months >= 1 AND reserve_target_months <= 60);
