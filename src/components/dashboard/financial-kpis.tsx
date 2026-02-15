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
}

export function FinancialKPIs({
  totalReceitas,
  totalDespesas,
  totalBalance,
  avgMonthlyExpense,
  reserveBalance,
  hasReserveAccount,
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          ) : (
            `Saldo: ${formatCurrency(reserveBalance)}`
          )
        }
        color={!hasReserveAccount ? "slate" : getColor(reserveMonths, 6, 3)}
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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
          <p className="text-xs text-slate-500 truncate">{sublabel}</p>
        </div>
      </div>
    </div>
  );
}
