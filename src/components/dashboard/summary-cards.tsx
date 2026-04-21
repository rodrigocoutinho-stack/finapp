"use client";

import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  totalInvestimentos: number;
}

export function SummaryCards({ totalReceitas, totalDespesas, totalInvestimentos }: SummaryCardsProps) {
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* Receitas */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-muted uppercase tracking-wide">Receitas</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">
              {formatCurrency(totalReceitas)}
            </p>
          </div>
        </div>
      </div>

      {/* Despesas */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-950">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-muted uppercase tracking-wide">Despesas</p>
            <p className="text-xl font-bold text-rose-600 tabular-nums">
              {formatCurrency(totalDespesas)}
            </p>
          </div>
        </div>
      </div>

      {/* Investido */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-violet-50 dark:bg-violet-950">
            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125C16.5 3.504 17.004 3 17.625 3h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-muted uppercase tracking-wide">Investido</p>
            <p className="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
              {formatCurrency(totalInvestimentos)}
            </p>
          </div>
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-11 h-11 rounded-full ${saldo >= 0 ? "bg-blue-50 dark:bg-blue-950" : "bg-rose-50 dark:bg-rose-950"}`}>
            <svg className={`w-5 h-5 ${saldo >= 0 ? "text-blue-600" : "text-rose-600"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-on-surface-muted uppercase tracking-wide" title="Receitas − Despesas (Investimento é destino da geração, não subtrator)">
              Geração do mês
            </p>
            <p
              className={`text-xl font-bold tabular-nums ${
                saldo >= 0 ? "text-blue-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(saldo)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
