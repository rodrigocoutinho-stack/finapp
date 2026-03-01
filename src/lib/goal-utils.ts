import type { Goal, Account } from "@/types/database";

// --- Constants ---

export const GOAL_ICONS: Record<string, string> = {
  default: "🎯",
  house: "🏠",
  car: "🚗",
  travel: "✈️",
  education: "🎓",
  health: "🏥",
  wedding: "💍",
  baby: "👶",
  tech: "💻",
  emergency: "🛡️",
  retirement: "🏖️",
  gift: "🎁",
};

export const GOAL_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  emerald: { bg: "bg-emerald-50", bar: "bg-emerald-500", text: "text-emerald-700" },
  blue: { bg: "bg-blue-50", bar: "bg-blue-500", text: "text-blue-700" },
  violet: { bg: "bg-violet-50", bar: "bg-violet-500", text: "text-violet-700" },
  rose: { bg: "bg-rose-50", bar: "bg-rose-500", text: "text-rose-700" },
  amber: { bg: "bg-amber-50", bar: "bg-amber-500", text: "text-amber-700" },
  cyan: { bg: "bg-cyan-50", bar: "bg-cyan-500", text: "text-cyan-700" },
  slate: { bg: "bg-slate-50", bar: "bg-slate-500", text: "text-slate-700" },
};

export const HORIZON_LABELS: Record<string, string> = {
  short: "Curto prazo",
  medium: "Médio prazo",
  long: "Longo prazo",
};

// --- Pure functions ---

/**
 * Returns the current progress in cents.
 * If goal has an account_id, uses the account balance; otherwise uses current_cents.
 */
export function getGoalProgress(goal: Goal, accounts: Account[]): number {
  if (goal.account_id) {
    const account = accounts.find((a) => a.id === goal.account_id);
    return account ? Math.max(0, account.balance_cents) : goal.current_cents;
  }
  return goal.current_cents;
}

/**
 * Returns goal progress as a percentage (0-100+).
 */
export function getGoalProgressPercent(goal: Goal, accounts: Account[]): number {
  const current = getGoalProgress(goal, accounts);
  if (goal.target_cents <= 0) return 0;
  return (current / goal.target_cents) * 100;
}

/**
 * Returns expected progress percentage based on linear time interpolation.
 * 0% at creation, 100% at deadline.
 */
export function getExpectedProgressPercent(goal: Goal): number {
  const now = new Date();
  const created = new Date(goal.created_at);
  const deadline = new Date(goal.deadline);

  const totalDays = (deadline.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (totalDays <= 0) return 100;

  const elapsedDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  const percent = (elapsedDays / totalDays) * 100;

  return Math.min(100, Math.max(0, percent));
}

/**
 * Returns the contribution gap in percentage points.
 * Positive = behind schedule, negative = ahead of schedule.
 */
export function getContributionGapPercent(goal: Goal, accounts: Account[]): number {
  const expected = getExpectedProgressPercent(goal);
  const actual = getGoalProgressPercent(goal, accounts);
  return expected - actual;
}

/**
 * Returns how much per month is needed to reach the goal by the deadline.
 * Returns 0 if the goal is already reached or the deadline has passed.
 */
export function getRequiredMonthlyContribution(goal: Goal, accounts: Account[]): number {
  const current = getGoalProgress(goal, accounts);
  const remaining = goal.target_cents - current;
  if (remaining <= 0) return 0;

  const now = new Date();
  const deadline = new Date(goal.deadline);
  const monthsLeft =
    (deadline.getFullYear() - now.getFullYear()) * 12 +
    (deadline.getMonth() - now.getMonth());

  if (monthsLeft <= 0) return remaining;
  return Math.ceil(remaining / monthsLeft);
}

/**
 * Returns estimated delay in months (positive = behind, 0 = on track or ahead).
 */
export function getDelayMonths(goal: Goal, accounts: Account[]): number {
  const gap = getContributionGapPercent(goal, accounts);
  if (gap <= 0) return 0;

  const deadline = new Date(goal.deadline);
  const totalMonths =
    (deadline.getFullYear() - new Date(goal.created_at).getFullYear()) * 12 +
    (deadline.getMonth() - new Date(goal.created_at).getMonth());

  if (totalMonths <= 0) return 0;

  // Gap percentage translated to months
  const delayMonths = (gap / 100) * totalMonths;
  return Math.round(delayMonths * 10) / 10;
}

/**
 * Returns a status label and color key for the goal.
 */
export function getGoalStatus(
  goal: Goal,
  accounts: Account[]
): { label: string; color: "green" | "yellow" | "red" | "gray" } {
  const progress = getGoalProgressPercent(goal, accounts);

  if (progress >= 100) {
    return { label: "Concluída", color: "gray" };
  }

  const now = new Date();
  const deadline = new Date(goal.deadline);

  if (now > deadline) {
    return { label: "Vencida", color: "red" };
  }

  const gap = getContributionGapPercent(goal, accounts);
  if (gap > 15) {
    return { label: "Atrasada", color: "red" };
  }
  if (gap > 5) {
    return { label: "Atenção", color: "yellow" };
  }
  return { label: "No prazo", color: "green" };
}

/**
 * Returns months remaining until the deadline.
 */
export function getMonthsRemaining(goal: Goal): number {
  const now = new Date();
  const deadline = new Date(goal.deadline);
  const months =
    (deadline.getFullYear() - now.getFullYear()) * 12 +
    (deadline.getMonth() - now.getMonth());
  return Math.max(0, months);
}
