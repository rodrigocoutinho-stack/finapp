"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { NetRevenueBlockBreakdown } from "@/lib/net-revenue";

interface NetRevenueBlocksProps {
  blocks: NetRevenueBlockBreakdown[];
}

export function NetRevenueBlocks({ blocks }: NetRevenueBlocksProps) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block) => (
        <NetRevenueBlockCard key={block.groupName} block={block} />
      ))}
    </div>
  );
}

function NetRevenueBlockCard({ block }: { block: NetRevenueBlockBreakdown }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = block.netCents >= 0;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-tab-bg transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-on-surface-muted transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <div className="text-left">
            <p className="text-sm font-semibold text-on-surface-heading">
              Lucro — {block.groupName}
            </p>
            <p className="text-xs text-on-surface-muted">
              Receita líquida consolidada (entra nas Receitas PF)
            </p>
          </div>
        </div>
        <p
          className={`text-lg font-bold tabular-nums ${
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {formatCurrency(block.netCents)}
        </p>
      </button>

      {expanded && (
        <div className="border-t border-border bg-tab-bg/40 px-5 py-4 space-y-2">
          <BreakdownRow
            label="(+) Receita bruta"
            value={block.grossReceitasCents}
            tone="receita"
            bold
          />
          {block.items
            .filter((i) => i.type === "receita")
            .map((i) => (
              <BreakdownRow
                key={`r-${i.categoryName}`}
                label={i.categoryName}
                value={i.amountCents}
                tone="receita"
                indent
              />
            ))}

          <BreakdownRow
            label="(−) Custos / Impostos"
            value={block.grossDespesasCents}
            tone="despesa"
            bold
          />
          {block.items
            .filter((i) => i.type === "despesa")
            .map((i) => (
              <BreakdownRow
                key={`d-${i.categoryName}`}
                label={i.categoryName}
                value={i.amountCents}
                tone="despesa"
                indent
              />
            ))}

          <div className="border-t border-border pt-2 mt-2">
            <BreakdownRow
              label="(=) Lucro distribuído"
              value={block.netCents}
              tone={isPositive ? "positivo" : "despesa"}
              bold
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  tone,
  indent = false,
  bold = false,
}: {
  label: string;
  value: number;
  tone: "receita" | "despesa" | "positivo";
  indent?: boolean;
  bold?: boolean;
}) {
  const colorClass =
    tone === "receita"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "despesa"
      ? "text-rose-600 dark:text-rose-400"
      : value >= 0
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";
  return (
    <div className={`flex items-center justify-between text-sm ${indent ? "pl-6" : ""}`}>
      <span className={`${bold ? "font-semibold text-on-surface" : "text-on-surface-muted"}`}>
        {label}
      </span>
      <span className={`${bold ? "font-semibold" : ""} ${colorClass} tabular-nums`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}
