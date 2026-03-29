"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-card rounded-lg border border-border px-3 py-2 shadow-lg text-[13px]">
      <p className="font-semibold text-on-surface-secondary">{name}</p>
      <p className="text-on-surface-secondary">{formatCurrency(value)}</p>
    </div>
  );
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-on-surface-muted text-center py-8 text-sm">
        Nenhuma despesa registrada neste mês.
      </p>
    );
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 sm:flex-row">
      {/* Donut chart */}
      <div className="relative w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="48%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-on-surface-muted">Total</span>
          <span className="text-base font-bold text-on-surface-heading">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 min-w-0 space-y-2 w-full">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0.0";
          return (
            <div key={item.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <CategoryIcon
                name={item.name}
                className="w-4 h-4 text-on-surface-muted shrink-0"
              />
              <span className="truncate text-on-surface-secondary flex-1 min-w-0">
                {item.name}
              </span>
              <span className="text-on-surface-muted shrink-0 tabular-nums">
                {pct}%
              </span>
              <span className="font-medium text-on-surface-heading shrink-0 tabular-nums">
                {formatCurrency(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
