"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface FinancialKPIsProps {
  totalReceitas: number;
  totalDespesas: number;
  totalBalance: number;
  avgMonthlyExpense: number;
  reserveBalance: number;
  hasReserveAccount: boolean;
  reserveTargetMonths: number;
  forecastDespesas?: number;
  totalRecurringDespesas?: number;
}

export function FinancialKPIs({
  totalReceitas,
  totalDespesas,
  totalBalance,
  avgMonthlyExpense,
  reserveBalance,
  hasReserveAccount,
  reserveTargetMonths,
  forecastDespesas,
  totalRecurringDespesas,
}: FinancialKPIsProps) {
  // Taxa de Poupança
  const savingsRate =
    totalReceitas > 0
      ? ((totalReceitas - totalDespesas) / totalReceitas) * 100
      : null;

  // Runway Financeiro
  const runway =
    avgMonthlyExpense > 0 ? totalBalance / avgMonthlyExpense : null;

  // Reserva de Emergência
  const reserveMonths =
    hasReserveAccount && avgMonthlyExpense > 0
      ? reserveBalance / avgMonthlyExpense
      : null;

  const reservePercent =
    reserveMonths !== null && reserveTargetMonths > 0
      ? (reserveMonths / reserveTargetMonths) * 100
      : null;

  // Desvio Orçamentário
  const budgetDeviation =
    forecastDespesas !== undefined && forecastDespesas > 0
      ? (Math.abs(totalDespesas - forecastDespesas) / forecastDespesas) * 100
      : null;

  // % Gasto Fixo
  const fixedExpensePercent =
    totalRecurringDespesas !== undefined && totalReceitas > 0
      ? (totalRecurringDespesas / totalReceitas) * 100
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {/* Taxa de Poupança */}
      <KPICard
        label="Taxa de Poupança"
        value={savingsRate !== null ? `${savingsRate.toFixed(1)}%` : "—"}
        sublabel={
          savingsRate !== null
            ? `${formatCurrency(totalReceitas - totalDespesas)} poupados`
            : "Sem receitas no período"
        }
        color={getColor(savingsRate, 20, 10)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        }
      />

      {/* Runway Financeiro */}
      <KPICard
        label="Runway Financeiro"
        value={runway !== null ? `${runway.toFixed(1)} meses` : "—"}
        sublabel={
          runway !== null
            ? `Saldo: ${formatCurrency(totalBalance)}`
            : "Sem dados de despesa"
        }
        color={getColor(runway, 6, 3)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* Reserva de Emergência */}
      <KPICard
        label="Reserva de Emergência"
        value={
          !hasReserveAccount
            ? "Não configurada"
            : reserveMonths !== null
              ? `${reserveMonths.toFixed(1)} meses`
              : "—"
        }
        sublabel={
          !hasReserveAccount ? (
            <Link href="/contas" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Configurar em Contas
            </Link>
          ) : reserveMonths !== null ? (
            <span className="flex flex-col gap-1">
              <span>{reserveMonths.toFixed(1)} / {reserveTargetMonths} meses ({Math.min(reservePercent ?? 0, 100).toFixed(0)}%)</span>
              <span className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-200 overflow-hidden">
                <span
                  className={`block h-full rounded-full transition-all ${
                    (reservePercent ?? 0) >= 100 ? "bg-emerald-500" : (reservePercent ?? 0) >= 50 ? "bg-yellow-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(reservePercent ?? 0, 100)}%` }}
                />
              </span>
            </span>
          ) : (
            `Saldo: ${formatCurrency(reserveBalance)}`
          )
        }
        color={
          !hasReserveAccount
            ? "slate"
            : getColor(
                reservePercent !== null ? reservePercent : null,
                100,
                50
              )
        }
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        }
      />

      {/* Desvio Orçamentário */}
      <KPICard
        label="Desvio Orçamentário"
        value={budgetDeviation !== null ? `${budgetDeviation.toFixed(1)}%` : "—"}
        sublabel={
          budgetDeviation !== null
            ? totalDespesas > (forecastDespesas ?? 0)
              ? "Acima do previsto"
              : "Abaixo do previsto"
            : "Sem previsão disponível"
        }
        color={getColorInverse(budgetDeviation, 10, 25)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        }
      />

      {/* % Gasto Fixo */}
      <KPICard
        label="% Gasto Fixo"
        value={fixedExpensePercent !== null ? `${fixedExpensePercent.toFixed(1)}%` : "—"}
        sublabel={
          fixedExpensePercent !== null
            ? `${formatCurrency(totalRecurringDespesas ?? 0)} fixos`
            : "Sem dados de recorrentes"
        }
        color={getColorInverse(fixedExpensePercent, 50, 70)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        }
      />
    </div>
  );
}

type KPIColor = "emerald" | "yellow" | "rose" | "slate";

function getColor(value: number | null, good: number, warning: number): KPIColor {
  if (value === null) return "slate";
  if (value >= good) return "emerald";
  if (value >= warning) return "yellow";
  return "rose";
}

// Inverse: lower is better (e.g. deviation %)
function getColorInverse(value: number | null, good: number, warning: number): KPIColor {
  if (value === null) return "slate";
  if (value <= good) return "emerald";
  if (value <= warning) return "yellow";
  return "rose";
}

const colorStyles: Record<KPIColor, { bg: string; icon: string; value: string }> = {
  emerald: {
    bg: "bg-emerald-50 border-emerald-200",
    icon: "text-emerald-600 bg-emerald-100",
    value: "text-emerald-700",
  },
  yellow: {
    bg: "bg-yellow-50 border-yellow-200",
    icon: "text-yellow-600 bg-yellow-100",
    value: "text-yellow-700",
  },
  rose: {
    bg: "bg-rose-50 border-rose-200",
    icon: "text-rose-600 bg-rose-100",
    value: "text-rose-700",
  },
  slate: {
    bg: "bg-slate-50 border-slate-200",
    icon: "text-slate-500 bg-slate-100",
    value: "text-slate-600",
  },
};

function KPICard({
  label,
  value,
  sublabel,
  color,
  icon,
}: {
  label: string;
  value: string;
  sublabel: React.ReactNode;
  color: KPIColor;
  icon: React.ReactNode;
}) {
  const styles = colorStyles[color];

  return (
    <div className={`rounded-xl border p-4 ${styles.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${styles.icon}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`text-lg font-bold ${styles.value}`}>{value}</p>
          <div className="text-xs text-slate-500 truncate">{sublabel}</div>
        </div>
      </div>
    </div>
  );
}
