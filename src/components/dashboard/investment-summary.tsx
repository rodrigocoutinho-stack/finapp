"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface InvestmentSummaryProps {
  totalBalance: number;
  lastReturn: number;
  lastReturnPercent: number;
  hasData: boolean;
  ipca12m?: number | null;
}

export function InvestmentSummary({
  totalBalance,
  lastReturn,
  lastReturnPercent,
  hasData,
  ipca12m,
}: InvestmentSummaryProps) {
  if (!hasData) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface-heading mb-3">
          Investimentos
        </h2>
        <p className="text-on-surface-muted text-sm mb-3">
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
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-on-surface-heading">Investimentos</h2>
        <Link
          href="/investimentos"
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Ver detalhes
        </Link>
      </div>

      <div className="flex items-baseline gap-6 flex-wrap">
        <div>
          <p className="text-xs text-on-surface-muted mb-0.5">Posição atual</p>
          <p className="text-xl font-bold text-on-surface tabular-nums">
            {formatCurrency(totalBalance)}
          </p>
        </div>

        <div>
          <p className="text-xs text-on-surface-muted mb-0.5">Rendimento no mês</p>
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
          {ipca12m !== null && ipca12m !== undefined && lastReturnPercent !== 0 && (() => {
            const deflator = 1 + ipca12m / 1200;
            if (deflator <= 0) return null;
            const realPct = ((1 + lastReturnPercent / 100) / deflator - 1) * 100;
            return (
              <p className="text-xs text-on-surface-muted mt-0.5 tabular-nums" title={`IPCA 12m: ${ipca12m.toFixed(2)}%`}>
                Real: {realPct.toFixed(2)}%
                <span className="ml-1 text-on-surface-muted">(IPCA 12m: {ipca12m.toFixed(1)}%)</span>
              </p>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
