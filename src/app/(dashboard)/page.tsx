"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { DailyFlowTable } from "@/components/dashboard/daily-flow-table";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { CardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { getMonthRange, formatCurrency, formatDate } from "@/lib/utils";
import { calculateDailyFlow, type DailyFlowResult } from "@/lib/daily-flow";
import { getMonthEndBalance } from "@/lib/investment-utils";
import type { InvestmentEntry } from "@/types/database";

interface TransactionRow {
  id: string;
  type: "receita" | "despesa";
  amount_cents: number;
  description: string;
  date: string;
  categories: { name: string } | null;
  accounts: { name: string } | null;
}

interface InvestmentData {
  totalBalance: number;
  projectedReturn: number;
  returnPercent: number;
  hasData: boolean;
}

export default function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [dailyFlow, setDailyFlow] = useState<DailyFlowResult | null>(null);
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    totalBalance: 0,
    projectedReturn: 0,
    returnPercent: 0,
    hasData: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getMonthRange(year, month);

    const [transactionsRes, flowResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, type, amount_cents, description, date, categories(name), accounts(name)")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
      calculateDailyFlow(supabase, year, month),
    ]);

    setTransactions((transactionsRes.data as TransactionRow[]) ?? []);
    setDailyFlow(flowResult);
    setLoading(false);
  }, [supabase, year, month]);

  // Fetch investment data once (does not depend on month)
  useEffect(() => {
    async function fetchInvestments() {
      const [investmentsRes, entriesRes] = await Promise.all([
        supabase
          .from("investments")
          .select("id, product, indexer")
          .eq("is_active", true),
        supabase
          .from("investment_entries")
          .select("investment_id, type, amount_cents, date"),
      ]);

      const investments = investmentsRes.data ?? [];
      const entries = (entriesRes.data ?? []) as InvestmentEntry[];

      if (investments.length === 0) {
        setInvestmentData({
          totalBalance: 0,
          projectedReturn: 0,
          returnPercent: 0,
          hasData: false,
        });
        return;
      }

      const today = new Date();

      // Current month and previous months for comparison
      const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevYM = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
      const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const twoMonthsYM = `${twoMonthsAgo.getFullYear()}-${String(twoMonthsAgo.getMonth() + 1).padStart(2, "0")}`;

      let totalBalance = 0;
      let totalPrevMonth = 0;
      let totalTwoMonthsAgo = 0;

      for (const inv of investments) {
        const invEntries = entries.filter((e) => e.investment_id === inv.id);
        // Current balance: use all entries up to today
        totalBalance += getMonthEndBalance(invEntries, currentYM);
        totalPrevMonth += getMonthEndBalance(invEntries, prevYM);
        totalTwoMonthsAgo += getMonthEndBalance(invEntries, twoMonthsYM);
      }

      // Calculate variation based on last month vs two months ago
      const variacao =
        totalTwoMonthsAgo > 0
          ? (totalPrevMonth / totalTwoMonthsAgo - 1) * 100
          : 0;
      const projectedReturn = Math.round(totalBalance * (variacao / 100));

      setInvestmentData({
        totalBalance,
        projectedReturn,
        returnPercent: variacao,
        hasData: true,
      });
    }

    fetchInvestments();
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const totalReceitas = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalDespesas = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const categoryMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === "despesa")
    .forEach((t) => {
      const catName = t.categories?.name ?? "Sem categoria";
      categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + t.amount_cents);
    });

  const chartData = Array.from(categoryMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">
            Visão geral das suas finanças
          </p>
        </div>
      </div>

      <div className="mb-6">
        <MonthPicker year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      </div>

      {loading ? (
        <div className="space-y-10">
          <CardsSkeleton />
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : (
        <div className="space-y-10">
          <SummaryCards totalReceitas={totalReceitas} totalDespesas={totalDespesas} />

          {dailyFlow && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Fluxo Diário
              </h2>
              <DailyFlowTable data={dailyFlow} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InvestmentSummary
              totalBalance={investmentData.totalBalance}
              projectedReturn={investmentData.projectedReturn}
              returnPercent={investmentData.returnPercent}
              hasData={investmentData.hasData}
            />

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Despesas por Categoria
              </h2>
              <CategoryChart data={chartData} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Últimas Transações
            </h2>
            {recentTransactions.length === 0 ? (
              <p className="text-slate-500 text-sm">
                Nenhuma transação neste mês.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {t.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(t.date)} &middot;{" "}
                        {t.categories?.name ?? "-"} &middot;{" "}
                        {t.accounts?.name ?? "-"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        t.type === "receita" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {t.type === "receita" ? "+" : "-"}{" "}
                      {formatCurrency(t.amount_cents)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
