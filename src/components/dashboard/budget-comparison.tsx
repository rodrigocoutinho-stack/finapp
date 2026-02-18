"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { getElapsedDays, getCurrentCompetencyMonth } from "@/lib/closing-day";
import { CategoryIcon } from "@/lib/category-icons";
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

  // Budget alerts — use budget_cents as reference when defined
  const alertCategories = despesas.filter((c) => {
    const ref = getEffectiveBudget(c);
    if (ref <= 0) return false;
    return c.realAmount / ref >= 0.8;
  });
  const bustedCount = alertCategories.filter((c) => {
    const ref = getEffectiveBudget(c);
    return ref > 0 && c.realAmount / ref >= 1.0;
  }).length;
  const warningCount = alertCategories.length - bustedCount;

  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 mb-3">
        Comparação proporcional até o dia {elapsed} do período
      </p>

      {alertCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          {bustedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              {bustedCount} estourada{bustedCount !== 1 ? "s" : ""}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007v.008H12v-.008z" />
              </svg>
              {warningCount} em atenção
            </span>
          )}
        </div>
      )}

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

function getEffectiveBudget(cat: CategoryForecast): number {
  if (cat.budgetCents != null && cat.budgetCents > 0) return cat.budgetCents;
  return cat.forecastToDateAmount;
}

function CategoryRow({ cat }: { cat: CategoryForecast }) {
  const ref = getEffectiveBudget(cat);
  const diff = cat.realAmount - cat.forecastToDateAmount;
  const progress =
    ref > 0
      ? (cat.realAmount / ref) * 100
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

  const usage = cat.type === "despesa" && ref > 0
    ? cat.realAmount / ref
    : null;

  const hasBudget = cat.budgetCents != null && cat.budgetCents > 0;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="py-1.5 pr-4 pl-6 text-slate-700">
        <div>
          <span className="flex items-center gap-1.5 flex-wrap">
            <CategoryIcon name={cat.categoryName} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {cat.categoryName}
            {hasBudget && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                Teto: {formatCurrency(cat.budgetCents!)}
              </span>
            )}
            {usage !== null && usage >= 1.0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                Estourado
              </span>
            )}
            {usage !== null && usage >= 0.8 && usage < 1.0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                Atenção
              </span>
            )}
          </span>
          {ref > 0 && (
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
