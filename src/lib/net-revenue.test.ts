import { describe, it, expect } from "vitest";
import {
  computeConsolidatedKPIs,
  computeConsolidatedForecastKPIs,
  filterOutNetRevenueBlocks,
  type TransactionLike,
} from "./net-revenue";

function tx(
  type: "receita" | "despesa" | "transferencia",
  amount_cents: number,
  categoryName: string,
  categoryGroup: string | null
): TransactionLike {
  return {
    type,
    amount_cents,
    categories: { name: categoryName, category_group: categoryGroup },
  };
}

describe("computeConsolidatedKPIs", () => {
  it("caso 1: sem blocos net_revenue — soma tradicional", () => {
    const transactions: TransactionLike[] = [
      tx("receita", 500000, "Salário", "Receitas PF"),
      tx("despesa", 100000, "Aluguel", "Despesas Essenciais Fixas"),
      tx("despesa", 50000, "Mercado", "Variáveis Essenciais"),
    ];
    const result = computeConsolidatedKPIs(transactions, new Set());

    expect(result.totalReceitasCents).toBe(500000);
    expect(result.totalDespesasCents).toBe(150000);
    expect(result.netRevenueBlocks).toHaveLength(0);
    expect(result.directReceitasCents).toBe(500000);
  });

  it("caso 2: PJ positiva — líquido soma nas receitas, despesas PJ excluídas", () => {
    const transactions: TransactionLike[] = [
      tx("receita", 500000, "Salário", "Receitas PF"),
      tx("receita", 1000000, "PJ Serviços", "Pessoa Jurídica"),
      tx("despesa", 150000, "PJ Impostos", "Pessoa Jurídica"),
      tx("despesa", 30000, "PJ Contabilidade", "Pessoa Jurídica"),
      tx("despesa", 100000, "Aluguel", "Despesas Essenciais Fixas"),
    ];
    const result = computeConsolidatedKPIs(transactions, new Set(["Pessoa Jurídica"]));

    // 500.000 (salário) + (1.000.000 − 150.000 − 30.000) = 500.000 + 820.000 = 1.320.000
    expect(result.totalReceitasCents).toBe(1320000);
    // Despesas PJ não entram; só aluguel
    expect(result.totalDespesasCents).toBe(100000);
    expect(result.directReceitasCents).toBe(500000);
    expect(result.netRevenueBlocks).toHaveLength(1);

    const block = result.netRevenueBlocks[0];
    expect(block.groupName).toBe("Pessoa Jurídica");
    expect(block.grossReceitasCents).toBe(1000000);
    expect(block.grossDespesasCents).toBe(180000);
    expect(block.netCents).toBe(820000);
    expect(block.items).toHaveLength(3);
  });

  it("caso 3: PJ negativa — líquido reduz receitas", () => {
    const transactions: TransactionLike[] = [
      tx("receita", 500000, "Salário", "Receitas PF"),
      tx("receita", 100000, "PJ Serviços", "Pessoa Jurídica"),
      tx("despesa", 200000, "PJ Impostos", "Pessoa Jurídica"),
    ];
    const result = computeConsolidatedKPIs(transactions, new Set(["Pessoa Jurídica"]));

    // 500.000 + (100.000 − 200.000) = 500.000 − 100.000 = 400.000
    expect(result.totalReceitasCents).toBe(400000);
    expect(result.totalDespesasCents).toBe(0);
    expect(result.netRevenueBlocks[0].netCents).toBe(-100000);
  });

  it("caso 4: múltiplos blocos net_revenue", () => {
    const transactions: TransactionLike[] = [
      tx("receita", 100000, "Salário", "Receitas PF"),
      tx("receita", 500000, "PJ A Serviços", "PJ A"),
      tx("despesa", 50000, "PJ A Impostos", "PJ A"),
      tx("receita", 300000, "PJ B Serviços", "PJ B"),
      tx("despesa", 40000, "PJ B Impostos", "PJ B"),
    ];
    const result = computeConsolidatedKPIs(
      transactions,
      new Set(["PJ A", "PJ B"])
    );

    // 100.000 + (500.000 − 50.000) + (300.000 − 40.000) = 100.000 + 450.000 + 260.000 = 810.000
    expect(result.totalReceitasCents).toBe(810000);
    expect(result.totalDespesasCents).toBe(0);
    expect(result.netRevenueBlocks).toHaveLength(2);
    // Ordenado por netCents desc
    expect(result.netRevenueBlocks[0].groupName).toBe("PJ A");
    expect(result.netRevenueBlocks[0].netCents).toBe(450000);
    expect(result.netRevenueBlocks[1].groupName).toBe("PJ B");
    expect(result.netRevenueBlocks[1].netCents).toBe(260000);
  });

  it("caso 5: transferências são ignoradas", () => {
    const transactions: TransactionLike[] = [
      tx("receita", 500000, "Salário", "Receitas PF"),
      tx("transferencia", 100000, "Transf", null),
      tx("receita", 100000, "PJ Serviços", "Pessoa Jurídica"),
      tx("despesa", 20000, "PJ Impostos", "Pessoa Jurídica"),
    ];
    const result = computeConsolidatedKPIs(transactions, new Set(["Pessoa Jurídica"]));

    expect(result.totalReceitasCents).toBe(500000 + (100000 - 20000));
    expect(result.totalDespesasCents).toBe(0);
  });

  it("caso 6: agrega categorias dentro do bloco PJ", () => {
    const transactions: TransactionLike[] = [
      tx("receita", 100000, "PJ Serviços", "Pessoa Jurídica"),
      tx("receita", 200000, "PJ Serviços", "Pessoa Jurídica"), // mesma categoria
      tx("despesa", 50000, "PJ Impostos", "Pessoa Jurídica"),
    ];
    const result = computeConsolidatedKPIs(transactions, new Set(["Pessoa Jurídica"]));

    const block = result.netRevenueBlocks[0];
    expect(block.items).toHaveLength(2);
    const servicos = block.items.find((i) => i.categoryName === "PJ Serviços");
    expect(servicos?.amountCents).toBe(300000);
  });
});

