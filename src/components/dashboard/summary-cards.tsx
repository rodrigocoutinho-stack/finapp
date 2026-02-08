"use client";

import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
}

export function SummaryCards({ totalReceitas, totalDespesas }: SummaryCardsProps) {
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Total Receitas</p>
        <p className="text-2xl font-bold text-emerald-600 mt-1">
          {formatCurrency(totalReceitas)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Total Despesas</p>
        <p className="text-2xl font-bold text-red-600 mt-1">
          {formatCurrency(totalDespesas)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <p className="text-sm font-medium text-gray-600">Saldo do Mês</p>
        <p
          className={`text-2xl font-bold mt-1 ${
            saldo >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {formatCurrency(saldo)}
        </p>
      </div>
    </div>
  );
}
