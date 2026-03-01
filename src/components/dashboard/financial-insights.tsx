"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  getContributionGapPercent,
  getMonthsRemaining,
  getGoalProgressPercent,
} from "@/lib/goal-utils";
import type { MonthForecast } from "@/lib/forecast";
import type { Goal, Account, Debt } from "@/types/database";

interface AnnualProvision {
  description: string;
  amountCents: number;
}

interface FinancialInsightsProps {
  totalReceitas: number;
  totalDespesas: number;
  savingsRate: number | null;
  runway: number | null;
  reserveMonths: number | null;
  forecast: MonthForecast | null;
  hasInvestments: boolean;
  reserveTargetMonths?: number;
  goals?: Goal[];
  accounts?: Account[];
  pastSavingsRates?: number[];
  annualProvisions?: AnnualProvision[];
  hasDivergentAccounts?: boolean;
  debts?: Debt[];
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
  reserveTargetMonths = 6,
  goals = [],
  accounts = [],
  pastSavingsRates = [],
  annualProvisions = [],
  hasDivergentAccounts = false,
  debts = [],
}: FinancialInsightsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const insights = useMemo(() => {
  const items: Insight[] = [];

  // 1. Poupança negativa
  if (totalDespesas > totalReceitas && totalReceitas > 0) {
    items.push({
      id: "negative-savings",
      type: "alert",
      text: `Suas despesas superaram suas receitas em ${formatCurrency(totalDespesas - totalReceitas)} este mês. Revise gastos variáveis.`,
    });
  }

  // 2. Poupança baixa
  if (savingsRate !== null && savingsRate >= 0 && savingsRate < 10) {
    items.push({
      id: "low-savings",
      type: "warning",
      text: `Sua taxa de poupança está em ${savingsRate.toFixed(1)}%. O ideal é acima de 20%.`,
    });
  }

  // 3. Sem reserva
  if (reserveMonths === null) {
    items.push({
      id: "no-reserve",
      type: "warning",
      text: `Você não tem reserva de emergência configurada. Especialistas recomendam pelo menos ${reserveTargetMonths} meses de despesas.`,
    });
  }

  // 4. Reserva insuficiente
  if (reserveMonths !== null && reserveMonths < reserveTargetMonths * 0.5) {
    items.push({
      id: "low-reserve",
      type: "warning",
      text: `Sua reserva cobre ${reserveMonths.toFixed(1)} meses. Sua meta é ${reserveTargetMonths} meses.`,
    });
  }

  // 4b. Reserva excedente (RESERVE_EXCESS)
  if (reserveMonths !== null && reserveMonths > reserveTargetMonths + 2) {
    const excess = reserveMonths - reserveTargetMonths;
    items.push({
      id: "reserve-excess",
      type: "positive",
      text: `Sua reserva cobre ${reserveMonths.toFixed(1)} meses — ${excess.toFixed(1)} meses acima da meta. Considere realocar o excedente para metas ou investimentos.`,
    });
  }

  // 5. Runway curto
  if (runway !== null && runway < 3) {
    items.push({
      id: "short-runway",
      type: "alert",
      text: `Seu saldo total cobre apenas ${runway.toFixed(1)} meses de despesas. Considere reduzir gastos.`,
    });
  }

  // 6. Categorias estouradas (compara contra budget se definido, senão forecast)
  if (forecast) {
    const busted = forecast.byCategory.filter((c) => {
      if (c.type !== "despesa") return false;
      const budgetRef = c.budgetCents != null ? c.budgetCents : c.forecastToDateAmount;
      return budgetRef > 0 && c.realAmount / budgetRef > 1;
    });
    if (busted.length > 0) {
      const worst = busted.sort((a, b) => {
        const refA = a.budgetCents != null ? a.budgetCents : a.forecastToDateAmount;
        const refB = b.budgetCents != null ? b.budgetCents : b.forecastToDateAmount;
        return b.realAmount / refB - a.realAmount / refA;
      })[0];
      const budgetRef = worst.budgetCents != null ? worst.budgetCents : worst.forecastToDateAmount;
      const overPercent = ((worst.realAmount / budgetRef - 1) * 100).toFixed(0);
      const label = worst.budgetCents != null ? "ultrapassou o teto" : "ultrapassou o previsto";
      items.push({
        id: "category-busted",
        type: "alert",
        text: `A categoria "${worst.categoryName}" ${label} em ${overPercent}%.`,
      });
    }
  }

  // 7. Sem investimentos
  if (!hasInvestments) {
    items.push({
      id: "no-investments",
      type: "warning",
      text: "Você ainda não registrou investimentos. Comece a construir patrimônio!",
    });
  }

  // 8. Boa poupança
  if (savingsRate !== null && savingsRate >= 30) {
    items.push({
      id: "great-savings",
      type: "positive",
      text: `Excelente! Sua taxa de poupança de ${savingsRate.toFixed(1)}% está acima da média brasileira.`,
    });
  }

  // 9. Metas atrasadas (GOAL_UNDERFUNDED)
  if (goals.length > 0 && accounts.length > 0) {
    const behindGoals = goals.filter((g) => {
      if (!g.is_active) return false;
      const progress = getGoalProgressPercent(g, accounts);
      if (progress >= 100) return false;
      const gap = getContributionGapPercent(g, accounts);
      return gap > 15;
    });
    if (behindGoals.length > 0) {
      const names = behindGoals
        .slice(0, 2)
        .map((g) => `"${g.name}"`)
        .join(" e ");
      items.push({
        id: "goal-underfunded",
        type: "warning",
        text: `${behindGoals.length === 1 ? "A meta" : "As metas"} ${names} ${behindGoals.length === 1 ? "está" : "estão"} abaixo do ritmo necessário. Revise suas contribuições.`,
      });
    }
  }

  // 10. Metas com prazo próximo (GOAL_DEADLINE_CLOSE)
  if (goals.length > 0 && accounts.length > 0) {
    const closeGoals = goals.filter((g) => {
      if (!g.is_active) return false;
      const progress = getGoalProgressPercent(g, accounts);
      if (progress >= 100) return false;
      const months = getMonthsRemaining(g);
      return months > 0 && months <= 3;
    });
    if (closeGoals.length > 0) {
      const g = closeGoals[0];
      const months = getMonthsRemaining(g);
      items.push({
        id: "goal-deadline-close",
        type: "alert",
        text: `A meta "${g.name}" vence em ${months} ${months === 1 ? "mês" : "meses"} e ainda não foi alcançada.`,
      });
    }
  }

  // 11. Poupança persistentemente baixa (SAVINGS_TOO_LOW)
  if (pastSavingsRates.length >= 3 && pastSavingsRates.every((r) => r < 10)) {
    const avg = pastSavingsRates.reduce((s, r) => s + r, 0) / pastSavingsRates.length;
    items.push({
      id: "savings-too-low",
      type: "alert",
      text: `Sua taxa de poupança ficou abaixo de 10% nos últimos ${pastSavingsRates.length} meses (média ${avg.toFixed(1)}%). Avalie cortar gastos variáveis.`,
    });
  }

  // 12. Provisionamento de despesas anuais (PROVISION_MISSING)
  if (annualProvisions.length > 0) {
    const top = annualProvisions[0];
    const monthly = Math.ceil(top.amountCents / 12);
    items.push({
      id: "provision-missing",
      type: "warning",
      text: `Despesa anual detectada: "${top.description}" (${formatCurrency(top.amountCents)}). Provisione ~${formatCurrency(monthly)}/mês para evitar surpresas.`,
    });
  }

  // 13. Dívida/Renda alta (DEBT_TO_INCOME_HIGH)
  if (debts.length > 0 && totalReceitas > 0) {
    const activeDebts = debts.filter(
      (d) => d.is_active && d.remaining_amount_cents > 0
    );
    const totalPayments = activeDebts.reduce(
      (sum, d) => sum + d.monthly_payment_cents,
      0
    );
    const ratio = (totalPayments / totalReceitas) * 100;
    if (ratio > 30) {
      items.push({
        id: "debt-to-income-high",
        type: "alert",
        text: `Suas parcelas de dívidas consomem ${ratio.toFixed(0)}% da receita. O ideal é abaixo de 30%.`,
      });
    }
  }

  // 14. Juros altos (DEBT_HIGH_INTEREST)
  if (debts.length > 0) {
    const highInterest = debts.filter(
      (d) =>
        d.is_active &&
        d.remaining_amount_cents > 0 &&
        Number(d.interest_rate_monthly) > 3
    );
    if (highInterest.length > 0) {
      const worst = highInterest.sort(
        (a, b) =>
          Number(b.interest_rate_monthly) - Number(a.interest_rate_monthly)
      )[0];
      items.push({
        id: "debt-high-interest",
        type: "warning",
        text: `A dívida "${worst.name}" tem juros de ${Number(worst.interest_rate_monthly).toFixed(1)}%/mês. Considere renegociar ou priorizar o pagamento.`,
      });
    }
  }

  // 15. Divergência de saldo (BALANCE_DIVERGENCE)
  if (hasDivergentAccounts) {
    items.push({
      id: "balance-divergence",
      type: "warning",
      text: "Há contas com divergência entre saldo registrado e calculado. Acesse Contas → Reconciliar para verificar.",
    });
  }

  return items;
  }, [totalReceitas, totalDespesas, savingsRate, runway, reserveMonths, forecast, hasInvestments, reserveTargetMonths, goals, accounts, pastSavingsRates, annualProvisions, hasDivergentAccounts, debts]);

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
