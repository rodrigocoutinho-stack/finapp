"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  getInvestmentGroup,
  getGroupLabel,
  getMonthEndBalance,
  groupOrder,
  type InvestmentGroup,
} from "@/lib/investment-utils";
import type { Investment, InvestmentEntry } from "@/types/database";

interface InvestmentDashboardProps {
  investments: Investment[];
  ipca12m?: number | null;
}

function getMonthColumns(count: number): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${y}-${m}`);
  }
  return months;
}

function formatMonthShort(ym: string): string {
  const [year, month] = ym.split("-");
  const names = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${names[parseInt(month, 10) - 1]}/${year}`;
}

export function InvestmentDashboard({ investments, ipca12m }: InvestmentDashboardProps) {
  const supabase = createClient();
  const [allEntries, setAllEntries] = useState<InvestmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<InvestmentGroup>>(new Set());

  const months = getMonthColumns(6);

  const fetchEntries = useCallback(async () => {
    if (investments.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("investment_entries")
        .select("*")
        .in("investment_id", investments.map((i) => i.id));

      setAllEntries((data as InvestmentEntry[]) ?? []);
    } catch (err) {
      console.error("Erro ao carregar lançamentos de investimentos:", err);
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [investments]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (loading) {
    return <TableSkeleton rows={5} cols={7} />;
  }

  if (investments.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8 text-sm">
        Cadastre investimentos na aba Carteira para ver a evolução.
      </p>
    );
  }

  // Group investments
  const grouped = new Map<InvestmentGroup, Investment[]>();
  for (const inv of investments) {
    const group = getInvestmentGroup(inv.product, inv.indexer);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(inv);
  }

  // Calculate balances per investment per month
  function getBalance(investmentId: string, yearMonth: string): number {
    const invEntries = allEntries.filter((e) => e.investment_id === investmentId);
    return getMonthEndBalance(invEntries, yearMonth);
  }

  function getGroupTotal(group: InvestmentGroup, yearMonth: string): number {
    const items = grouped.get(group) ?? [];
    return items.reduce((sum, inv) => sum + getBalance(inv.id, yearMonth), 0);
  }

  function getGrandTotal(yearMonth: string): number {
    let total = 0;
    for (const [group] of grouped) {
      total += getGroupTotal(group, yearMonth);
    }
    return total;
  }

  function toggleGroup(group: InvestmentGroup) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-4 font-medium text-slate-600 min-w-[180px]">
              Investimento
            </th>
            {months.map((m) => (
              <th
                key={m}
                className="text-right py-2 px-3 font-medium text-slate-600 min-w-[110px]"
              >
                {formatMonthShort(m)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupOrder
            .filter((g) => grouped.has(g))
            .map((group) => {
              const items = grouped.get(group)!;
              const expanded = expandedGroups.has(group);

              return (
                <GroupRows
                  key={group}
                  group={group}
                  items={items}
                  months={months}
                  expanded={expanded}
                  onToggle={() => toggleGroup(group)}
                  getBalance={getBalance}
                  getGroupTotal={getGroupTotal}
                />
              );
            })}

          {/* Total geral */}
          <tr className="border-t-2 border-slate-200">
            <td className="py-3 pr-4 font-semibold text-slate-800">Total</td>
            {months.map((m, idx) => {
              const total = getGrandTotal(m);
              const prevTotal = idx > 0 ? getGrandTotal(months[idx - 1]) : 0;
              const nominalPct = prevTotal > 0 ? ((total / prevTotal) - 1) * 100 : 0;
              const showReal = ipca12m !== null && ipca12m !== undefined && nominalPct !== 0;
              const realPct = showReal
                ? ((1 + nominalPct / 100) / (1 + ipca12m! / 1200) - 1) * 100
                : 0;
              return (
                <td key={m} className="text-right py-3 px-3">
                  <span className="font-bold text-blue-600">
                    {formatCurrency(total)}
                  </span>
                  {showReal && idx > 0 && (
                    <span className="block text-[10px] text-slate-400 tabular-nums">
                      real: {realPct >= 0 ? "+" : ""}{realPct.toFixed(2)}%
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  group,
  items,
  months,
  expanded,
  onToggle,
  getBalance,
  getGroupTotal,
}: {
  group: InvestmentGroup;
  items: Investment[];
  months: string[];
  expanded: boolean;
  onToggle: () => void;
  getBalance: (investmentId: string, yearMonth: string) => number;
  getGroupTotal: (group: InvestmentGroup, yearMonth: string) => number;
}) {
  return (
    <>
      <tr
        className="cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <td className="py-2.5 pr-4 font-semibold text-slate-800">
          <span className="flex items-center gap-1.5">
            <ChevronIcon open={expanded} />
            {getGroupLabel(group)}
          </span>
        </td>
        {months.map((m) => (
          <td key={m} className="text-right py-2.5 px-3 font-semibold text-slate-800">
            {formatCurrency(getGroupTotal(group, m))}
          </td>
        ))}
      </tr>

      {expanded &&
        items.map((inv) => (
          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
            <td className="py-1.5 pr-4 pl-6 text-slate-700">{inv.name}</td>
            {months.map((m) => {
              const bal = getBalance(inv.id, m);
              return (
                <td key={m} className="text-right py-1.5 px-3 text-slate-600">
                  {bal > 0 ? formatCurrency(bal) : "-"}
                </td>
              );
            })}
          </tr>
        ))}
    </>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
