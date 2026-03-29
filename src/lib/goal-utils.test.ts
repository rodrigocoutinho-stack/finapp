import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getGoalProgress,
  getGoalProgressPercent,
  getExpectedProgressPercent,
  getRequiredMonthlyContribution,
  getGoalStatus,
  getMonthsRemaining,
} from "./goal-utils";
import type { Goal, Account } from "@/types/database";

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    user_id: "u1",
    name: "Viagem",
    target_cents: 1000000, // R$ 10.000
    current_cents: 500000,  // R$ 5.000
    deadline: "2027-06-01",
    horizon: "medium",
    priority: 1,
    account_id: null,
    icon: "default",
    color: "emerald",
    is_active: true,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    user_id: "u1",
    name: "Poupança",
    type: "banco",
    balance_cents: 750000,
    initial_balance_cents: 0,
    is_emergency_reserve: false,
    account_group: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

// ── getGoalProgress ─────────────────────────────────────────────

describe("getGoalProgress", () => {
  it("returns current_cents when no account_id", () => {
    const goal = makeGoal();
    expect(getGoalProgress(goal, [])).toBe(500000);
  });

  it("returns account balance when account_id matches", () => {
    const goal = makeGoal({ account_id: "a1" });
    const accounts = [makeAccount({ id: "a1", balance_cents: 750000 })];
    expect(getGoalProgress(goal, accounts)).toBe(750000);
  });

  it("falls back to current_cents when account not found", () => {
    const goal = makeGoal({ account_id: "missing" });
    expect(getGoalProgress(goal, [])).toBe(500000);
  });

  it("clamps negative account balance to 0", () => {
    const goal = makeGoal({ account_id: "a1" });
    const accounts = [makeAccount({ id: "a1", balance_cents: -5000 })];
    expect(getGoalProgress(goal, accounts)).toBe(0);
  });
});

// ── getGoalProgressPercent ──────────────────────────────────────

describe("getGoalProgressPercent", () => {
  it("returns 50% when half achieved", () => {
    const goal = makeGoal({ current_cents: 500000, target_cents: 1000000 });
    expect(getGoalProgressPercent(goal, [])).toBe(50);
  });

  it("returns 0 when target is 0", () => {
    expect(getGoalProgressPercent(makeGoal({ target_cents: 0 }), [])).toBe(0);
  });

  it("can exceed 100%", () => {
    const goal = makeGoal({ current_cents: 1500000, target_cents: 1000000 });
    expect(getGoalProgressPercent(goal, [])).toBe(150);
  });
});

// ── getExpectedProgressPercent ───────────────────────────────────

describe("getExpectedProgressPercent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 50% at midpoint", () => {
    vi.setSystemTime(new Date("2026-07-01")); // midpoint of Jan 1 → Jan 1 next year
    const goal = makeGoal({
      created_at: "2026-01-01",
      deadline: "2027-01-01",
    });
    const result = getExpectedProgressPercent(goal);
    expect(result).toBeCloseTo(50, 0);
  });

  it("returns 100 when deadline has passed", () => {
    vi.setSystemTime(new Date("2028-01-01"));
    const goal = makeGoal({ deadline: "2027-01-01" });
    expect(getExpectedProgressPercent(goal)).toBe(100);
  });

  it("returns 0 at creation time", () => {
    vi.setSystemTime(new Date("2026-01-01"));
    const goal = makeGoal({ created_at: "2026-01-01", deadline: "2027-01-01" });
    expect(getExpectedProgressPercent(goal)).toBeCloseTo(0, 0);
  });

  it("returns 100 when totalDays <= 0", () => {
    vi.setSystemTime(new Date("2026-06-01"));
    const goal = makeGoal({ created_at: "2026-06-01", deadline: "2026-06-01" });
    expect(getExpectedProgressPercent(goal)).toBe(100);
  });
});

// ── getRequiredMonthlyContribution ──────────────────────────────

describe("getRequiredMonthlyContribution", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 when goal is already reached", () => {
    const goal = makeGoal({ current_cents: 1000000, target_cents: 1000000 });
    expect(getRequiredMonthlyContribution(goal, [])).toBe(0);
  });

  it("returns remaining when deadline has passed", () => {
    vi.setSystemTime(new Date("2028-01-01"));
    const goal = makeGoal({ current_cents: 500000, target_cents: 1000000, deadline: "2027-01-01" });
    expect(getRequiredMonthlyContribution(goal, [])).toBe(500000);
  });

  it("divides remaining by months left", () => {
    vi.setSystemTime(new Date("2026-01-01"));
    const goal = makeGoal({
      current_cents: 0,
      target_cents: 1200000,
      deadline: "2027-01-01", // 12 months away
    });
    expect(getRequiredMonthlyContribution(goal, [])).toBe(100000); // 1.2M / 12
  });
});

// ── getGoalStatus ───────────────────────────────────────────────

describe("getGoalStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'Concluída' when progress >= 100%", () => {
    const goal = makeGoal({ current_cents: 1000000, target_cents: 1000000 });
    expect(getGoalStatus(goal, [])).toEqual({ label: "Concluída", color: "gray" });
  });

  it("returns 'Vencida' when past deadline and not complete", () => {
    vi.setSystemTime(new Date("2028-01-01"));
    const goal = makeGoal({ current_cents: 500000, deadline: "2027-01-01" });
    expect(getGoalStatus(goal, [])).toEqual({ label: "Vencida", color: "red" });
  });
});

// ── getMonthsRemaining ──────────────────────────────────────────

describe("getMonthsRemaining", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns months until deadline", () => {
    vi.setSystemTime(new Date("2026-01-15"));
    const goal = makeGoal({ deadline: "2027-01-01" });
    // Jan 15 → Jan 1 next year = 12 month diff, but getMonth diff is 11 (Feb-Dec + Jan)
    expect(getMonthsRemaining(goal)).toBe(11);
  });

  it("returns 0 when deadline has passed", () => {
    vi.setSystemTime(new Date("2028-01-01"));
    const goal = makeGoal({ deadline: "2027-06-01" });
    expect(getMonthsRemaining(goal)).toBe(0);
  });
});
