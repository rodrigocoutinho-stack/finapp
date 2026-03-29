import { describe, it, expect } from "vitest";
import {
  getCompetencyRange,
  getCurrentCompetencyMonth,
  getCompetencyDayCount,
  getElapsedDays,
  getRecurringDateInCompetency,
  getCompetencyDays,
  getCompetencyLabel,
} from "./closing-day";

// ── getCompetencyRange ──────────────────────────────────────────

describe("getCompetencyRange", () => {
  it("returns standard calendar month when closingDay <= 1", () => {
    const r = getCompetencyRange(2026, 2, 1); // March 2026
    expect(r.start).toBe("2026-03-01");
    expect(r.end).toBe("2026-03-31");
  });

  it("returns standard calendar month for closingDay = 0", () => {
    const r = getCompetencyRange(2026, 1, 0); // Feb 2026
    expect(r.start).toBe("2026-02-01");
    expect(r.end).toBe("2026-02-28");
  });

  it("handles February in a leap year (closingDay=1)", () => {
    const r = getCompetencyRange(2028, 1, 1); // Feb 2028 (leap)
    expect(r.end).toBe("2028-02-29");
  });

  it("returns competency range for closingDay=10", () => {
    const r = getCompetencyRange(2026, 1, 10); // "February" competency
    expect(r.start).toBe("2026-02-10");
    expect(r.end).toBe("2026-03-09");
  });

  it("handles December → January transition", () => {
    const r = getCompetencyRange(2026, 11, 15); // "December" competency
    expect(r.start).toBe("2026-12-15");
    expect(r.end).toBe("2027-01-14");
  });

  it("handles closingDay=28", () => {
    const r = getCompetencyRange(2026, 0, 28); // "January" competency
    expect(r.start).toBe("2026-01-28");
    expect(r.end).toBe("2026-02-27");
  });
});

// ── getCurrentCompetencyMonth ───────────────────────────────────

describe("getCurrentCompetencyMonth", () => {
  it("returns current month when day >= closingDay", () => {
    const today = new Date(2026, 2, 15); // Mar 15
    const result = getCurrentCompetencyMonth(10, today);
    expect(result).toEqual({ year: 2026, month: 2 }); // March
  });

  it("returns previous month when day < closingDay", () => {
    const today = new Date(2026, 2, 5); // Mar 5
    const result = getCurrentCompetencyMonth(10, today);
    expect(result).toEqual({ year: 2026, month: 1 }); // February
  });

  it("returns current month when closingDay=1", () => {
    const today = new Date(2026, 2, 1); // Mar 1
    const result = getCurrentCompetencyMonth(1, today);
    expect(result).toEqual({ year: 2026, month: 2 }); // March
  });

  it("wraps year when day < closingDay in January", () => {
    const today = new Date(2026, 0, 5); // Jan 5
    const result = getCurrentCompetencyMonth(15, today);
    expect(result).toEqual({ year: 2025, month: 11 }); // December 2025
  });

  it("handles exact closingDay", () => {
    const today = new Date(2026, 5, 10); // Jun 10
    const result = getCurrentCompetencyMonth(10, today);
    expect(result).toEqual({ year: 2026, month: 5 }); // June
  });
});

// ── getCompetencyDayCount ───────────────────────────────────────

describe("getCompetencyDayCount", () => {
  it("returns 31 for January (closingDay=1)", () => {
    expect(getCompetencyDayCount(2026, 0, 1)).toBe(31);
  });

  it("returns 28 for February 2026 (non-leap, closingDay=1)", () => {
    expect(getCompetencyDayCount(2026, 1, 1)).toBe(28);
  });

  it("returns 29 for February 2028 (leap, closingDay=1)", () => {
    expect(getCompetencyDayCount(2028, 1, 1)).toBe(29);
  });

  it("returns correct count for closingDay=10 (Feb 10 - Mar 9)", () => {
    // Feb 10 to Mar 9 = 19 days in Feb + 9 days in Mar = 28 days
    expect(getCompetencyDayCount(2026, 1, 10)).toBe(28);
  });
});

// ── getElapsedDays ──────────────────────────────────────────────

