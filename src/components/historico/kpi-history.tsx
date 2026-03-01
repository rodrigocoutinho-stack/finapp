"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import type { MonthlyClosingRow } from "@/types/database";

const LineChart = dynamic(
  () => import("recharts").then((m) => m.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((m) => m.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((m) => m.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((m) => m.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((m) => m.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((m) => m.Legend),
  { ssr: false }
);

interface KpiHistoryProps {
  closings: MonthlyClosingRow[];
}

function centsToReais(cents: number): number {
  return cents / 100;
}

function currencyTickFormatter(value: number): string {
  if (Math.abs(value) >= 100000) return `R$${(value / 1000).toFixed(0)}k`;
  return formatCurrency(Math.round(value * 100));
}

export function KpiHistory({ closings }: KpiHistoryProps) {
  const sorted = useMemo(
    () => [...closings].sort((a, b) => a.month.localeCompare(b.month)),
    [closings]
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  // Chart data: values in reais for display
  const chartData = useMemo(
    () =>
      sorted.map((c) => ({
        month: formatMonthLabel(c.month),
        receitas: centsToReais(c.total_income_cents),
        despesas: centsToReais(c.total_expense_cents),
        saldo: centsToReais(c.total_balance_cents ?? 0),
        savings_rate: c.savings_rate,
        runway_months: c.runway_months,
        reserve_months: c.reserve_months,
      })),
    [sorted]
  );

  // Table data: most recent first
  const tableData = useMemo(() => [...sorted].reverse(), [sorted]);

  // Delta helpers
  const balanceDelta =
    (last.total_balance_cents ?? 0) - (first.total_balance_cents ?? 0);
  const savingsDelta =
    last.savings_rate !== null && first.savings_rate !== null
      ? last.savings_rate - first.savings_rate
      : null;

  return (
    <div className="space-y-8">
      {/* Section A: Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Saldo Total"
          value={formatCurrency(last.total_balance_cents ?? 0)}
          delta={balanceDelta}
          deltaLabel={formatCurrency(Math.abs(balanceDelta))}
          isCurrency
        />
        <SummaryCard
          label="Taxa de Poupanca"
          value={last.savings_rate !== null ? `${last.savings_rate.toFixed(1)}%` : "\u2014"}
          delta={savingsDelta}
          deltaLabel={savingsDelta !== null ? `${Math.abs(savingsDelta).toFixed(1)}pp` : null}
        />
        <SummaryCard
          label="Runway"
          value={last.runway_months !== null ? `${last.runway_months.toFixed(1)}m` : "\u2014"}
        />
        <SummaryCard
          label="Reserva"
          value={last.reserve_months !== null ? `${last.reserve_months.toFixed(1)}m` : "\u2014"}
        />
      </div>

      {/* Section B: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue vs Expenses vs Balance */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Receitas vs Despesas vs Saldo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={currencyTickFormatter} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Math.round(Number(value) * 100)),
                  name === "receitas" ? "Receitas" : name === "despesas" ? "Despesas" : "Saldo",
                ]}
              />
              <Legend
                formatter={(value: string) =>
                  value === "receitas" ? "Receitas" : value === "despesas" ? "Despesas" : "Saldo"
                }
              />
              <Line
                type="monotone"
                dataKey="receitas"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="despesas"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Financial Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            Saude Financeira
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => `${v}m`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === "savings_rate") return [`${v.toFixed(1)}%`, "Taxa Poupanca"];
                  if (name === "runway_months") return [`${v.toFixed(1)}m`, "Runway"];
                  return [`${v.toFixed(1)}m`, "Reserva"];
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === "savings_rate"
                    ? "Taxa Poupanca"
                    : value === "runway_months"
                      ? "Runway"
                      : "Reserva"
                }
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="savings_rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="runway_months"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="reserve_months"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section C: Data Table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">
          Historico Detalhado
        </h3>
        <DataTable<MonthlyClosingRow>
          columns={tableColumns}
          data={tableData}
          keyExtractor={(item) => item.id}
        />
      </div>
    </div>
  );
}

const tableColumns = [
  {
    key: "month",
    header: "Mes",
    render: (row: MonthlyClosingRow) => (
      <span className="font-medium text-slate-700">
        {formatMonthLabel(row.month)}
      </span>
    ),
  },
  {
    key: "income",
    header: "Receitas",
    render: (row: MonthlyClosingRow) => (
      <span className="text-emerald-600 tabular-nums">
        {formatCurrency(row.total_income_cents)}
      </span>
    ),
  },
  {
    key: "expense",
    header: "Despesas",
    render: (row: MonthlyClosingRow) => (
      <span className="text-rose-600 tabular-nums">
        {formatCurrency(row.total_expense_cents)}
      </span>
    ),
  },
  {
    key: "savings",
    header: "Poupanca",
    render: (row: MonthlyClosingRow) => (
      <span className="tabular-nums">
        {row.savings_rate !== null ? `${row.savings_rate.toFixed(1)}%` : "\u2014"}
      </span>
    ),
  },
  {
    key: "runway",
    header: "Runway",
    render: (row: MonthlyClosingRow) => (
      <span className="tabular-nums">
        {row.runway_months !== null ? `${row.runway_months.toFixed(1)}m` : "\u2014"}
      </span>
    ),
  },
  {
    key: "reserve",
    header: "Reserva",
    render: (row: MonthlyClosingRow) => (
      <span className="tabular-nums">
        {row.reserve_months !== null ? `${row.reserve_months.toFixed(1)}m` : "\u2014"}
      </span>
    ),
  },
  {
    key: "deviation",
    header: "Desvio Orc.",
    render: (row: MonthlyClosingRow) => (
      <span className="tabular-nums">
        {row.budget_deviation !== null ? `${row.budget_deviation.toFixed(1)}%` : "\u2014"}
      </span>
    ),
  },
  {
    key: "notes",
    header: "Notas",
    render: (row: MonthlyClosingRow) => (
      <span className="text-slate-500 truncate max-w-[150px] block" title={row.notes ?? ""}>
        {row.notes ?? "\u2014"}
      </span>
    ),
  },
];

function SummaryCard({
  label,
  value,
  delta,
  deltaLabel,
  isCurrency,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string | null;
  isCurrency?: boolean;
}) {
  const hasPositiveDelta = delta !== null && delta !== undefined && delta >= 0;
  const hasNegativeDelta = delta !== null && delta !== undefined && delta < 0;
  const showDelta = deltaLabel && delta !== null && delta !== undefined;

  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-700 tabular-nums">{value}</p>
      {showDelta && (
        <p
          className={`text-xs tabular-nums ${
            isCurrency
              ? hasPositiveDelta
                ? "text-emerald-600"
                : "text-rose-600"
              : hasPositiveDelta
                ? "text-emerald-600"
                : "text-rose-600"
          }`}
        >
          {hasPositiveDelta ? "+" : hasNegativeDelta ? "-" : ""}
          {deltaLabel} vs primeiro mes
        </p>
      )}
    </div>
  );
}
