import { describe, it, expect } from "vitest";
import { detectRecurrences } from "./recurrence-detection";
import type { Transaction, RecurringTransaction } from "@/types/database";

function makeTxn(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "t1",
    user_id: "u1",
    account_id: "a1",
    category_id: "c1",
    destination_account_id: null,
    type: "despesa",
    amount_cents: 10000,
    description: "Netflix",
    date: "2026-01-15",
    competency_month: null,
    created_at: "2026-01-15",
    ...overrides,
  };
}

function makeRecurring(overrides: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: "r1",
    user_id: "u1",
    account_id: "a1",
    category_id: "c1",
    destination_account_id: null,
    type: "despesa",
    amount_cents: 10000,
    description: "Netflix",
    day_of_month: 15,
    is_active: true,
    start_month: null,
    end_month: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

describe("detectRecurrences", () => {
  it("returns empty for no transactions", () => {
    expect(detectRecurrences([], [])).toEqual([]);
  });

  it("returns empty when all transactions are in same month", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-10" }),
      makeTxn({ id: "2", date: "2026-01-20" }),
    ];
    expect(detectRecurrences(txns, [])).toEqual([]);
  });

  it("detects recurring when 2+ months with consistent amount", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-15", amount_cents: 3990 }),
      makeTxn({ id: "2", date: "2026-02-15", amount_cents: 3990 }),
      makeTxn({ id: "3", date: "2026-03-15", amount_cents: 3990 }),
    ];
    const result = detectRecurrences(txns, []);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Netflix");
    expect(result[0].avgAmountCents).toBe(3990);
    expect(result[0].occurrences).toBe(3);
    expect(result[0].estimatedDay).toBe(15);
  });

  it("excludes transfers", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-10", type: "transferencia" }),
      makeTxn({ id: "2", date: "2026-02-10", type: "transferencia" }),
    ];
    expect(detectRecurrences(txns, [])).toEqual([]);
  });

  it("excludes already existing recurrings", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-15" }),
      makeTxn({ id: "2", date: "2026-02-15" }),
    ];
    const existing = [makeRecurring()]; // same description "Netflix"
    expect(detectRecurrences(txns, existing)).toEqual([]);
  });

  it("rejects inconsistent amounts (>10% variance)", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-15", amount_cents: 10000 }),
      makeTxn({ id: "2", date: "2026-02-15", amount_cents: 15000 }), // 50% diff
    ];
    expect(detectRecurrences(txns, [])).toEqual([]);
  });

  it("accepts amounts within 10% variance", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-15", amount_cents: 10000 }),
      makeTxn({ id: "2", date: "2026-02-15", amount_cents: 10500 }), // 5% diff
    ];
    const result = detectRecurrences(txns, []);
    expect(result).toHaveLength(1);
  });

  it("normalizes descriptions (accents, case, whitespace)", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-10", description: "Café da Manhã" }),
      makeTxn({ id: "2", date: "2026-02-10", description: "café  da  manhã" }),
      makeTxn({ id: "3", date: "2026-03-10", description: "CAFE DA MANHA" }),
    ];
    const result = detectRecurrences(txns, []);
    expect(result).toHaveLength(1);
    expect(result[0].occurrences).toBe(3);
  });

  it("returns top 5 sorted by frequency", () => {
    const txns: Transaction[] = [];
    const names = ["A", "B", "C", "D", "E", "F"];
    for (let i = 0; i < names.length; i++) {
      const count = names.length - i; // A=6, B=5, ..., F=1
      for (let m = 0; m < count; m++) {
        txns.push(
          makeTxn({
            id: `${names[i]}-${m}`,
            description: names[i],
            date: `2026-${String(m + 1).padStart(2, "0")}-10`,
          })
        );
      }
    }
    const result = detectRecurrences(txns, []);
    expect(result).toHaveLength(5);
    expect(result[0].description).toBe("A"); // most frequent
  });

  it("detects most common day of month", () => {
    const txns = [
      makeTxn({ id: "1", date: "2026-01-05" }),
      makeTxn({ id: "2", date: "2026-02-05" }),
      makeTxn({ id: "3", date: "2026-03-07" }), // different day
    ];
    const result = detectRecurrences(txns, []);
    expect(result[0].estimatedDay).toBe(5); // 5 appears 2x vs 7 appears 1x
  });
});
