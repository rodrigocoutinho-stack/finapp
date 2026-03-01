"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  getDebtProgress,
  getDebtStatus,
} from "@/lib/debt-utils";
import type { Debt } from "@/types/database";

interface DebtSummaryProps {
  debts: Debt[];
}

const statusDot = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-500",
  red: "bg-rose-500",
  gray: "bg-on-surface-muted",
};

export function DebtSummary({ debts }: DebtSummaryProps) {
  if (debts.length === 0) return null;

  const activeDebts = debts.filter(
    (d) => d.is_active && d.remaining_amount_cents > 0
  );

  if (activeDebts.length === 0) return null;

  const totalRemaining = activeDebts.reduce(
    (sum, d) => sum + d.remaining_amount_cents,
    0
  );
  const totalMonthlyPayment = activeDebts.reduce(
    (sum, d) => sum + d.monthly_payment_cents,
    0
  );

  // Show top 3 by remaining amount
  const topDebts = [...activeDebts]
    .sort((a, b) => b.remaining_amount_cents - a.remaining_amount_cents)
    .slice(0, 3);

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-on-surface-heading">Dívidas</h2>
        </div>
        <Link
          href="/dividas"
          className="text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-300 transition-colors"
        >
          Ver todas &rarr;
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface-alt rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-on-surface-muted">Total devedor</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {formatCurrency(totalRemaining)}
          </p>
        </div>
        <div className="bg-surface-alt rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-on-surface-muted">Parcelas/mês</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {formatCurrency(totalMonthlyPayment)}
          </p>
        </div>
        <div className="bg-surface-alt rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-on-surface-muted">Ativas</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {activeDebts.length}
          </p>
        </div>
      </div>

      {/* Top debts */}
      <div className="space-y-3">
        {topDebts.map((debt) => {
          const progress = getDebtProgress(debt);
          const status = getDebtStatus(debt);

          return (
            <div
              key={debt.id}
              className="flex items-center gap-3 rounded-lg bg-surface-alt px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-sm font-medium text-on-surface-secondary truncate">
                    {debt.name}
                  </p>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[status.color]}`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-skeleton rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-muted tabular-nums shrink-0">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-on-surface-muted mt-0.5">
                  Resta {formatCurrency(debt.remaining_amount_cents)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
