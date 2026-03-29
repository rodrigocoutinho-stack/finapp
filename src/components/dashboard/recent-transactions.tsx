"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionRow } from "@/hooks/use-dashboard-data";

interface RecentTransactionsProps {
  transactions: TransactionRow[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="p-6 flex-1">
      <h2 className="text-lg font-semibold text-on-surface-heading mb-4">
        Últimas Transações
      </h2>
      {transactions.length === 0 ? (
        <p className="text-on-surface-muted text-sm">
          Nenhuma transação neste mês.
        </p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-on-surface">
                  {t.description}
                </p>
                <p className="text-xs text-on-surface-muted">
                  {formatDate(t.date)} &middot;{" "}
                  {t.type === "transferencia"
                    ? `${t.accounts?.name ?? "-"} → ${t.destination_accounts?.name ?? "-"}`
                    : `${t.categories?.name ?? "-"} · ${t.accounts?.name ?? "-"}`}
                </p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  t.type === "receita"
                    ? "text-emerald-600"
                    : t.type === "transferencia"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-rose-600"
                }`}
              >
                {t.type === "receita" ? "+" : t.type === "transferencia" ? "" : "-"}{" "}
                {formatCurrency(t.amount_cents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
