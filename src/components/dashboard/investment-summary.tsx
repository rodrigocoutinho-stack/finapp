"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface InvestmentSummaryProps {
  totalBalance: number;
  lastReturn: number;
  lastReturnPercent: number;
  hasData: boolean;
}

export function InvestmentSummary({
  totalBalance,
  lastReturn,
  lastReturnPercent,
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

  const isPositive = lastReturn >= 0;

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

      <div className="flex items-baseline gap-6 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Posição atual</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-0.5">Rendimento no mês</p>
          <p className="text-base font-semibold tabular-nums">
            <span className={isPositive ? "text-emerald-600" : "text-rose-600"}>
              {isPositive ? "+" : ""}
              {formatCurrency(lastReturn)}
            </span>
            <span
              className={`ml-1.5 text-sm font-medium ${
                isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              ({isPositive ? "+" : ""}
              {lastReturnPercent.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
