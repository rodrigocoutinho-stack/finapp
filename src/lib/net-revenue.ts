/**
 * Net Revenue Block — consolida grupos marcados como "bloco de receita líquida"
 * (ex.: Pessoa Jurídica) em uma única linha de receita na visão PF.
 *
 * Regra central: para grupos com `is_net_revenue_block = true`,
 *   líquido = Σ receitas(grupo) − Σ despesas(grupo)
 *
 * - O líquido entra no KPI de Receitas PF
 * - As despesas do grupo NÃO entram no KPI de Despesas (evita dupla contagem)
 * - Categorias do grupo somem dos gráficos/tabelas de despesas pessoais
 */

export interface TransactionLike {
  type: "receita" | "despesa" | "transferencia" | "investimento";
  amount_cents: number;
  categories: { name: string; category_group: string | null } | null;
}

export interface NetRevenueBlockBreakdown {
  groupName: string;
  grossReceitasCents: number;
  grossDespesasCents: number;
  netCents: number;
  items: Array<{
    categoryName: string;
    type: "receita" | "despesa";
    amountCents: number;
  }>;
}

export interface ConsolidatedKPIs {
  totalReceitasCents: number;
  totalDespesasCents: number;
  totalInvestimentosCents: number;
  netRevenueBlocks: NetRevenueBlockBreakdown[];
  /** Apenas receitas diretas PF (sem somar o líquido dos blocos) */
  directReceitasCents: number;
}

/**
 * Computa KPIs consolidados a partir de transações e dos grupos marcados
 * como bloco de receita líquida.
 */
export function computeConsolidatedKPIs(
  transactions: TransactionLike[],
  netRevenueGroupNames: Set<string>
): ConsolidatedKPIs {
  const blockMap = new Map<string, NetRevenueBlockBreakdown>();
  const blockCategoryTotals = new Map<string, Map<string, { type: "receita" | "despesa"; amountCents: number }>>();

  let directReceitasCents = 0;
  let totalDespesasCents = 0;
  let totalInvestimentosCents = 0;

  for (const t of transactions) {
    if (t.type === "transferencia") continue;
    if (t.type === "investimento") {
      // Investimento NÃO entra em receita nem despesa nem em blocos de receita líquida —
      // é alocação de um ganho já computado e tem KPI próprio.
      totalInvestimentosCents += t.amount_cents;
      continue;
    }

    const groupName = t.categories?.category_group ?? null;
    const isNetBlock = groupName !== null && netRevenueGroupNames.has(groupName);

    if (isNetBlock) {
      const block = blockMap.get(groupName) ?? {
        groupName,
        grossReceitasCents: 0,
        grossDespesasCents: 0,
        netCents: 0,
        items: [],
      };

      if (t.type === "receita") {
        block.grossReceitasCents += t.amount_cents;
      } else {
        block.grossDespesasCents += t.amount_cents;
      }

      // Agrega por categoria dentro do bloco
      const catName = t.categories?.name ?? "Sem categoria";
      const catTotals = blockCategoryTotals.get(groupName) ?? new Map();
      const existing = catTotals.get(catName);
      if (existing) {
        existing.amountCents += t.amount_cents;
      } else {
        catTotals.set(catName, { type: t.type, amountCents: t.amount_cents });
      }
      blockCategoryTotals.set(groupName, catTotals);

      blockMap.set(groupName, block);
    } else {
      if (t.type === "receita") {
        directReceitasCents += t.amount_cents;
      } else {
        totalDespesasCents += t.amount_cents;
      }
    }
  }

  // Monta items e calcula líquido de cada bloco
  const netRevenueBlocks: NetRevenueBlockBreakdown[] = [];
  let blocksLiquidoTotal = 0;

  for (const block of blockMap.values()) {
    const catTotals = blockCategoryTotals.get(block.groupName) ?? new Map();
    block.items = Array.from(catTotals.entries())
      .map(([categoryName, { type, amountCents }]) => ({
        categoryName,
        type,
        amountCents,
      }))
      .sort((a, b) => {
        // Receitas primeiro, depois despesas por valor
        if (a.type !== b.type) return a.type === "receita" ? -1 : 1;
        return b.amountCents - a.amountCents;
      });
    block.netCents = block.grossReceitasCents - block.grossDespesasCents;
    netRevenueBlocks.push(block);
    blocksLiquidoTotal += block.netCents;
  }

  netRevenueBlocks.sort((a, b) => b.netCents - a.netCents);

  return {
    totalReceitasCents: directReceitasCents + blocksLiquidoTotal,
    totalDespesasCents,
    totalInvestimentosCents,
    netRevenueBlocks,
    directReceitasCents,
  };
}

