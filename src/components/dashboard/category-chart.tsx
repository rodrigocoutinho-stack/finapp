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
import { CategoryIcon } from "@/lib/category-icons";

interface CategoryData {
  name: string;
  amount: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6",
];

// Custom Y-axis tick with category icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomYTick({ x, y, payload }: any) {
  const name = payload?.value ?? "";
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-130} y={-10} width={125} height={20}>
        <div className="flex items-center gap-1.5 justify-end h-full">
          <CategoryIcon name={name} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[13px] text-slate-600 truncate">{name}</span>
        </div>
      </foreignObject>
    </g>
  );
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8 text-sm">
        Nenhuma despesa registrada neste mês.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={data.length * 48 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={135}
          tick={<CustomYTick />}
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
        <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={28}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
