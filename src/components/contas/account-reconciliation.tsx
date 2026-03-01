"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types/database";

interface TransactionSummary {
  account_id: string;
  type: "receita" | "despesa";
  amount_cents: number;
}

interface AccountReconciliationProps {
  accounts: Account[];
  transactions: TransactionSummary[];
  onRefresh: () => void;
}

interface ReconciliationRow {
  account: Account;
  calculatedBalance: number;
  divergence: number;
}

export function AccountReconciliation({
  accounts,
  transactions,
  onRefresh,
}: AccountReconciliationProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [adjusting, setAdjusting] = useState<string | null>(null);

  const rows: ReconciliationRow[] = accounts.map((account) => {
    const accountTxns = transactions.filter(
      (t) => t.account_id === account.id
    );
    const txnSum = accountTxns.reduce(
      (sum, t) =>
        sum + (t.type === "receita" ? t.amount_cents : -t.amount_cents),
      0
    );
    const calculatedBalance = account.initial_balance_cents + txnSum;
    const divergence = account.balance_cents - calculatedBalance;

    return { account, calculatedBalance, divergence };
  });

  const hasDivergence = rows.some((r) => r.divergence !== 0);

  async function handleAdjust(row: ReconciliationRow) {
    setAdjusting(row.account.id);

    const { error } = await supabase
      .from("accounts")
      .update({ balance_cents: row.calculatedBalance })
      .eq("id", row.account.id);

    if (error) {
      addToast("Erro ao ajustar saldo.", "error");
    } else {
      addToast(`Saldo de "${row.account.name}" ajustado com sucesso.`);
      onRefresh();
    }

    setAdjusting(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Compara o saldo registrado de cada conta com o saldo calculado (saldo
        inicial + transações). Divergências podem indicar transações não
        registradas.
      </p>

      {!hasDivergence && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Todas as contas estão reconciliadas. Nenhuma divergência encontrada.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 px-3 font-medium text-slate-600">
                Conta
              </th>
              <th className="text-right py-2 px-3 font-medium text-slate-600">
                Saldo Registrado
              </th>
              <th className="text-right py-2 px-3 font-medium text-slate-600">
                Saldo Calculado
              </th>
              <th className="text-right py-2 px-3 font-medium text-slate-600">
                Divergência
              </th>
              <th className="text-center py-2 px-3 font-medium text-slate-600">
                Status
              </th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDivergent = row.divergence !== 0;

              return (
                <tr
                  key={row.account.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {row.account.name}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                    {formatCurrency(row.account.balance_cents)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                    {formatCurrency(row.calculatedBalance)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                      isDivergent ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {isDivergent
                      ? `${row.divergence > 0 ? "+" : ""}${formatCurrency(row.divergence)}`
                      : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isDivergent
                          ? Math.abs(row.divergence) >
                            row.account.balance_cents * 0.1
                            ? "bg-rose-100 text-rose-700"
                            : "bg-yellow-100 text-yellow-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isDivergent ? "Divergência" : "OK"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {isDivergent && (
                      <Button
                        variant="secondary"
                        onClick={() => handleAdjust(row)}
                        loading={adjusting === row.account.id}
                        className="text-xs px-2.5 py-1"
                      >
                        Ajustar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasDivergence && (
        <p className="text-xs text-slate-400">
          &ldquo;Ajustar&rdquo; atualiza o saldo registrado para o valor
          calculado. Verifique se não há transações pendentes antes de ajustar.
        </p>
      )}
    </div>
  );
}
