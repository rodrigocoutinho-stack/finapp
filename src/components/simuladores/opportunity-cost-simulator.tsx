"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { opportunityCost } from "@/lib/simulator-utils";

const AreaChart = dynamic(
  () => import("recharts").then((m) => m.AreaChart),
  { ssr: false }
);
const Area = dynamic(
  () => import("recharts").then((m) => m.Area),
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

export function OpportunityCostSimulator() {
  const [monthlyExpense, setMonthlyExpense] = useState(200);
  const [monthlyRate, setMonthlyRate] = useState(0.8);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => opportunityCost(monthlyExpense, monthlyRate, years),
    [monthlyExpense, monthlyRate, years]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Descubra quanto aquele gasto recorrente &quot;pequeno&quot; custaria se fosse investido.
        Um cafezinho de R$ 10/dia vira R$ 300/mês — em 10 anos pode virar uma fortuna.
      </p>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gasto mensal (R$)
          </label>
          <input
            type="number"
            min={0}
            max={100000}
            step={10}
            value={monthlyExpense}
            onChange={(e) => setMonthlyExpense(Math.max(0, Number(e.target.value)))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={8}
          />
          <p className="text-xs text-slate-400 mt-1">
            Streaming, delivery, assinaturas...
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Rendimento mensal (%)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.01}
            value={monthlyRate}
            onChange={(e) => setMonthlyRate(Math.max(0, Math.min(10, Number(e.target.value))))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={5}
          />
          <p className="text-xs text-slate-400 mt-1">
            CDI ~1%/mês • Poupança ~0,5%/mês
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Período (anos): {years}
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-violet-600"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>1 ano</span>
            <span>30 anos</span>
          </div>
        </div>
      </div>

      {/* Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-slate-600 mb-1">Total gasto</p>
          <p className="text-lg font-bold text-slate-700">{formatBRL(result.totalSpent)}</p>
        </div>
        <div className="bg-violet-50 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-violet-600 mb-1">Poderia ter virado</p>
          <p className="text-lg font-bold text-violet-700">{formatBRL(result.couldHaveBeen)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-xs font-medium text-amber-600 mb-1">Juros perdidos</p>
          <p className="text-lg font-bold text-amber-700">{formatBRL(result.difference)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Gasto acumulado vs patrimônio potencial</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.yearlyData.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}a`}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => formatBRL(Number(value))}
                labelFormatter={(label) => `Ano ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="couldHaveBeen"
                name="Se investisse"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalSpent"
                name="Total gasto"
                stroke="#94a3b8"
                fill="#94a3b8"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
