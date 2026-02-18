-- Migration 011: Budget caps per category + reserve target in profiles
-- Additive only — no destructive changes

-- Teto de orçamento por categoria (null = sem teto, usa forecast)
ALTER TABLE categories ADD COLUMN budget_cents INTEGER DEFAULT NULL;

-- Meta de reserva de emergência em meses (padrão 6)
ALTER TABLE profiles ADD COLUMN reserve_target_months INTEGER DEFAULT 6;