describe("getElapsedDays", () => {
  it("returns 1 on the first day of the period", () => {
    const today = new Date(2026, 2, 1); // Mar 1
    expect(getElapsedDays(2026, 2, 1, today)).toBe(1);
  });

  it("returns full count on last day", () => {
    const today = new Date(2026, 2, 31); // Mar 31
    expect(getElapsedDays(2026, 2, 1, today)).toBe(31);
  });

  it("returns 0 when today is before the period", () => {
    const today = new Date(2026, 1, 28); // Feb 28 (before Mar 1)
    expect(getElapsedDays(2026, 2, 1, today)).toBe(0);
  });

  it("works with custom closingDay", () => {
    const today = new Date(2026, 1, 12); // Feb 12
    // Competency "February" with closingDay=10: Feb 10 - Mar 9
    expect(getElapsedDays(2026, 1, 10, today)).toBe(3); // Feb 10,11,12
  });
});

// ── getRecurringDateInCompetency ────────────────────────────────

describe("getRecurringDateInCompetency", () => {
  it("places day in standard month for closingDay=1", () => {
    expect(getRecurringDateInCompetency(15, 2026, 2, 1)).toBe("2026-03-15");
  });

  it("returns null for day 31 in February (closingDay=1)", () => {
    expect(getRecurringDateInCompetency(31, 2026, 1, 1)).toBeNull();
  });

  it("places day >= closingDay in calendar month M", () => {
    // closingDay=10, competency Feb: Feb 10 – Mar 9
    // day 15 >= 10 → Feb 15
    expect(getRecurringDateInCompetency(15, 2026, 1, 10)).toBe("2026-02-15");
  });

  it("places day < closingDay in calendar month M+1", () => {
    // closingDay=10, competency Feb: Feb 10 – Mar 9
    // day 5 < 10 → Mar 5
    expect(getRecurringDateInCompetency(5, 2026, 1, 10)).toBe("2026-03-05");
  });

  it("returns null for day 31 when target month has 30 days", () => {
    // closingDay=10, competency March: Mar 10 – Apr 9
    // day 31 >= 10 → Mar 31 (exists)
    expect(getRecurringDateInCompetency(31, 2026, 2, 10)).toBe("2026-03-31");
    // day 31 in competency April: Apr 10 – May 9
    // day 31 >= 10 → Apr 31 (doesn't exist)
    expect(getRecurringDateInCompetency(31, 2026, 3, 10)).toBeNull();
  });

  it("handles December → January transition", () => {
    // closingDay=15, competency Dec: Dec 15 – Jan 14
    // day 5 < 15 → Jan 5 of next year
    expect(getRecurringDateInCompetency(5, 2026, 11, 15)).toBe("2027-01-05");
  });
});

// ── getCompetencyDays ───────────────────────────────────────────

describe("getCompetencyDays", () => {
  it("returns correct number of days for March 2026", () => {
    const days = getCompetencyDays(2026, 2, 1, new Date(2026, 2, 15));
    expect(days).toHaveLength(31);
    expect(days[0].date).toBe("2026-03-01");
    expect(days[30].date).toBe("2026-03-31");
  });

  it("marks today correctly", () => {
    const today = new Date(2026, 2, 15);
    const days = getCompetencyDays(2026, 2, 1, today);
    const todayDay = days.find((d) => d.isToday);
    expect(todayDay?.date).toBe("2026-03-15");
  });

  it("marks weekends correctly", () => {
    const days = getCompetencyDays(2026, 2, 1, new Date(2026, 2, 1));
    // Mar 1 2026 is a Sunday
    expect(days[0].isWeekend).toBe(true);
    // Mar 2 2026 is Monday
    expect(days[1].isWeekend).toBe(false);
  });

  it("spans two calendar months for closingDay > 1", () => {
    const days = getCompetencyDays(2026, 1, 10, new Date(2026, 1, 10));
    // Feb 10 to Mar 9
    expect(days[0].date).toBe("2026-02-10");
    expect(days[days.length - 1].date).toBe("2026-03-09");
    expect(days[0].calendarMonth).toBe(1); // February
    expect(days[days.length - 1].calendarMonth).toBe(2); // March
  });
});

// ── getCompetencyLabel ──────────────────────────────────────────

describe("getCompetencyLabel", () => {
  it("formats single-digit month with leading zero", () => {
    expect(getCompetencyLabel(2026, 0)).toBe("2026-01");
    expect(getCompetencyLabel(2026, 8)).toBe("2026-09");
  });

  it("formats double-digit month", () => {
    expect(getCompetencyLabel(2026, 11)).toBe("2026-12");
  });
});
