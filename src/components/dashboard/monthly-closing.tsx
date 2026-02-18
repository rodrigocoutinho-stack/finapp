"use client";

import { formatCurrency } from "@/lib/utils";
import type { MonthForecast, CategoryForecast } from "@/lib/forecast";

interface MonthlyClosingProps {
  forecast: MonthForecast;
  totalReceitas: number;
  totalDespesas: number;
  savingsRate: number | null;
}

export function MonthlyClosing({
  forecast,
  totalReceitas,
  totalDespesas,
  savingsRate,
}: MonthlyClosingProps) {
  const saldo = totalReceitas - totalDespesas;

  // Top 3 deviations (despesas with highest abs(real - ref))
  const deviations = forecast.byCategory
    .filter((c) => c.type === "despesa")
    .map((c) => {
      const ref = getRef(c);
      const diff = ref > 0 ? c.realAmount - ref : 0;
      const diffPercent = ref > 0 ? (diff / ref) * 100 : 0;
      return { ...c, diff, diffPercent, ref };
    })
    .filter((c) => c.ref > 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 3);

  // Generate suggestions based on rules
  const suggestions: string[] = [];

  if (savingsRate !== null && savingsRate < 10) {
    suggestions.push(
      "Sua taxa de poupança está abaixo de 10%. Tente reduzir gastos variáveis no próximo mês."
    );
  }

  const bustedCategories = forecast.byCategory.filter((c) => {
    if (c.type !== "despesa") return false;
    const ref = getRef(c);
    return ref > 0 && c.realAmount > ref;
  });
  if (bustedCategories.length > 0) {
    const names = bustedCategories
      .slice(0, 2)
      .map((c) => c.categoryName)
      .join(" e ");
    suggestions.push(
      `As categorias ${names} ultrapassaram o limite. Considere ajustar tetos ou hábitos de consumo.`
    );
  }

  if (totalDespesas > totalReceitas) {
    suggestions.push(
      "Você gastou mais do que ganhou este mês. Priorize reduzir despesas ou buscar renda extra."
    );
  }

  if (savingsRate !== null && savingsRate >= 20) {
    suggestions.push(
      "Boa disciplina financeira! Considere direcionar parte da poupança para investimentos."
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Continue acompanhando seus gastos mensalmente para manter o controle.");
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Resumo */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Resumo do Mês</h3>
        <div className="grid grid-cols-2 gap-3">
          <SummaryItem label="Receitas" value={formatCurrency(totalReceitas)} color="text-emerald-600" />
          <SummaryItem label="Despesas" value={formatCurrency(totalDespesas)} color="text-rose-600" />
          <SummaryItem
            label="Saldo"
            value={`${saldo >= 0 ? "+" : ""}${formatCurrency(saldo)}`}
            color={saldo >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
          <SummaryItem
            label="Taxa de Poupança"
            value={savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "—"}
            color={
              savingsRate !== null
                ? savingsRate >= 20
                  ? "text-emerald-600"
                  : savingsRate >= 10
                    ? "text-yellow-600"
                    : "text-rose-600"
                : "text-slate-500"
            }
          />
        </div>
      </div>

      {/* Section 2: Top Desvios */}
      {deviations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Maiores Desvios</h3>
          <div className="space-y-2">
            {deviations.map((d) => (
              <div
                key={d.categoryId}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="text-sm text-slate-700">{d.categoryName}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-semibold tabular-nums ${d.diff > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {d.diff > 0 ? "+" : ""}{formatCurrency(d.diff)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${d.diff > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {d.diffPercent >= 0 ? "+" : ""}{d.diffPercent.toFixed(0)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Sugestões */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Sugestões</h3>
        <ul className="space-y-2">
          {suggestions.slice(0, 3).map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getRef(c: CategoryForecast): number {
  if (c.budgetCents != null && c.budgetCents > 0) return c.budgetCents;
  return c.forecastToDateAmount;
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
