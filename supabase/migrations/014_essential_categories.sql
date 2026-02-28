-- Migration 014: Essential categories flag
-- Marca categorias de despesa como essenciais para cálculos de reserva/runway

ALTER TABLE categories ADD COLUMN is_essential BOOLEAN NOT NULL DEFAULT FALSE;
