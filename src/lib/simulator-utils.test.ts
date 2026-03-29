import { describe, it, expect } from "vitest";
import {
  fiSimulation,
  compoundInterest,
  inflationImpact,
  opportunityCost,
} from "./simulator-utils";

// ── compoundInterest ────────────────────────────────────────────

describe("compoundInterest", () => {
  it("accumulates principal without rate", () => {
    const result = compoundInterest(1000, 0, 12, 100);
    expect(result.finalAmount).toBe(2200); // 1000 + 12 * 100
    expect(result.totalInvested).toBe(2200);
    expect(result.totalInterest).toBe(0);
  });

  it("grows principal with interest and no contribution", () => {
    const result = compoundInterest(10000, 1, 12, 0);
    // 10000 * (1.01)^12 ≈ 11268.25
    expect(result.finalAmount).toBeCloseTo(11268.25, 0);
    expect(result.totalInvested).toBe(10000);
    expect(result.totalInterest).toBeGreaterThan(1200);
  });

  it("generates correct number of data points", () => {
    const result = compoundInterest(0, 1, 24, 500);
    expect(result.monthlyData).toHaveLength(25); // month 0 + 24 months
    expect(result.monthlyData[0].month).toBe(0);
    expect(result.monthlyData[24].month).toBe(24);
  });

  it("handles zero months", () => {
    const result = compoundInterest(1000, 1, 0, 100);
    expect(result.finalAmount).toBe(1000);
    expect(result.monthlyData).toHaveLength(1);
  });

  it("tracks invested vs interest separately", () => {
    const result = compoundInterest(1000, 1, 6, 200);
    const lastPoint = result.monthlyData[6];
    expect(lastPoint.invested).toBe(1000 + 6 * 200); // 2200
    expect(lastPoint.total).toBeGreaterThan(lastPoint.invested);
    expect(lastPoint.interest).toBeGreaterThan(0);
  });
});

// ── inflationImpact ─────────────────────────────────────────────

describe("inflationImpact", () => {
  it("preserves nominal value", () => {
    const result = inflationImpact(1000, 5, 10);
    expect(result.futureNominal).toBe(1000);
  });

  it("reduces real value over time", () => {
    const result = inflationImpact(1000, 5, 10);
    expect(result.futureReal).toBeLessThan(1000);
    // 1000 / (1.05)^10 ≈ 613.91
    expect(result.futureReal).toBeCloseTo(613.91, 0);
  });

  it("calculates purchasing power loss", () => {
    const result = inflationImpact(1000, 5, 10);
    expect(result.purchasingPowerLoss).toBeCloseTo(1000 - 613.91, 0);
  });

  it("generates correct data points", () => {
    const result = inflationImpact(1000, 5, 5);
    expect(result.yearlyData).toHaveLength(6); // year 0 + 5 years
    expect(result.yearlyData[0].realValue).toBe(1000);
  });

  it("returns no loss for 0% inflation", () => {
    const result = inflationImpact(1000, 0, 10);
    expect(result.futureReal).toBe(1000);
    expect(result.purchasingPowerLoss).toBe(0);
  });

  it("handles zero years", () => {
    const result = inflationImpact(1000, 5, 0);
    expect(result.yearlyData).toHaveLength(1);
    expect(result.futureReal).toBe(1000);
  });
});

// ── opportunityCost ─────────────────────────────────────────────

describe("opportunityCost", () => {
  it("equals totalSpent when rate is 0", () => {
    const result = opportunityCost(100, 0, 5);
    expect(result.couldHaveBeen).toBe(result.totalSpent);
    expect(result.difference).toBe(0);
  });

  it("grows invested amount with rate", () => {
    const result = opportunityCost(500, 0.8, 10);
    expect(result.couldHaveBeen).toBeGreaterThan(result.totalSpent);
    expect(result.difference).toBeGreaterThan(0);
  });

  it("totalSpent equals monthly * months", () => {
    const result = opportunityCost(200, 1, 3);
    expect(result.totalSpent).toBe(200 * 36); // 3 years * 12 months
  });

  it("generates correct data points", () => {
    const result = opportunityCost(100, 0.5, 5);
    expect(result.yearlyData).toHaveLength(6);
    expect(result.yearlyData[0].totalSpent).toBe(0);
    expect(result.yearlyData[0].couldHaveBeen).toBe(0);
  });
});

// ── fiSimulation ────────────────────────────────────────────────

describe("fiSimulation", () => {
  it("calculates target patrimony from SWR", () => {
    // R$5000/month * 12 / 4% = R$1.500.000
    const result = fiSimulation(5000, 0, 1000, 4, 5);
    expect(result.targetPatrimony).toBe(1500000);
  });

  it("returns 3 scenarios", () => {
    const result = fiSimulation(5000, 100000, 2000, 4, 6);
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios[0].label).toBe("Conservador");
    expect(result.scenarios[1].label).toBe("Base");
    expect(result.scenarios[2].label).toBe("Otimista");
  });

  it("optimistic reaches target faster than conservative", () => {
    const result = fiSimulation(5000, 100000, 3000, 4, 6);
    const [cons, , opt] = result.scenarios;
    if (cons.yearsToTarget !== null && opt.yearsToTarget !== null) {
      expect(opt.yearsToTarget).toBeLessThanOrEqual(cons.yearsToTarget);
    }
  });

  it("returns 0 target when SWR is 0", () => {
    const result = fiSimulation(5000, 100000, 1000, 0, 5);
    expect(result.targetPatrimony).toBe(0);
  });

  it("calculates current progress", () => {
    // 500k out of 1.5M target
    const result = fiSimulation(5000, 500000, 1000, 4, 5);
    expect(result.currentProgress).toBeCloseTo(500000 / 1500000, 4);
  });

  it("generates 61 yearly data points (0 to 60)", () => {
    const result = fiSimulation(5000, 0, 1000, 4, 5);
    expect(result.yearlyData).toHaveLength(61);
    expect(result.yearlyData[0].year).toBe(0);
    expect(result.yearlyData[60].year).toBe(60);
  });

  it("conservative return = base - 2, optimistic = base + 2", () => {
    const result = fiSimulation(5000, 0, 1000, 4, 8);
    expect(result.scenarios[0].annualRealReturn).toBe(6);
    expect(result.scenarios[1].annualRealReturn).toBe(8);
    expect(result.scenarios[2].annualRealReturn).toBe(10);
  });

  it("conservative return floors at 0", () => {
    const result = fiSimulation(5000, 0, 1000, 4, 1);
    expect(result.scenarios[0].annualRealReturn).toBe(0); // max(0, 1-2)
  });
});
