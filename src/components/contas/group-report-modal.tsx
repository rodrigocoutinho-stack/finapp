"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";
import { getCompetencyRange, getCurrentCompetencyMonth } from "@/lib/closing-day";
import { deriveCompetencyMonth } from "@/lib/competency";
import { usePreferences } from "@/contexts/preferences-context";
import { useChartColors } from "@/lib/use-chart-colors";

const BarChart = dynamic(
  () => import("recharts").then((m) => m.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import("recharts").then((m) => m.Bar),
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

interface GroupReportModalProps {
  open: boolean;
  onClose: () => void;
  groupName: string;
  accountIds: string[];
}

interface MonthlyGroupData {
  yearMonth: string;
  label: string;
  receitasCents: number;
  despesasCents: number;
  liquidoCents: number;
  margemPct: number;
}

interface MonthRange {
  year: number;
  month: number;
  yearMonth: string;
  start: string;
  end: string;
}

function currencyTickFormatter(value: number): string {
  if (Math.abs(value) >= 100000) return `R$${(value / 1000).toFixed(0)}k`;
  return formatCurrency(Math.round(value * 100));
}

function getLastNMonthRanges(n: number, closingDay: number): MonthRange[] {
  const { year: curYear, month: curMonth } = getCurrentCompetencyMonth(closingDay);
  const ranges: MonthRange[] = [];
  let y = curYear;
  let m = curMonth;
  for (let i = 0; i < n; i++) {
    const { start, end } = getCompetencyRange(y, m, closingDay);
    const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
    ranges.unshift({ year: y, month: m, yearMonth: ym, start, end });
    m--;
    if (m < 0) { m = 11; y--; }
  }
  return ranges;
}

export function GroupReportModal({ open, onClose, groupName, accountIds }: GroupReportModalProps) {
  const supabase = createClient();
  const { closingDay } = usePreferences();
  const colors = useChartColors();
  const [data, setData] = useState<MonthlyGroupData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (accountIds.length === 0) return;
    setLoading(true);

    const ranges = getLastNMonthRanges(6, closingDay);
    const earliest = ranges[0].start;
    const latest = ranges[ranges.length - 1].end;

    // Busca amplo (por date) + também as que têm override apontando para
    // alguma competência do período, mesmo com date fora do range.
    const rangeLabels = new Set(ranges.map((r) => r.yearMonth));
    type ReportTxn = {
      id: string;
      type: string;
      amount_cents: number;
      date: string;
      competency_month: string | null;
    };
    const [byDateRes, byCompetencyRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, type, amount_cents, date, competency_month")
        .in("account_id", accountIds)
        .neq("type", "transferencia")
        .gte("date", earliest)
        .lte("date", latest)
        .limit(10000),
      supabase
        .from("transactions")
        .select("id, type, amount_cents, date, competency_month")
        .in("account_id", accountIds)
        .neq("type", "transferencia")
        .in("competency_month", Array.from(rangeLabels))
        .limit(10000),
    ]);

    const txns = [
      ...((byDateRes.data as ReportTxn[]) ?? []),
      ...((byCompetencyRes.data as ReportTxn[]) ?? []),
    ];
    // Dedupe por id — preserva transações reais com mesmo valor/data/tipo
    const seen = new Set<string>();
    const uniqueTxns = txns.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    const monthMap = new Map<string, { receitas: number; despesas: number }>();
    for (const r of ranges) {
      monthMap.set(r.yearMonth, { receitas: 0, despesas: 0 });
    }

    for (const tx of uniqueTxns) {
      const competency = tx.competency_month ?? deriveCompetencyMonth(tx.date, closingDay);
      const bucket = monthMap.get(competency);
      if (!bucket) continue;
      if (tx.type === "receita") {
        bucket.receitas += tx.amount_cents;
      } else {
        bucket.despesas += tx.amount_cents;
      }
    }

    const result: MonthlyGroupData[] = ranges.map((r) => {
      const bucket = monthMap.get(r.yearMonth)!;
      const liquido = bucket.receitas - bucket.despesas;
      const margem = bucket.receitas > 0 ? (liquido / bucket.receitas) * 100 : 0;
      return {
        yearMonth: r.yearMonth,
        label: formatMonthLabel(r.yearMonth),
        receitasCents: bucket.receitas,
        despesasCents: bucket.despesas,
        liquidoCents: liquido,
        margemPct: Math.round(margem * 10) / 10,
      };
    });

    setData(result);
    setLoading(false);
  }, [accountIds, closingDay]);

  useEffect(() => {
    if (open) fetchReport();
  }, [open, fetchReport]);

  const current = data[data.length - 1];
  const tableData = useMemo(() => [...data].reverse(), [data]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        receitas: d.receitasCents / 100,
        despesas: d.despesasCents / 100,
      })),
    [data]
  );

  const columns = useMemo(
    () => [
      {
        key: "month",
        header: "Mês",
        render: (item: MonthlyGroupData) => (
          <span className="font-medium text-on-surface">{item.label}</span>
        ),
      },
      {
        key: "receitas",
        header: "Receitas",
        render: (item: MonthlyGroupData) => (
          <span className="text-emerald-600 dark:text-emerald-400">
            {formatCurrency(item.receitasCents)}
          </span>
        ),
      },
      {
        key: "despesas",
        header: "Despesas",
        render: (item: MonthlyGroupData) => (
          <span className="text-rose-600 dark:text-rose-400">
            {formatCurrency(item.despesasCents)}
          </span>
        ),
      },
      {
        key: "liquido",
        header: "Líquido",
        render: (item: MonthlyGroupData) => (
          <span
            className={
              item.liquidoCents >= 0
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-rose-600 dark:text-rose-400 font-semibold"
            }
          >
            {formatCurrency(item.liquidoCents)}
          </span>
        ),
      },
      {
        key: "margem",
        header: "Margem",
        render: (item: MonthlyGroupData) => (
          <span
            className={
              item.margemPct >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }
          >
            {item.margemPct.toFixed(1)}%
          </span>
        ),
      },
    ],
    []
  );

  return (
    <Modal open={open} onClose={onClose} title={`Relatório — ${groupName}`} size="4xl">
      {loading || !current ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-alt rounded-lg p-4 animate-pulse h-20" />
            ))}
          </div>
          <div className="bg-surface-alt rounded-lg animate-pulse h-72" />
          <DataTable columns={columns} data={[]} keyExtractor={(d) => d.yearMonth} loading />
        </div>
      ) : data.every((d) => d.receitasCents === 0 && d.despesasCents === 0) ? (
        <p className="text-on-surface-muted text-center py-12">
          Nenhuma transação encontrada para o grupo &quot;{groupName}&quot; nos últimos 6 meses.
        </p>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Faturamento Bruto</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(current.receitasCents)}
              </p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
              <p className="text-xs text-rose-700 dark:text-rose-300 mb-1">Impostos / Despesas</p>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300">
                {formatCurrency(current.despesasCents)}
              </p>
            </div>
            <div
              className={`rounded-lg p-4 border ${
                current.liquidoCents >= 0
                  ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                  : "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800"
              }`}
            >
              <p
                className={`text-xs mb-1 ${
                  current.liquidoCents >= 0
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}
              >
                Líquido
              </p>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-xl font-bold ${
                    current.liquidoCents >= 0
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {formatCurrency(current.liquidoCents)}
                </p>
                <span
                  className={`text-xs ${
                    current.margemPct >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {current.margemPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-medium text-on-surface-secondary mb-4">
              Receitas vs Despesas — Últimos 6 meses
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} barGap={4}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: colors.text, fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: colors.grid }}
                />
                <YAxis
                  tickFormatter={currencyTickFormatter}
                  tick={{ fill: colors.text, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Math.round(Number(value) * 100)),
                    name === "receitas" ? "Receitas" : "Despesas",
                  ]}
                  contentStyle={{
                    backgroundColor: colors.tooltip.bg,
                    border: `1px solid ${colors.tooltip.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "receitas" ? "Receitas" : "Despesas"
                  }
                />
                <Bar
                  dataKey="receitas"
                  fill={colors.emerald}
                  radius={[4, 4, 0, 0]}
                  name="receitas"
                />
                <Bar
                  dataKey="despesas"
                  fill={colors.rose}
                  radius={[4, 4, 0, 0]}
                  name="despesas"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Data table */}
          <DataTable
            columns={columns}
            data={tableData}
            keyExtractor={(d) => d.yearMonth}
            emptyMessage="Nenhum dado disponível."
          />
        </div>
      )}
    </Modal>
  );
}
