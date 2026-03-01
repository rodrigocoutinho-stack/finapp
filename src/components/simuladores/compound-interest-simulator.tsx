"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { compoundInterest } from "@/lib/simulator-utils";
import { useChartColors } from "@/lib/use-chart-colors";

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
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);
const Legend = dynamic(
  () => import("recharts").then((m) => m.Legend),
  { ssr: false }
);

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CompoundInterestSimulator() {
  const colors = useChartColors();
  const [principal, setPrincipal] = useState(1000);
  const [monthlyRate, setMonthlyRate] = useState(0.8);
  const [months, setMonths] = useState(60);
  const [monthlyContribution, setMonthlyContribution] = useState(500);

  const result = useMemo(
    () => compoundInterest(principal, monthlyRate, months, monthlyContribution),
    [principal, monthlyRate, months, monthlyContribution]
  );

  // Downsample data for chart (show at most ~30 points)
  const chartData = useMemo(() => {
    const data = result.monthlyData;
    if (data.length <= 30) return data;
    const step = Math.ceil(data.length / 30);
    const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);
    return sampled;
  }, [result.monthlyData]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-on-surface-muted">
        Simule quanto seu dinheiro pode render com juros compostos ao longo do tempo.
        Os juros compostos fazem seu dinheiro crescer exponencialmente — quanto mais tempo, maior o efeito.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Valor inicial (R$)
          </label>
          <input
            type="number"
            min={0}
            max={10000000}
            step={100}
            value={principal}
            onChange={(e) => setPrincipal(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={10}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Aporte mensal (R$)
          </label>
          <input
            type="number"
            min={0}
            max={1000000}
            step={50}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={10}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Taxa mensal (%)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.01}
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(Math.max(0, Math.min(10, Number(e.target.value))))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={5}
          />
          <p className="text-xs text-on-surface-muted mt-1">
            CDI ~1%/mês • Poupança ~0,5%/mês
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Período (meses): {months} ({(months / 12).toFixed(1)} anos)
          </label>
          <input
            type="range"
            min={1}
            max={360}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-on-surface-muted">
            <span>1 mês</span>
            <span>30 anos</span>
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-emerald-600 mb-1">Montante final</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatBRL(result.finalAmount)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-blue-600 mb-1">Total investido</p>
          <p className="text-lg font-bold text-blue-700">{formatBRL(result.totalInvested)}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-amber-600 mb-1">Juros ganhos</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatBRL(result.totalInterest)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-on-surface-secondary mb-4">Evolução do patrimônio</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: colors.text }}
                tickFormatter={(v) => `${v}m`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.text }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: colors.tooltip.bg, borderColor: colors.tooltip.border }}
                formatter={(value) => formatBRL(Number(value))}
                labelFormatter={(label) => `Mês ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                name="Montante"
                stroke={colors.emerald}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="invested"
                name="Investido"
                stroke={colors.blue}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
