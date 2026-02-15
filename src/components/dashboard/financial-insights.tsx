"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { MonthForecast } from "@/lib/forecast";

interface FinancialInsightsProps {
  totalReceitas: number;
  totalDespesas: number;
  savingsRate: number | null;
  runway: number | null;
  reserveMonths: number | null;
  forecast: MonthForecast | null;
  hasInvestments: boolean;
}

interface Insight {
  id: string;
  type: "alert" | "warning" | "positive";
  text: string;
}

export function FinancialInsights({
  totalReceitas,
  totalDespesas,
  savingsRate,
  runway,
  reserveMonths,
  forecast,
  hasInvestments,
}: FinancialInsightsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights: Insight[] = [];

  // 1. Poupança negativa
  if (totalDespesas > totalReceitas && totalReceitas > 0) {
    insights.push({
      id: "negative-savings",
      type: "alert",
      text: `Suas despesas superaram suas receitas em ${formatCurrency(totalDespesas - totalReceitas)} este mês. Revise gastos variáveis.`,
    });
  }

  // 2. Poupança baixa
  if (savingsRate !== null && savingsRate >= 0 && savingsRate < 10) {
    insights.push({
      id: "low-savings",
      type: "warning",
      text: `Sua taxa de poupança está em ${savingsRate.toFixed(1)}%. O ideal é acima de 20%.`,
    });
  }

  // 3. Sem reserva
  if (reserveMonths === null) {
    insights.push({
      id: "no-reserve",
      type: "warning",
      text: "Você não tem reserva de emergência configurada. Especialistas recomendam pelo menos 3 meses de despesas.",
    });
  }

  // 4. Reserva insuficiente
  if (reserveMonths !== null && reserveMonths < 3) {
    insights.push({
      id: "low-reserve",
      type: "warning",
      text: `Sua reserva cobre ${reserveMonths.toFixed(1)} meses. O recomendado é pelo menos 6 meses.`,
    });
  }

  // 5. Runway curto
  if (runway !== null && runway < 3) {
    insights.push({
      id: "short-runway",
      type: "alert",
      text: `Seu saldo total cobre apenas ${runway.toFixed(1)} meses de despesas. Considere reduzir gastos.`,
    });
  }

  // 6. Categorias estouradas
  if (forecast) {
    const busted = forecast.byCategory.filter(
      (c) =>
        c.type === "despesa" &&
        c.forecastToDateAmount > 0 &&
        c.realAmount / c.forecastToDateAmount > 1
    );
    if (busted.length > 0) {
      const worst = busted.sort(
        (a, b) =>
          b.realAmount / b.forecastToDateAmount -
          a.realAmount / a.forecastToDateAmount
      )[0];
      const overPercent = (
        (worst.realAmount / worst.forecastToDateAmount - 1) *
        100
      ).toFixed(0);
      insights.push({
        id: "category-busted",
        type: "alert",
        text: `A categoria "${worst.categoryName}" ultrapassou o previsto em ${overPercent}%.`,
      });
    }
  }

  // 7. Sem investimentos
  if (!hasInvestments) {
    insights.push({
      id: "no-investments",
      type: "warning",
      text: "Você ainda não registrou investimentos. Comece a construir patrimônio!",
    });
  }

  // 8. Boa poupança
  if (savingsRate !== null && savingsRate >= 30) {
    insights.push({
      id: "great-savings",
      type: "positive",
      text: `Excelente! Sua taxa de poupança de ${savingsRate.toFixed(1)}% está acima da média brasileira.`,
    });
  }

  // Filter dismissed, show max 2
  const visible = insights
    .filter((i) => !dismissed.has(i.id))
    .slice(0, 2);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {visible.map((insight) => (
        <InsightCard
          key={insight.id}
          insight={insight}
          onDismiss={() =>
            setDismissed((prev) => new Set([...prev, insight.id]))
          }
        />
      ))}
    </div>
  );
}

const typeStyles = {
  alert: {
    border: "border-l-rose-500",
    bg: "bg-rose-50",
    icon: "text-rose-500",
  },
  warning: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-50",
    icon: "text-yellow-500",
  },
  positive: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    icon: "text-emerald-500",
  },
};

function InsightCard({
  insight,
  onDismiss,
}: {
  insight: Insight;
  onDismiss: () => void;
}) {
  const styles = typeStyles[insight.type];

  return (
    <div
      className={`rounded-lg border border-l-4 ${styles.border} ${styles.bg} p-4 flex items-start gap-3`}
    >
      <div className={`mt-0.5 shrink-0 ${styles.icon}`}>
        {insight.type === "positive" ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : insight.type === "alert" ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        )}
      </div>
      <p className="text-sm text-slate-700 flex-1">{insight.text}</p>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 shrink-0"
        aria-label="Dispensar"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
