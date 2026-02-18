"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { RecurrenceSuggestion } from "@/lib/recurrence-detection";

interface RecurrenceSuggestionsProps {
  suggestions: RecurrenceSuggestion[];
}

export function RecurrenceSuggestions({ suggestions }: RecurrenceSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
        </svg>
        <h2 className="text-lg font-semibold text-slate-800">
          Possíveis Recorrentes
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Detectamos transações que se repetem mensalmente. Crie como recorrente para melhorar suas projeções.
      </p>

      <div className="space-y-2">
        {suggestions.slice(0, 3).map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-700 truncate">
                {s.description}
              </p>
              <p className="text-xs text-slate-500">
                ~{formatCurrency(s.avgAmountCents)} &middot; {s.occurrences}x nos últimos meses &middot; dia {s.estimatedDay}
              </p>
            </div>
            <Link
              href={`/recorrentes?novo=1&desc=${encodeURIComponent(s.description)}&valor=${s.avgAmountCents}&tipo=${s.type}&dia=${s.estimatedDay}`}
              className="ml-3 shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Criar
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
