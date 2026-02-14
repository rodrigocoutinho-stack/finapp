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
      {/* Receitas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Receitas</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums">
              {formatCurrency(totalReceitas)}
            </p>
          </div>
        </div>
      </div>

      {/* Despesas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-11 h-11 rounded-full bg-rose-50">
            <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Despesas</p>
            <p className="text-xl font-bold text-rose-600 tabular-nums">
              {formatCurrency(totalDespesas)}
            </p>
          </div>
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-11 h-11 rounded-full ${saldo >= 0 ? "bg-blue-50" : "bg-rose-50"}`}>
            <svg className={`w-5 h-5 ${saldo >= 0 ? "text-blue-600" : "text-rose-600"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 013 6v3" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldo</p>
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
