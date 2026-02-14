"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { getElapsedDays, getCurrentCompetencyMonth } from "@/lib/closing-day";
import type { MonthForecast, CategoryForecast } from "@/lib/forecast";

interface BudgetComparisonProps {
  month: MonthForecast;
  closingDay?: number;
}

export function BudgetComparison({ month, closingDay = 1 }: BudgetComparisonProps) {
  const [showReceitas, setShowReceitas] = useState(true);
  const [showDespesas, setShowDespesas] = useState(true);

  const { year, month: curMonth } = getCurrentCompetencyMonth(closingDay);
  const elapsed = getElapsedDays(year, curMonth, closingDay);

  const receitas = month.byCategory.filter(
    (c) => c.type === "receita" && (c.forecastToDateAmount > 0 || c.realAmount > 0)
  );
  const despesas = month.byCategory.filter(
    (c) => c.type === "despesa" && (c.forecastToDateAmount > 0 || c.realAmount > 0)
  );

  if (receitas.length === 0 && despesas.length === 0) {
    return (
      <p className="text-slate-500 text-center py-4 text-sm">
        Sem dados de orçamento para comparar.
      </p>
    );
  }

  const saldoPrevisto = month.forecastToDateReceitas - month.forecastToDateDespesas;
  const saldoReal = month.realReceitas - month.realDespesas;
  const saldoDiff = saldoReal - saldoPrevisto;

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 mb-3">
        Comparação proporcional até o dia {elapsed} do período
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-4 font-medium text-slate-600 min-w-[160px]">
              Categoria
            </th>
            <th className="text-right py-2 px-3 font-medium text-slate-600 min-w-[100px]">
              Previsto
            </th>
            <th className="text-right py-2 px-3 font-medium text-slate-600 min-w-[100px]">
              Realizado
            </th>
            <th className="text-right py-2 px-3 font-medium text-slate-600 min-w-[110px]">
              Diferença
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Receitas */}
          {receitas.length > 0 && (
            <>
              <tr
                className="cursor-pointer hover:bg-emerald-50/50 transition-colors"
                tabIndex={0}
                role="button"
                aria-expanded={showReceitas}
                onClick={() => setShowReceitas(!showReceitas)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowReceitas(!showReceitas);
                  }
                }}
              >
                <td className="py-2.5 pr-4 font-semibold text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <ChevronIcon open={showReceitas} />
                    Receitas
                  </span>
                </td>
                <td className="text-right py-2.5 px-3 font-semibold text-slate-700 tabular-nums">
                  {formatCurrency(month.forecastToDateReceitas)}
                </td>
                <td className="text-right py-2.5 px-3 font-semibold text-slate-700 tabular-nums">
                  {formatCurrency(month.realReceitas)}
                </td>
                <td className="text-right py-2.5 px-3 font-semibold tabular-nums">
                  <DiffBadge
                    diff={month.realReceitas - month.forecastToDateReceitas}
                    type="receita"
                  />
                </td>
              </tr>

              {showReceitas &&
                receitas.map((cat) => (
                  <CategoryRow key={cat.categoryId} cat={cat} />
                ))}
            </>
          )}

          {/* Despesas */}
          {despesas.length > 0 && (
            <>
              <tr
                className="cursor-pointer hover:bg-rose-50/50 transition-colors"
                tabIndex={0}
                role="button"
                aria-expanded={showDespesas}
                onClick={() => setShowDespesas(!showDespesas)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setShowDespesas(!showDespesas);
                  }
                }}
              >
                <td className="py-2.5 pr-4 font-semibold text-rose-700 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <ChevronIcon open={showDespesas} />
                    Despesas
                  </span>
                </td>
                <td className="text-right py-2.5 px-3 font-semibold text-slate-700 border-t border-slate-100 tabular-nums">
                  {formatCurrency(month.forecastToDateDespesas)}
                </td>
                <td className="text-right py-2.5 px-3 font-semibold text-slate-700 border-t border-slate-100 tabular-nums">
                  {formatCurrency(month.realDespesas)}
                </td>
                <td className="text-right py-2.5 px-3 font-semibold border-t border-slate-100 tabular-nums">
                  <DiffBadge
                    diff={month.realDespesas - month.forecastToDateDespesas}
                    type="despesa"
                  />
                </td>
              </tr>

              {showDespesas &&
                despesas.map((cat) => (
                  <CategoryRow key={cat.categoryId} cat={cat} />
                ))}
            </>
          )}

          {/* Saldo */}
          <tr className="border-t-2 border-slate-200">
            <td className="py-3 pr-4 font-semibold text-slate-800">Saldo</td>
            <td className="text-right py-3 px-3 font-semibold text-slate-700 tabular-nums">
              {saldoPrevisto >= 0 ? "+" : ""}
              {formatCurrency(saldoPrevisto)}
            </td>
            <td className="text-right py-3 px-3 font-semibold text-slate-700 tabular-nums">
              {saldoReal >= 0 ? "+" : ""}
              {formatCurrency(saldoReal)}
            </td>
            <td className="text-right py-3 px-3 font-bold tabular-nums">
              <span className={saldoDiff >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {saldoDiff >= 0 ? "+" : ""}
                {formatCurrency(saldoDiff)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function CategoryRow({ cat }: { cat: CategoryForecast }) {
  const diff = cat.realAmount - cat.forecastToDateAmount;
  const progress =
    cat.forecastToDateAmount > 0
      ? (cat.realAmount / cat.forecastToDateAmount) * 100
      : cat.realAmount > 0
        ? 100
        : 0;

  const barColor =
    cat.type === "despesa"
      ? progress > 100
        ? "bg-rose-500"
        : "bg-emerald-500"
      : progress >= 100
        ? "bg-emerald-500"
        : "bg-rose-500";

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-1.5 pr-4 pl-6 text-slate-700">
        <div>
          {cat.categoryName}
          {cat.forecastToDateAmount > 0 && (
            <div className="mt-1 h-1.5 w-full max-w-[120px] rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </td>
      <td className="text-right py-1.5 px-3 text-slate-600 tabular-nums">
        {formatCurrency(cat.forecastToDateAmount)}
      </td>
      <td className="text-right py-1.5 px-3 text-slate-600 tabular-nums">
        {formatCurrency(cat.realAmount)}
      </td>
      <td className="text-right py-1.5 px-3 tabular-nums">
        <DiffBadge diff={diff} type={cat.type} />
      </td>
    </tr>
  );
}

function DiffBadge({
  diff,
  type,
}: {
  diff: number;
  type: "receita" | "despesa";
}) {
  // Receitas: positive diff is good (earned more than expected)
  // Despesas: positive diff is bad (spent more than expected)
  const isGood = type === "receita" ? diff >= 0 : diff <= 0;
  const color = isGood ? "text-emerald-600" : "text-rose-600";

  if (diff === 0) {
    return <span className="text-slate-400">-</span>;
  }

  return (
    <span className={color}>
      {diff > 0 ? "+" : ""}
      {formatCurrency(diff)}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
