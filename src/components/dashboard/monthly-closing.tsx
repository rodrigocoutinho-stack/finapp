"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import type { MonthForecast, CategoryForecast } from "@/lib/forecast";
import type { MonthlyClosingRow } from "@/types/database";

interface MonthlyClosingProps {
  forecast: MonthForecast;
  totalReceitas: number;
  totalDespesas: number;
  totalInvestimentos: number;
  savingsRate: number | null;
  month: string; // YYYY-MM
  runwayMonths: number | null;
  reserveMonths: number | null;
  budgetDeviation: number | null;
  fixedExpensePct: number | null;
  totalBalance: number;
  existingClosing: MonthlyClosingRow | null;
  previousClosing: MonthlyClosingRow | null;
  onSaved: () => void;
}

export function MonthlyClosing({
  forecast,
  totalReceitas,
  totalDespesas,
  totalInvestimentos,
  savingsRate,
  month,
  runwayMonths,
  reserveMonths,
  budgetDeviation,
  fixedExpensePct,
  totalBalance,
  existingClosing,
  previousClosing,
  onSaved,
}: MonthlyClosingProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(existingClosing?.notes ?? "");

  // Geração do mês = Receitas − Despesas. Investimento é classificação do destino,
  // não subtrator da geração.
  const saldo = totalReceitas - totalDespesas;
  const isClosed = !!existingClosing;

  // Top 3 deviations
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

  // Suggestions
  const suggestions: string[] = [];
  if (savingsRate !== null && savingsRate < 10) {
    suggestions.push("Sua taxa de poupança está abaixo de 10%. Tente reduzir gastos variáveis no próximo mês.");
  }
  const bustedCategories = forecast.byCategory.filter((c) => {
    if (c.type !== "despesa") return false;
    const ref = getRef(c);
    return ref > 0 && c.realAmount > ref;
  });
  if (bustedCategories.length > 0) {
    const names = bustedCategories.slice(0, 2).map((c) => c.categoryName).join(" e ");
    suggestions.push(`As categorias ${names} ultrapassaram o limite. Considere ajustar tetos ou hábitos de consumo.`);
  }
  if (totalDespesas > totalReceitas) {
    suggestions.push("Você gastou mais do que ganhou este mês. Priorize reduzir despesas ou buscar renda extra.");
  }
  if (savingsRate !== null && savingsRate >= 20) {
    suggestions.push("Boa disciplina financeira! Considere direcionar parte da poupança para investimentos.");
  }
  if (suggestions.length === 0) {
    suggestions.push("Continue acompanhando seus gastos mensalmente para manter o controle.");
  }

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      addToast("Usuário não autenticado.", "error");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: user.id,
      month,
      total_income_cents: totalReceitas,
      total_expense_cents: totalDespesas,
      total_investment_cents: totalInvestimentos,
      savings_rate: savingsRate !== null ? Math.round(savingsRate * 100) / 100 : null,
      runway_months: runwayMonths !== null ? Math.round(runwayMonths * 10) / 10 : null,
      reserve_months: reserveMonths !== null ? Math.round(reserveMonths * 10) / 10 : null,
      budget_deviation: budgetDeviation !== null ? Math.round(budgetDeviation * 100) / 100 : null,
      fixed_expense_pct: fixedExpensePct !== null ? Math.round(fixedExpensePct * 100) / 100 : null,
      total_balance_cents: totalBalance,
      notes: notes.trim() || null,
    };

    if (existingClosing) {
      const { error } = await supabase
        .from("monthly_closings")
        .update(payload)
        .eq("id", existingClosing.id);
      if (error) {
        addToast("Erro ao atualizar fechamento.", "error");
        setSaving(false);
        return;
      }
      logAudit(supabase, "closing.update", "monthly_closing", existingClosing.id, { month });
      addToast("Fechamento atualizado.");
    } else {
      const { error } = await supabase
        .from("monthly_closings")
        .insert(payload);
      if (error) {
        addToast("Erro ao salvar fechamento.", "error");
        setSaving(false);
        return;
      }
      logAudit(supabase, "closing.create", "monthly_closing", null, { month });
      addToast("Mês fechado com sucesso!");
    }

    setSaving(false);
    onSaved();
  }

  function formatDelta(current: number, previous: number): { text: string; color: string } {
    const diff = current - previous;
    const sign = diff >= 0 ? "+" : "";
    return {
      text: `${sign}${formatCurrency(diff)}`,
      color: diff >= 0 ? "text-emerald-600" : "text-rose-600",
    };
  }

  function formatPctDelta(current: number | null, previous: number | null, invertColor = false): { text: string; color: string } | null {
    if (current === null || previous === null) return null;
    const diff = current - previous;
    const sign = diff >= 0 ? "+" : "";
    const isGood = invertColor ? diff <= 0 : diff >= 0;
    return {
      text: `${sign}${diff.toFixed(1)}pp`,
      color: isGood ? "text-emerald-600" : "text-rose-600",
    };
  }

  const prevIncome = previousClosing?.total_income_cents ?? null;
  const prevExpense = previousClosing?.total_expense_cents ?? null;
  const prevInvestment = previousClosing?.total_investment_cents ?? null;

  return (
    <div className="space-y-6">
      {/* Status badge */}
      {isClosed && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Mês fechado em {new Date(existingClosing.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      )}

      {/* Section 1: Resumo */}
      <div>
        <h3 className="text-sm font-semibold text-on-surface-secondary mb-3">Resumo do Mês</h3>
        <div className="grid grid-cols-2 gap-3">
          <SummaryItem
            label="Receitas"
            value={formatCurrency(totalReceitas)}
            color="text-emerald-600"
            delta={prevIncome !== null ? formatDelta(totalReceitas, prevIncome) : undefined}
          />
          <SummaryItem
            label="Despesas"
            value={formatCurrency(totalDespesas)}
            color="text-rose-600"
            delta={prevExpense !== null ? formatDelta(totalDespesas, prevExpense) : undefined}
          />
          <SummaryItem
            label="Investido"
            value={formatCurrency(totalInvestimentos)}
            color="text-violet-600 dark:text-violet-400"
            delta={prevInvestment !== null ? formatDelta(totalInvestimentos, prevInvestment) : undefined}
          />
          <SummaryItem
            label="Geração do mês"
            value={`${saldo >= 0 ? "+" : ""}${formatCurrency(saldo)}`}
            color={saldo >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
          <SummaryItem
            label="Taxa de Poupança"
            value={savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "—"}
            color={
              savingsRate !== null
                ? savingsRate >= 20 ? "text-emerald-600"
                : savingsRate >= 10 ? "text-yellow-600"
                : "text-rose-600"
                : "text-on-surface-muted"
            }
            delta={formatPctDelta(savingsRate, previousClosing?.savings_rate !== undefined ? Number(previousClosing?.savings_rate) : null) ?? undefined}
          />
        </div>
      </div>

      {/* Section 1.5: KPIs snapshot */}
      <div>
        <h3 className="text-sm font-semibold text-on-surface-secondary mb-3">KPIs do Mês</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiItem
            label="Runway"
            value={runwayMonths !== null ? `${runwayMonths.toFixed(1)}m` : "—"}
          />
          <KpiItem
            label="Reserva"
            value={reserveMonths !== null ? `${reserveMonths.toFixed(1)}m` : "—"}
          />
          <KpiItem
            label="Desvio Orç."
            value={budgetDeviation !== null ? `${budgetDeviation.toFixed(1)}%` : "—"}
          />
          <KpiItem
            label="% Fixo"
            value={fixedExpensePct !== null ? `${fixedExpensePct.toFixed(1)}%` : "—"}
          />
        </div>
      </div>

      {/* Section 2: Top Desvios */}
      {deviations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-on-surface-secondary mb-3">Maiores Desvios</h3>
          <div className="space-y-2">
            {deviations.map((d) => (
              <div
                key={d.categoryId}
                className="flex items-center justify-between rounded-lg bg-surface-alt px-3 py-2"
              >
                <span className="text-sm text-on-surface-secondary">{d.categoryName}</span>
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-semibold tabular-nums ${d.diff > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                    {d.diff > 0 ? "+" : ""}{formatCurrency(d.diff)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${d.diff > 0 ? "bg-rose-100 text-rose-700 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:text-emerald-300"}`}>
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
        <h3 className="text-sm font-semibold text-on-surface-secondary mb-3">Sugestões</h3>
        <ul className="space-y-2">
          {suggestions.slice(0, 3).map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-on-surface-secondary">
              <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4: Notas + Ação */}
      <div className="space-y-3 pt-2 border-t border-border-light">
        <div>
          <label htmlFor="closing-notes" className="block text-sm font-medium text-on-surface-secondary mb-1">
            Observações (opcional)
          </label>
          <textarea
            id="closing-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Mês atípico por conta de viagem..."
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
        <Button loading={saving} onClick={handleSave} className="w-full">
          {isClosed ? "Atualizar fechamento" : "Fechar mês"}
        </Button>
      </div>
    </div>
  );
}

function getRef(c: CategoryForecast): number {
  if (c.budgetCents != null && c.budgetCents > 0) return c.budgetCents;
  return c.forecastToDateAmount;
}

function SummaryItem({ label, value, color, delta }: {
  label: string;
  value: string;
  color: string;
  delta?: { text: string; color: string };
}) {
  return (
    <div className="rounded-lg bg-surface-alt px-3 py-2">
      <p className="text-xs text-on-surface-muted">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
      {delta && (
        <p className={`text-xs tabular-nums ${delta.color}`}>
          vs mês anterior: {delta.text}
        </p>
      )}
    </div>
  );
}

function KpiItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-alt px-3 py-2 text-center">
      <p className="text-xs text-on-surface-muted">{label}</p>
      <p className="text-base font-bold text-on-surface-secondary tabular-nums">{value}</p>
    </div>
  );
}
