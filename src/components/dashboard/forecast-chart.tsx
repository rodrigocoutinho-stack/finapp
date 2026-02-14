"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ForecastChartProps {
  totalReceitas: number;
  totalDespesas: number;
  resultado: number;
}

export function ForecastChart({
  totalReceitas,
  totalDespesas,
  resultado,
}: ForecastChartProps) {
  const data = [
    { name: "Receitas", value: totalReceitas, color: "#22c55e" },
    { name: "Despesas", value: totalDespesas, color: "#f43f5e" },
    { name: "Resultado", value: Math.abs(resultado), color: resultado >= 0 ? "#3b82f6" : "#f97316" },
  ];

  if (totalReceitas === 0 && totalDespesas === 0) {
    return (
      <p className="text-slate-500 text-center py-8 text-sm">
        Sem dados para projeção. Cadastre categorias e transações.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontSize: 13, fill: "#475569" }}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
          }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
