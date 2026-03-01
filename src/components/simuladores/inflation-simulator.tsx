"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { inflationImpact } from "@/lib/simulator-utils";
import { getIPCA12Months } from "@/lib/inflation";
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

export function InflationSimulator() {
  const colors = useChartColors();
  const [currentValue, setCurrentValue] = useState(1000);
  const [annualInflation, setAnnualInflation] = useState(5);
  const [years, setYears] = useState(10);
  const [ipcaLoaded, setIpcaLoaded] = useState(false);

  // Load current IPCA as default
  useEffect(() => {
    let cancelled = false;
    getIPCA12Months().then((ipca) => {
      if (!cancelled && ipca !== null && !ipcaLoaded) {
        setAnnualInflation(Math.round(ipca * 100) / 100);
        setIpcaLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [ipcaLoaded]);

  const result = useMemo(
    () => inflationImpact(currentValue, annualInflation, years),
    [currentValue, annualInflation, years]
  );

  const lossPercent = currentValue > 0
    ? Math.round((result.purchasingPowerLoss / currentValue) * 10000) / 100
    : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-on-surface-muted">
        Descubra quanto o seu dinheiro perde de poder de compra com o passar do tempo.
        Dinheiro parado desvaloriza — a inflação corrói silenciosamente o seu patrimônio.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Valor atual (R$)
          </label>
          <input
            type="number"
            min={0}
            max={10000000}
            step={100}
            value={currentValue}
            onChange={(e) => setCurrentValue(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={10}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Inflação anual (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={annualInflation}
            onChange={(e) => setAnnualInflation(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={5}
          />
          <p className="text-xs text-on-surface-muted mt-1">
            IPCA atual usado como padrão
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-1">
            Período (anos): {years}
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-rose-600"
          />
          <div className="flex justify-between text-xs text-on-surface-muted">
            <span>1 ano</span>
            <span>30 anos</span>
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-alt rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-on-surface-secondary mb-1">Valor nominal</p>
          <p className="text-lg font-bold text-on-surface-secondary">{formatBRL(result.futureNominal)}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-rose-600 mb-1">Poder de compra real</p>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300">{formatBRL(result.futureReal)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Perda de poder de compra</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">
            {formatBRL(result.purchasingPowerLoss)} ({lossPercent}%)
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-sm font-medium text-on-surface-secondary mb-4">Valor real ao longo do tempo</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.yearlyData.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: colors.text }}
                tickFormatter={(v) => `${v}a`}
              />
              <YAxis
                tick={{ fontSize: 11, fill: colors.text }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: colors.tooltip.bg, borderColor: colors.tooltip.border }}
                formatter={(value) => formatBRL(Number(value))}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend />
              <Bar dataKey="nominalValue" name="Valor nominal" fill={colors.muted} radius={[4, 4, 0, 0]} />
              <Bar dataKey="realValue" name="Poder de compra" fill={colors.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
