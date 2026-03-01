import type { Debt } from "@/types/database";

// --- Constants ---

export const DEBT_TYPE_LABELS: Record<string, string> = {
  emprestimo: "Empréstimo",
  financiamento: "Financiamento",
  cartao: "Cartão de crédito",
  cheque_especial: "Cheque especial",
  outro: "Outro",
};

// --- Pure functions ---

/**
 * Returns debt payment progress as a percentage (0-100).
 */
export function getDebtProgress(debt: Debt): number {
  if (debt.original_amount_cents <= 0) return 100;
  const paid = debt.original_amount_cents - debt.remaining_amount_cents;
  return Math.min(100, Math.max(0, (paid / debt.original_amount_cents) * 100));
}

/**
 * Returns estimated monthly interest cost in cents.
 */
export function getMonthlyInterestCost(debt: Debt): number {
  const rate = Number(debt.interest_rate_monthly);
  if (rate <= 0 || debt.remaining_amount_cents <= 0) return 0;
  return Math.round(debt.remaining_amount_cents * (rate / 100));
}

/**
 * Returns months to payoff using iterative simulation.
 * Returns null if payment doesn't cover interest (infinite).
 * Max 600 iterations to prevent infinite loops.
 */
export function getTimeToPayoff(debt: Debt): number | null {
  const rate = Number(debt.interest_rate_monthly) / 100;
  let balance = debt.remaining_amount_cents;
  const payment = debt.monthly_payment_cents;

  if (balance <= 0) return 0;
  if (payment <= 0) return null;

  // If payment doesn't cover interest, it'll never be paid off
  if (rate > 0 && payment <= balance * rate) return null;

  let months = 0;
  const maxIterations = 600;

  while (balance > 0 && months < maxIterations) {
    if (rate > 0) {
      balance = Math.round(balance * (1 + rate));
    }
    balance -= payment;
    months++;
  }

  return months >= maxIterations ? null : months;
}

/**
 * Returns total interest cost until payoff in cents.
 * Returns null if payment doesn't cover interest.
 */
export function getTotalInterestCost(debt: Debt): number | null {
  const rate = Number(debt.interest_rate_monthly) / 100;
  let balance = debt.remaining_amount_cents;
  const payment = debt.monthly_payment_cents;

  if (balance <= 0) return 0;
  if (payment <= 0) return null;
  if (rate <= 0) return 0;
  if (payment <= balance * rate) return null;

  let totalInterest = 0;
  let months = 0;
  const maxIterations = 600;

  while (balance > 0 && months < maxIterations) {
    const interest = Math.round(balance * rate);
    totalInterest += interest;
    balance = balance + interest - payment;
    months++;
  }

  return months >= maxIterations ? null : totalInterest;
}

/**
 * Simulates paying extra per month and returns savings.
 */
export function getExtraPaymentSavings(
  debt: Debt,
  extraCents: number
): { interestSaved: number; monthsSaved: number } | null {
  const baseMonths = getTimeToPayoff(debt);
  const baseInterest = getTotalInterestCost(debt);

  if (baseMonths === null || baseInterest === null) return null;

  const rate = Number(debt.interest_rate_monthly) / 100;
  let balance = debt.remaining_amount_cents;
  const payment = debt.monthly_payment_cents + extraCents;

  if (balance <= 0 || payment <= 0) return null;
  if (rate > 0 && payment <= balance * rate) return null;

  let totalInterest = 0;
  let months = 0;
  const maxIterations = 600;

  while (balance > 0 && months < maxIterations) {
    const interest = rate > 0 ? Math.round(balance * rate) : 0;
    totalInterest += interest;
    balance = balance + interest - payment;
    months++;
  }

  if (months >= maxIterations) return null;

  return {
    interestSaved: baseInterest - totalInterest,
    monthsSaved: baseMonths - months,
  };
}

/**
 * Returns a status label and color for the debt.
 */
export function getDebtStatus(
  debt: Debt
): { label: string; color: "green" | "yellow" | "red" | "gray" } {
  if (debt.remaining_amount_cents <= 0) {
    return { label: "Quitada", color: "gray" };
  }

  if (debt.due_date) {
    const now = new Date();
    const due = new Date(debt.due_date);
    if (now > due) {
      return { label: "Vencida", color: "red" };
    }
  }

  const rate = Number(debt.interest_rate_monthly);
  if (rate > 3) {
    return { label: "Juros altos", color: "yellow" };
  }

  return { label: "Em dia", color: "green" };
}
