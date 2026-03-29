import { describe, it, expect } from "vitest";
import {
  getDebtProgress,
  getMonthlyInterestCost,
  getTimeToPayoff,
  getTotalInterestCost,
  getExtraPaymentSavings,
  getDebtStatus,
} from "./debt-utils";
import type { Debt } from "@/types/database";

function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: "d1",
    user_id: "u1",
    name: "Empréstimo",
    type: "emprestimo",
    original_amount_cents: 1000000, // R$ 10.000
    remaining_amount_cents: 500000,  // R$ 5.000
    monthly_payment_cents: 100000,   // R$ 1.000
    interest_rate_monthly: 2,        // 2% a.m.
    start_date: "2025-01-01",
    due_date: "2027-01-01",
    total_installments: 12,
    paid_installments: 6,
    is_active: true,
    created_at: "2025-01-01",
    ...overrides,
  };
}

// ── getDebtProgress ─────────────────────────────────────────────

describe("getDebtProgress", () => {
  it("returns 50% when half paid", () => {
    const debt = makeDebt();
    expect(getDebtProgress(debt)).toBe(50);
  });

  it("returns 100 when original_amount_cents <= 0", () => {
    expect(getDebtProgress(makeDebt({ original_amount_cents: 0 }))).toBe(100);
  });

  it("returns 0 when nothing paid", () => {
    const debt = makeDebt({ remaining_amount_cents: 1000000 });
    expect(getDebtProgress(debt)).toBe(0);
  });

  it("clamps to 100 maximum", () => {
    const debt = makeDebt({ remaining_amount_cents: -500 });
    expect(getDebtProgress(debt)).toBe(100);
  });

  it("clamps to 0 minimum (remaining > original)", () => {
    const debt = makeDebt({ remaining_amount_cents: 1500000 });
    expect(getDebtProgress(debt)).toBe(0);
  });
});

// ── getMonthlyInterestCost ──────────────────────────────────────

describe("getMonthlyInterestCost", () => {
  it("calculates monthly interest correctly", () => {
    const debt = makeDebt(); // 500000 * 2/100 = 10000
    expect(getMonthlyInterestCost(debt)).toBe(10000);
  });

  it("returns 0 when rate is 0", () => {
    expect(getMonthlyInterestCost(makeDebt({ interest_rate_monthly: 0 }))).toBe(0);
  });

  it("returns 0 when remaining is 0", () => {
    expect(getMonthlyInterestCost(makeDebt({ remaining_amount_cents: 0 }))).toBe(0);
  });
});

// ── getTimeToPayoff ─────────────────────────────────────────────

describe("getTimeToPayoff", () => {
  it("returns 0 when balance is 0", () => {
    expect(getTimeToPayoff(makeDebt({ remaining_amount_cents: 0 }))).toBe(0);
  });

  it("returns null when payment is 0", () => {
    expect(getTimeToPayoff(makeDebt({ monthly_payment_cents: 0 }))).toBeNull();
  });

  it("returns null when payment doesnt cover interest", () => {
    // 500000 * 2% = 10000 interest, but payment is only 5000
    const debt = makeDebt({ monthly_payment_cents: 5000 });
    expect(getTimeToPayoff(debt)).toBeNull();
  });

  it("returns finite months for payable debt", () => {
    const debt = makeDebt(); // R$ 5000 remaining, 2%, R$ 1000/month
    const months = getTimeToPayoff(debt);
    expect(months).not.toBeNull();
    expect(months).toBeGreaterThan(0);
    expect(months).toBeLessThan(20);
  });

  it("returns exact months for 0% interest", () => {
    const debt = makeDebt({
      remaining_amount_cents: 500000,
      monthly_payment_cents: 100000,
      interest_rate_monthly: 0,
    });
    expect(getTimeToPayoff(debt)).toBe(5); // 500000 / 100000
  });
});

// ── getTotalInterestCost ────────────────────────────────────────

describe("getTotalInterestCost", () => {
  it("returns 0 for 0% interest", () => {
    expect(getTotalInterestCost(makeDebt({ interest_rate_monthly: 0 }))).toBe(0);
  });

  it("returns 0 for 0 balance", () => {
    expect(getTotalInterestCost(makeDebt({ remaining_amount_cents: 0 }))).toBe(0);
  });

  it("returns null when payment doesnt cover interest", () => {
    expect(getTotalInterestCost(makeDebt({ monthly_payment_cents: 5000 }))).toBeNull();
  });

  it("returns positive interest for payable debt", () => {
    const interest = getTotalInterestCost(makeDebt());
    expect(interest).not.toBeNull();
    expect(interest).toBeGreaterThan(0);
  });

  it("interest cost is consistent with time to payoff", () => {
    const debt = makeDebt();
    const months = getTimeToPayoff(debt)!;
    const interest = getTotalInterestCost(debt)!;
    // Total paid = months * payment, should equal remaining + interest
    const totalPaid = months * debt.monthly_payment_cents;
    // Allow rounding tolerance (last payment may be partial)
    expect(totalPaid).toBeGreaterThanOrEqual(debt.remaining_amount_cents + interest - debt.monthly_payment_cents);
  });
});

// ── getExtraPaymentSavings ──────────────────────────────────────

describe("getExtraPaymentSavings", () => {
  it("returns savings when extra payment is made", () => {
    const result = getExtraPaymentSavings(makeDebt(), 50000); // +R$500 extra
    expect(result).not.toBeNull();
    expect(result!.interestSaved).toBeGreaterThan(0);
    expect(result!.monthsSaved).toBeGreaterThan(0);
  });

  it("returns null for unpayable base debt", () => {
    const debt = makeDebt({ monthly_payment_cents: 5000 });
    expect(getExtraPaymentSavings(debt, 1000)).toBeNull();
  });

  it("returns null for zero balance", () => {
    expect(getExtraPaymentSavings(makeDebt({ remaining_amount_cents: 0 }), 50000)).toBeNull();
  });
});

// ── getDebtStatus ───────────────────────────────────────────────

describe("getDebtStatus", () => {
  it("returns 'Quitada' when remaining is 0", () => {
    const result = getDebtStatus(makeDebt({ remaining_amount_cents: 0 }));
    expect(result).toEqual({ label: "Quitada", color: "gray" });
  });

  it("returns 'Vencida' when past due_date", () => {
    const result = getDebtStatus(makeDebt({ due_date: "2020-01-01" }));
    expect(result).toEqual({ label: "Vencida", color: "red" });
  });

  it("returns 'Juros altos' when rate > 3%", () => {
    const result = getDebtStatus(makeDebt({ interest_rate_monthly: 5, due_date: "2030-01-01" }));
    expect(result).toEqual({ label: "Juros altos", color: "yellow" });
  });

  it("returns 'Em dia' for normal active debt", () => {
    const result = getDebtStatus(makeDebt({ interest_rate_monthly: 1, due_date: "2030-01-01" }));
    expect(result).toEqual({ label: "Em dia", color: "green" });
  });

  it("skips overdue check when due_date is null", () => {
    const result = getDebtStatus(makeDebt({ due_date: null, interest_rate_monthly: 1 }));
    expect(result).toEqual({ label: "Em dia", color: "green" });
  });
});
