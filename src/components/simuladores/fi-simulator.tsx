"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { fiSimulation } from "@/lib/simulator-utils";
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
const ReferenceLine = dynamic(
  () => import("recharts").then((m) => m.ReferenceLine),
  { ssr: false }
);

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toFixed(0);
}

export function FISimulator() {
  const colors = useChartColors();
  const [monthlyExpense, setMonthlyExpense] = useState(5000);
  const [currentPatrimony, setCurrentPatrimony] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [swr, setSwr] = useState(4);
  const [realReturnBase, setRealReturnBase] = useState(5);

  const result = useMemo(
    () => fiSimulation(monthlyExpense, currentPatrimony, monthlyContribution, swr, realReturnBase),
    [monthlyExpense, currentPatrimony, monthlyContribution, swr, realReturnBase]
  );

  // Downsample: show at most ~30 points
  const chartData = useMemo(() => {
    const data = result.yearlyData;
    if (data.length <= 30) return data;
    const step = Math.ceil(data.length / 30);
    return data.filter((_, i) => i % step === 0 || i === data.length - 1);
  }, [result.yearlyData]);

  function formatYears(years: number | null): string {
    if (years === null) return "60+ anos";
    if (years === 1) return "1 ano";
    return `${years} anos`;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-on-surface-muted">
        Descubra quanto você precisa acumular para viver de renda. O simulador calcula o patrimônio
        alvo com base na taxa de retirada segura (SWR) e projeta 3 cenários de retorno real.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Gasto mensal desejado (R$)
          </label>
          <input
            type="number"
            min={0}
            max={1000000}
            step={100}
            value={monthlyExpense}
            onChange={(e) => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-on-surface-muted mt-1">
            Quanto você quer gastar por mês na independência financeira
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Patrimônio atual (R$)
          </label>
          <input
            type="number"
            min={0}
            max={100000000}
            step={1000}
            value={currentPatrimony}
            onChange={(e) => setCurrentPatrimony(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            step={100}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Retorno real anual (%): {realReturnBase}%
          </label>
          <input
            type="range"
            min={0}
            max={12}
            step={0.5}
            value={realReturnBase}
            onChange={(e) => setRealReturnBase(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-on-surface-muted">
            <span>0%</span>
            <span>Poupança ~2%</span>
            <span>CDI ~5%</span>
            <span>12%</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Taxa de retirada segura (SWR): {swr}% a.a.
          </label>
          <input
            type="range"
            min={2}
            max={6}
            step={0.5}
            value={swr}
            onChange={(e) => setSwr(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-on-surface-muted">
            <span>2% (conservador)</span>
            <span>4% (clássico)</span>
            <span>6% (agressivo)</span>
          </div>
        </div>
      </div>

      {/* Target Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Patrimônio alvo (IF)</p>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {formatBRL(result.targetPatrimony)}
            </p>
            <p className="text-xs text-emerald-600 mt-1">
              Gasto anual de {formatBRL(monthlyExpense * 12)} ÷ SWR de {swr}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Progresso atual</p>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
              {(result.currentProgress * 100).toFixed(1)}%
            </p>
            <div className="w-32 bg-emerald-200 dark:bg-emerald-700 rounded-full h-2 mt-1">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, result.currentProgress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {result.scenarios.map((scenario, i) => {
          const colors = [
            { bg: "bg-orange-50 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", label: "text-orange-600 dark:text-orange-400" },
            { bg: "bg-blue-50 dark:bg-blue-950", text: "text-blue-700", label: "text-blue-600" },
            { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300", label: "text-emerald-600" },
          ];
          const c = colors[i];
          return (
            <div key={scenario.label} className={`${c.bg} rounded-xl p-4`}>
              <p className={`text-xs font-medium ${c.label} mb-1`}>
                {scenario.label} ({scenario.annualRealReturn}% a.a.)
              </p>
              <p className={`text-lg font-bold ${c.text}`}>
                {formatYears(scenario.yearsToTarget)}
              </p>
              <p className={`text-xs ${c.label} mt-1`}>
                Patrimônio em 60a: {formatBRL(scenario.finalPatrimony)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {result.scenarios[1].yearsToTarget !== null && (
        <div className="bg-surface-alt rounded-xl p-4 border border-border">
          <p className="text-sm text-on-surface-secondary">
            <span className="font-medium">Alavanca principal:</span>{" "}
            {monthlyContribution > 0 ? (
              <>
                Se você aumentar o aporte mensal em{" "}
                <strong>{formatBRL(monthlyContribution * 0.2)}</strong> (20%),
                o cenário base cairia de{" "}
                <strong>{formatYears(result.scenarios[1].yearsToTarget)}</strong> para{" "}
                <strong>
                  {formatYears(
                    fiSimulation(
                      monthlyExpense,
                      currentPatrimony,
                      monthlyContribution * 1.2,
                      swr,
                      realReturnBase
                    ).scenarios[1].yearsToTarget
                  )}
                </strong>.
              </>
            ) : (
              <>
                Sem aporte mensal, a independência financeira dependerá exclusivamente do
                rendimento do patrimônio atual.
              </>
            )}
          </p>
        </div>
      )}

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-on-surface-secondary mb-4">
          Trajetória do patrimônio (valores reais)
        </h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: colors.text }}
                tickFormatter={(v) => `${v}a`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.text }}
                tickFormatter={(v) => formatCompact(Number(v))}
              />
              <Tooltip
                contentStyle={{ backgroundColor: colors.tooltip.bg, borderColor: colors.tooltip.border }}
                formatter={(value) => formatBRL(Number(value))}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend />
              <ReferenceLine
                y={result.targetPatrimony}
                stroke={colors.red}
                strokeDasharray="8 4"
                strokeWidth={2}
                label={{
                  value: `Meta: ${formatCompact(result.targetPatrimony)}`,
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: colors.red,
                }}
              />
              <Line
                type="monotone"
                dataKey="conservative"
                name="Conservador"
                stroke={colors.orange}
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="base"
                name="Base"
                stroke={colors.blue}
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="optimistic"
                name="Otimista"
                stroke={colors.emerald}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Premissas */}
      <div className="text-xs text-on-surface-muted space-y-1">
        <p><strong>Premissas:</strong></p>
        <p>- Valores em termos reais (já descontada a inflação). Retorno real = retorno nominal − inflação.</p>
        <p>- Cenário conservador usa retorno real {Math.max(0, realReturnBase - 2)}% a.a., base {realReturnBase}% a.a., otimista {realReturnBase + 2}% a.a.</p>
        <p>- SWR de {swr}% a.a. significa retirar {formatBRL(result.targetPatrimony * swr / 100)} por ano do patrimônio.</p>
        <p>- Este simulador é educacional e não constitui recomendação financeira.</p>
      </div>
    </div>
  );
}
