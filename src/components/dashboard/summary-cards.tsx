"use client";

import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
}

export function SummaryCards({ totalReceitas, totalDespesas }: SummaryCardsProps) {
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="grid gap-5 sm:grid-cols-3">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">Total Receitas</p>
        <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
          {formatCurrency(totalReceitas)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">Total Despesas</p>
        <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">
          {formatCurrency(totalDespesas)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-600">Saldo do Mês</p>
        <p
          className={`text-2xl font-bold mt-1 tabular-nums ${
            saldo >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {formatCurrency(saldo)}
        </p>
      </div>
    </div>
  );
}