describe("computeConsolidatedForecastKPIs", () => {
  it("aplica a mesma lógica sobre projeções", () => {
    const forecast = [
      { categoryName: "Salário", categoryGroup: "Receitas PF", type: "receita" as const, amount: 500000 },
      { categoryName: "PJ Serviços", categoryGroup: "Pessoa Jurídica", type: "receita" as const, amount: 1000000 },
      { categoryName: "PJ Impostos", categoryGroup: "Pessoa Jurídica", type: "despesa" as const, amount: 150000 },
      { categoryName: "Aluguel", categoryGroup: "Essencial", type: "despesa" as const, amount: 100000 },
    ];
    const result = computeConsolidatedForecastKPIs(forecast, new Set(["Pessoa Jurídica"]));

    expect(result.totalReceitasCents).toBe(500000 + (1000000 - 150000));
    expect(result.totalDespesasCents).toBe(100000);
    expect(result.netRevenueBlocks[0].netCents).toBe(850000);
  });
});

describe("filterOutNetRevenueBlocks", () => {
  it("remove itens de grupos marcados", () => {
    const items = [
      { categories: { category_group: "Pessoa Jurídica" } },
      { categories: { category_group: "Receitas PF" } },
      { categories: { category_group: null } },
      { categories: null },
    ];
    const result = filterOutNetRevenueBlocks(items, new Set(["Pessoa Jurídica"]));

    expect(result).toHaveLength(3);
  });

  it("retorna todos quando não há blocos marcados", () => {
    const items = [
      { categories: { category_group: "Pessoa Jurídica" } },
      { categories: { category_group: "Receitas PF" } },
    ];
    const result = filterOutNetRevenueBlocks(items, new Set());

    expect(result).toHaveLength(2);
  });
});
