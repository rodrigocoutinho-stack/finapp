import { describe, it, expect } from "vitest";
import {
  getProductLabel,
  getIndexerLabel,
  getGroupLabel,
  getInvestmentGroup,
  calculateInvestmentBalance,
  getMonthEndBalance,
} from "./investment-utils";
import type { InvestmentEntry } from "@/types/database";

function makeEntry(overrides: Partial<InvestmentEntry> = {}): InvestmentEntry {
  return {
    id: "e1",
    user_id: "u1",
    investment_id: "inv1",
    type: "aporte",
    amount_cents: 100000,
    date: "2026-01-15",
    notes: null,
    created_at: "2026-01-15",
    ...overrides,
  };
}

// ── Label functions ─────────────────────────────────────────────

describe("getProductLabel", () => {
  it("returns localized product names", () => {
    expect(getProductLabel("cdb")).toBe("CDB");
    expect(getProductLabel("tesouro_ipca")).toBe("Tesouro IPCA+");
    expect(getProductLabel("acao")).toBe("Ação");
  });
});

describe("getIndexerLabel", () => {
  it("returns localized indexer names", () => {
    expect(getIndexerLabel("cdi")).toBe("CDI");
    expect(getIndexerLabel("ipca")).toBe("IPCA+");
  });
});

describe("getGroupLabel", () => {
  it("returns localized group names", () => {
    expect(getGroupLabel("pos_fixado")).toBe("Pós-fixado (CDI/Selic)");
    expect(getGroupLabel("renda_variavel")).toBe("Renda Variável");
  });
});

// ── getInvestmentGroup ──────────────────────────────────────────

describe("getInvestmentGroup", () => {
  it("classifies acao as renda_variavel", () => {
    expect(getInvestmentGroup("acao", "ibovespa")).toBe("renda_variavel");
  });

  it("classifies fii as renda_variavel", () => {
    expect(getInvestmentGroup("fii", "outro")).toBe("renda_variavel");
  });

  it("classifies fundo as fundos", () => {
    expect(getInvestmentGroup("fundo", "cdi")).toBe("fundos");
  });

  it("classifies ipca indexer as inflacao", () => {
    expect(getInvestmentGroup("cdb", "ipca")).toBe("inflacao");
    expect(getInvestmentGroup("tesouro_ipca", "ipca")).toBe("inflacao");
  });

  it("classifies prefixado indexer as pre_fixado", () => {
    expect(getInvestmentGroup("tesouro_prefixado", "prefixado")).toBe("pre_fixado");
  });

  it("classifies cdi/selic as pos_fixado", () => {
    expect(getInvestmentGroup("cdb", "cdi")).toBe("pos_fixado");
    expect(getInvestmentGroup("tesouro_selic", "selic")).toBe("pos_fixado");
  });

  it("returns outros for unknown combinations", () => {
    expect(getInvestmentGroup("outro", "outro")).toBe("outros");
  });
});

// ── calculateInvestmentBalance ──────────────────────────────────

describe("calculateInvestmentBalance", () => {
  it("returns 0 for no entries", () => {
    expect(calculateInvestmentBalance([], "2026-12-31")).toBe(0);
  });

  it("sums aportes", () => {
    const entries = [
      makeEntry({ id: "1", amount_cents: 50000, date: "2026-01-10" }),
      makeEntry({ id: "2", amount_cents: 30000, date: "2026-02-10" }),
    ];
    expect(calculateInvestmentBalance(entries, "2026-12-31")).toBe(80000);
  });

  it("subtracts resgates", () => {
    const entries = [
      makeEntry({ id: "1", type: "aporte", amount_cents: 100000, date: "2026-01-10" }),
      makeEntry({ id: "2", type: "resgate", amount_cents: 30000, date: "2026-02-10" }),
    ];
    expect(calculateInvestmentBalance(entries, "2026-12-31")).toBe(70000);
  });

  it("uses latest saldo entry when available", () => {
    const entries = [
      makeEntry({ id: "1", type: "aporte", amount_cents: 100000, date: "2026-01-10" }),
      makeEntry({ id: "2", type: "saldo", amount_cents: 120000, date: "2026-03-01" }),
      makeEntry({ id: "3", type: "aporte", amount_cents: 50000, date: "2026-02-10" }),
    ];
    expect(calculateInvestmentBalance(entries, "2026-12-31")).toBe(120000);
  });

  it("ignores entries after upToDate", () => {
    const entries = [
      makeEntry({ id: "1", amount_cents: 50000, date: "2026-01-10" }),
      makeEntry({ id: "2", amount_cents: 30000, date: "2026-06-10" }),
    ];
    expect(calculateInvestmentBalance(entries, "2026-03-31")).toBe(50000);
  });

  it("clamps negative balance to 0", () => {
    const entries = [
      makeEntry({ id: "1", type: "aporte", amount_cents: 10000, date: "2026-01-10" }),
      makeEntry({ id: "2", type: "resgate", amount_cents: 50000, date: "2026-02-10" }),
    ];
    expect(calculateInvestmentBalance(entries, "2026-12-31")).toBe(0);
  });

  it("uses latest saldo and ignores earlier saldos", () => {
    const entries = [
      makeEntry({ id: "1", type: "saldo", amount_cents: 80000, date: "2026-01-31" }),
      makeEntry({ id: "2", type: "saldo", amount_cents: 95000, date: "2026-02-28" }),
    ];
    expect(calculateInvestmentBalance(entries, "2026-12-31")).toBe(95000);
  });
});

// ── getMonthEndBalance ──────────────────────────────────────────

describe("getMonthEndBalance", () => {
  it("uses last day of month as upToDate", () => {
    const entries = [
      makeEntry({ id: "1", amount_cents: 100000, date: "2026-01-15" }),
      makeEntry({ id: "2", amount_cents: 50000, date: "2026-02-10" }),
    ];
    // January end: only first entry
    expect(getMonthEndBalance(entries, "2026-01")).toBe(100000);
    // February end: both entries
    expect(getMonthEndBalance(entries, "2026-02")).toBe(150000);
  });

  it("handles February correctly", () => {
    const entries = [
      makeEntry({ id: "1", amount_cents: 100000, date: "2026-02-28" }),
    ];
    expect(getMonthEndBalance(entries, "2026-02")).toBe(100000);
  });

  it("returns 0 for empty entries", () => {
    expect(getMonthEndBalance([], "2026-01")).toBe(0);
  });
});
