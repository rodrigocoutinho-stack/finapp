"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface InvestmentSummaryProps {
  totalBalance: number;
  projectedReturn: number;
  returnPercent: number;
  hasData: boolean;
}

export function InvestmentSummary({
  totalBalance,
  projectedReturn,
  returnPercent,
  hasData,
}: InvestmentSummaryProps) {
  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Investimentos
        </h2>
        <p className="text-slate-500 text-sm mb-3">
          Nenhum investimento cadastrado.
        </p>
        <Link
          href="/investimentos"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Cadastrar investimento
        </Link>
      </div>
    );
  }

  const isPositive = returnPercent >= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Investimentos</h2>
        <Link
          href="/investimentos"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Ver detalhes
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-slate-500">Total investido</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm text-slate-500">Retorno projetado no mês</p>
            <p className="text-base font-semibold text-slate-800 tabular-nums">
              {formatCurrency(projectedReturn)}
              <span
                className={`ml-2 text-sm font-medium ${
                  isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                ({isPositive ? "+" : ""}
                {returnPercent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
