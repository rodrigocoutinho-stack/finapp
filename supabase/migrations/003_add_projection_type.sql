-- ============================================
-- FinApp: Add projection_type to categories
-- ============================================

-- Adiciona campo de tipo de projeção às categorias
ALTER TABLE public.categories
ADD COLUMN projection_type text NOT NULL DEFAULT 'historical'
CHECK (projection_type IN ('recurring', 'historical'));

-- Atualiza categorias típicas de receita fixa para 'recurring'
UPDATE public.categories
SET projection_type = 'recurring'
WHERE name IN ('Salário', 'Freelance');

-- Índice para consultas de projeção
CREATE INDEX idx_categories_projection_type ON public.categories(user_id, projection_type);
