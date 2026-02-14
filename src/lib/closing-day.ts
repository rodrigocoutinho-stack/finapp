/**
 * Centralizes all date math for custom closing day (competency periods).
 *
 * "Competency month M" with closingDay D:
 *   - Start: day D of calendar month M
 *   - End:   day D-1 of calendar month M+1
 *   - closingDay = 1 → standard calendar month
 *
 * Example: closingDay = 10, "February" → Feb 10 to Mar 9
 */

export interface CompetencyRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface CompetencyDay {
  date: string;      // YYYY-MM-DD
  dayLabel: number;  // day-of-month number (for column header)
  weekday: string;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
  calendarMonth: number; // 0-based calendar month this date belongs to
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Returns the start and end dates (inclusive) for a competency period.
 *
 * @param year  - competency year
 * @param month - competency month (0-based, like JS Date)
 * @param closingDay - 1-28
 */
export function getCompetencyRange(
  year: number,
  month: number,
  closingDay: number
): CompetencyRange {
  if (closingDay <= 1) {
    // Standard calendar month
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // last day of month
    return { start: fmtDate(start), end: fmtDate(end) };
  }

  // Competency starts on day `closingDay` of calendar month `month`
  const start = new Date(year, month, closingDay);
  // Ends on day `closingDay - 1` of the next calendar month
  const end = new Date(year, month + 1, closingDay - 1);
  return { start: fmtDate(start), end: fmtDate(end) };
}

/**
 * Determines which competency month "today" belongs to.
 *
 * - If today's day >= closingDay → competency of current calendar month
 * - If today's day <  closingDay → competency of previous calendar month
 */
export function getCurrentCompetencyMonth(
  closingDay: number,
  today?: Date
): { year: number; month: number } {
  const d = today ?? new Date();
  const calYear = d.getFullYear();
  const calMonth = d.getMonth();
  const dayOfMonth = d.getDate();

  if (closingDay <= 1 || dayOfMonth >= closingDay) {
    return { year: calYear, month: calMonth };
  }

  // Previous month
  if (calMonth === 0) {
    return { year: calYear - 1, month: 11 };
  }
  return { year: calYear, month: calMonth - 1 };
}

/**
 * Returns the number of days in a competency period.
 */
export function getCompetencyDayCount(
  year: number,
  month: number,
  closingDay: number
): number {
  const { start, end } = getCompetencyRange(year, month, closingDay);
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Returns elapsed days from start of competency period up to (and including) today.
 */
export function getElapsedDays(
  year: number,
  month: number,
  closingDay: number,
  today?: Date
): number {
  const { start } = getCompetencyRange(year, month, closingDay);
  const d = today ?? new Date();
  const todayStr = fmtDate(d);
  const s = new Date(start + "T00:00:00");
  const t = new Date(todayStr + "T00:00:00");
  const elapsed = Math.round((t.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(elapsed, 0);
}

/**
 * Given a recurring transaction's day_of_month, returns the actual YYYY-MM-DD
 * within the competency period, or null if the day doesn't exist.
 *
 * For closingDay = 1: date is year-month-dayOfMonth (standard behavior).
 * For closingDay > 1:
 *   - dayOfMonth >= closingDay → date in calendar month M
 *   - dayOfMonth <  closingDay → date in calendar month M+1
 */
export function getRecurringDateInCompetency(
  dayOfMonth: number,
  year: number,
  month: number,
  closingDay: number
): string | null {
  if (closingDay <= 1) {
    // Standard: just place it in the calendar month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (dayOfMonth > daysInMonth) return null;
    const m = String(month + 1).padStart(2, "0");
    const d = String(dayOfMonth).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  let targetYear: number;
  let targetMonth: number; // 0-based

  if (dayOfMonth >= closingDay) {
    // Falls in the first half: calendar month M
    targetYear = year;
    targetMonth = month;
  } else {
    // Falls in the second half: calendar month M+1
    const nextDate = new Date(year, month + 1, 1);
    targetYear = nextDate.getFullYear();
    targetMonth = nextDate.getMonth();
  }

  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  if (dayOfMonth > daysInTargetMonth) return null;

  const m = String(targetMonth + 1).padStart(2, "0");
  const d = String(dayOfMonth).padStart(2, "0");
  return `${targetYear}-${m}-${d}`;
}

/**
 * Returns an array of CompetencyDay objects for the entire competency period.
 * Used by the daily flow grid.
 */
export function getCompetencyDays(
  year: number,
  month: number,
  closingDay: number,
  today?: Date
): CompetencyDay[] {
  const { start, end } = getCompetencyRange(year, month, closingDay);
  const todayStr = fmtDate(today ?? new Date());

  const days: CompetencyDay[] = [];
  const current = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  while (current <= endDate) {
    const dateStr = fmtDate(current);
    const dayOfWeek = current.getDay();

    days.push({
      date: dateStr,
      dayLabel: current.getDate(),
      weekday: WEEKDAYS[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: dateStr === todayStr,
      isPast: dateStr <= todayStr,
      calendarMonth: current.getMonth(),
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Returns the competency month label string "YYYY-MM" for a given competency.
 * This is the label used in start_month/end_month for recurring transactions.
 */
export function getCompetencyLabel(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
