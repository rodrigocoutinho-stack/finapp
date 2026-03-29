import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  toCents,
  formatDate,
  getMonthRange,
  getMonthName,
  isRecurringActiveInMonth,
  formatMonthLabel,
  groupAccountsByGroup,
  buildGroupedAccountOptions,
} from "./utils";
import type { Account } from "@/types/database";

// ── formatCurrency ──────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats positive cents to BRL", () => {
    expect(formatCurrency(15050)).toBe("R$\u00a0150,50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
  });

  it("formats negative cents", () => {
    const result = formatCurrency(-15050);
    expect(result).toContain("150,50");
  });

  it("formats large amounts", () => {
    const result = formatCurrency(10000000); // R$ 100.000,00
    expect(result).toContain("100.000,00");
  });
});

// ── toCents ─────────────────────────────────────────────────────

describe("toCents", () => {
  it("converts number to cents", () => {
    expect(toCents(150.5)).toBe(15050);
  });

  it("rounds floating point correctly", () => {
    expect(toCents(10.99)).toBe(1099);
    expect(toCents(0.01)).toBe(1);
  });

  it("converts string with comma (pt-BR format)", () => {
    expect(toCents("150,50")).toBe(15050);
  });

  it("converts string with dot", () => {
    expect(toCents("150.50")).toBe(15050);
  });

  it("returns 0 for empty string", () => {
    expect(toCents("")).toBe(0);
  });

  it("returns 0 for NaN number", () => {
    expect(toCents(NaN)).toBe(0);
  });

  it("returns 0 for non-numeric string", () => {
    expect(toCents("abc")).toBe(0);
  });

  it("handles negative values", () => {
    expect(toCents(-50.25)).toBe(-5025);
    expect(toCents("-50,25")).toBe(-5025);
  });

  it("strips currency symbols", () => {
    // toCents strips non-digit chars except comma/dot/minus, so "1.500,00" → "1.500.00" → 1.5
    // The function handles single comma as decimal separator, not thousands separator with dots
    // This is a known limitation — toCents is for form input values, not formatted display strings
    expect(toCents("R$ 1500,00")).toBe(150000);
  });
});

// ── formatDate ──────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats string date to dd/mm/aaaa", () => {
    expect(formatDate("2026-03-15")).toBe("15/03/2026");
  });

  it("formats Date object", () => {
    expect(formatDate(new Date(2026, 2, 15))).toBe("15/03/2026");
  });
});

// ── getMonthRange ───────────────────────────────────────────────

describe("getMonthRange", () => {
  it("returns calendar month for closingDay=1", () => {
    const r = getMonthRange(2026, 2, 1);
    expect(r.start).toBe("2026-03-01");
    expect(r.end).toBe("2026-03-31");
  });

  it("defaults closingDay to 1", () => {
    const r = getMonthRange(2026, 2);
    expect(r.start).toBe("2026-03-01");
    expect(r.end).toBe("2026-03-31");
  });

  it("delegates to getCompetencyRange for closingDay > 1", () => {
    const r = getMonthRange(2026, 1, 10);
    expect(r.start).toBe("2026-02-10");
    expect(r.end).toBe("2026-03-09");
  });

  it("handles February non-leap year", () => {
    const r = getMonthRange(2026, 1, 1);
    expect(r.end).toBe("2026-02-28");
  });
});

// ── getMonthName ────────────────────────────────────────────────

describe("getMonthName", () => {
  it("returns Portuguese month names", () => {
    expect(getMonthName(0)).toBe("Janeiro");
    expect(getMonthName(5)).toBe("Junho");
    expect(getMonthName(11)).toBe("Dezembro");
  });
});

// ── isRecurringActiveInMonth ────────────────────────────────────

describe("isRecurringActiveInMonth", () => {
  it("returns true when both bounds are null (always active)", () => {
    expect(
      isRecurringActiveInMonth({ start_month: null, end_month: null }, "2026-03")
    ).toBe(true);
  });

  it("returns false when target is before start_month", () => {
    expect(
      isRecurringActiveInMonth({ start_month: "2026-04", end_month: null }, "2026-03")
    ).toBe(false);
  });

  it("returns false when target is after end_month", () => {
    expect(
      isRecurringActiveInMonth({ start_month: null, end_month: "2026-02" }, "2026-03")
    ).toBe(false);
  });

  it("returns true when target equals start_month", () => {
    expect(
      isRecurringActiveInMonth({ start_month: "2026-03", end_month: null }, "2026-03")
    ).toBe(true);
  });

  it("returns true when target equals end_month", () => {
    expect(
      isRecurringActiveInMonth({ start_month: null, end_month: "2026-03" }, "2026-03")
    ).toBe(true);
  });

  it("returns true when target is within range", () => {
    expect(
      isRecurringActiveInMonth({ start_month: "2026-01", end_month: "2026-06" }, "2026-03")
    ).toBe(true);
  });
});

// ── formatMonthLabel ────────────────────────────────────────────

describe("formatMonthLabel", () => {
  it("converts YYYY-MM to short pt-BR label", () => {
    expect(formatMonthLabel("2026-01")).toBe("jan/2026");
    expect(formatMonthLabel("2026-04")).toBe("abr/2026");
    expect(formatMonthLabel("2026-12")).toBe("dez/2026");
  });
});

// ── groupAccountsByGroup ────────────────────────────────────────

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    user_id: "u1",
    name: "Conta",
    type: "banco",
    balance_cents: 0,
    initial_balance_cents: 0,
    is_emergency_reserve: false,
    account_group: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

describe("groupAccountsByGroup", () => {
  it("returns empty array for empty input", () => {
    expect(groupAccountsByGroup([])).toEqual([]);
  });

  it("groups all null accounts under 'Geral'", () => {
    const accounts = [makeAccount({ id: "1" }), makeAccount({ id: "2" })];
    const result = groupAccountsByGroup(accounts);
    expect(result).toHaveLength(1);
    expect(result[0][0]).toBe("Geral");
    expect(result[0][1]).toHaveLength(2);
  });

  it("sorts alphabetically with 'Geral' last", () => {
    const accounts = [
      makeAccount({ id: "1", account_group: "PJ" }),
      makeAccount({ id: "2", account_group: null }),
      makeAccount({ id: "3", account_group: "PF" }),
    ];
    const result = groupAccountsByGroup(accounts);
    expect(result.map(([g]) => g)).toEqual(["PF", "PJ", "Geral"]);
  });
});

// ── buildGroupedAccountOptions ──────────────────────────────────

describe("buildGroupedAccountOptions", () => {
  it("returns only options when single group", () => {
    const accounts = [makeAccount({ id: "1", name: "C1" })];
    const result = buildGroupedAccountOptions(accounts);
    expect(result.options).toHaveLength(1);
    expect(result.groupedOptions).toBeUndefined();
  });

  it("returns groupedOptions when 2+ groups", () => {
    const accounts = [
      makeAccount({ id: "1", name: "C1", account_group: "PF" }),
      makeAccount({ id: "2", name: "C2", account_group: "PJ" }),
    ];
    const result = buildGroupedAccountOptions(accounts);
    expect(result.groupedOptions).toBeDefined();
    expect(result.groupedOptions).toHaveLength(2);
  });

  it("accepts custom labelFn", () => {
    const accounts = [makeAccount({ id: "1", name: "Nubank", type: "banco" })];
    const result = buildGroupedAccountOptions(accounts, (a) => `${a.name} (${a.type})`);
    expect(result.options[0].label).toBe("Nubank (banco)");
  });
});
