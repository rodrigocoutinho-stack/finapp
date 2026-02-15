-- RPC atômica para ajustar saldo de conta (evita race condition read-then-write)
CREATE OR REPLACE FUNCTION adjust_account_balance(p_account_id UUID, p_delta BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts
  SET balance_cents = balance_cents + p_delta
  WHERE id = p_account_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