/**
 * Variante para forecasts (`MonthForecast.byCategory`).
 * Trabalha com campo único `amount` escolhido pelo caller.
 */
export interface ForecastCategoryLike {
  categoryName: string;
  categoryGroup: string | null;
  type: "receita" | "despesa" | "investimento";
  amount: number;
}

export interface ConsolidatedForecastKPIs {
  totalReceitasCents: number;
  totalDespesasCents: number;
  totalInvestimentosCents: number;
  netRevenueBlocks: NetRevenueBlockBreakdown[];
}

export function computeConsolidatedForecastKPIs(
  categories: ForecastCategoryLike[],
  netRevenueGroupNames: Set<string>
): ConsolidatedForecastKPIs {
  const blockMap = new Map<string, NetRevenueBlockBreakdown>();

  let directReceitas = 0;
  let totalDespesas = 0;
  let totalInvestimentos = 0;

  for (const c of categories) {
    if (c.type === "investimento") {
      totalInvestimentos += c.amount;
      continue;
    }
    const isNetBlock = c.categoryGroup !== null && netRevenueGroupNames.has(c.categoryGroup);

    if (isNetBlock) {
      const groupName = c.categoryGroup as string;
      const block = blockMap.get(groupName) ?? {
        groupName,
        grossReceitasCents: 0,
        grossDespesasCents: 0,
        netCents: 0,
        items: [],
      };

      if (c.type === "receita") {
        block.grossReceitasCents += c.amount;
      } else {
        block.grossDespesasCents += c.amount;
      }

      block.items.push({
        categoryName: c.categoryName,
        type: c.type,
        amountCents: c.amount,
      });

      blockMap.set(groupName, block);
    } else {
      if (c.type === "receita") {
        directReceitas += c.amount;
      } else {
        totalDespesas += c.amount;
      }
    }
  }

  let blocksLiquidoTotal = 0;
  const netRevenueBlocks: NetRevenueBlockBreakdown[] = [];
  for (const block of blockMap.values()) {
    block.items.sort((a, b) => {
      if (a.type !== b.type) return a.type === "receita" ? -1 : 1;
      return b.amountCents - a.amountCents;
    });
    block.netCents = block.grossReceitasCents - block.grossDespesasCents;
    netRevenueBlocks.push(block);
    blocksLiquidoTotal += block.netCents;
  }

  netRevenueBlocks.sort((a, b) => b.netCents - a.netCents);

  return {
    totalReceitasCents: directReceitas + blocksLiquidoTotal,
    totalDespesasCents: totalDespesas,
    totalInvestimentosCents: totalInvestimentos,
    netRevenueBlocks,
  };
}

/**
 * Conveniência: filtra transações removendo as que pertencem a blocos
 * de receita líquida. Útil para gráficos de categorias e tabelas de
 * despesas da visão PF.
 */
export function filterOutNetRevenueBlocks<T extends { categories?: { category_group: string | null } | null }>(
  items: T[],
  netRevenueGroupNames: Set<string>
): T[] {
  return items.filter((i) => {
    const g = i.categories?.category_group ?? null;
    return !(g !== null && netRevenueGroupNames.has(g));
  });
}
