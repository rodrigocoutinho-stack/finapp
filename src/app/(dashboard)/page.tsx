"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { BudgetComparison } from "@/components/dashboard/budget-comparison";
import { GreetingHeader } from "@/components/layout/greeting-header";
import { CardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { getMonthRange, formatCurrency, formatDate } from "@/lib/utils";
import { calculateForecast, type MonthForecast } from "@/lib/forecast";
import { getMonthEndBalance } from "@/lib/investment-utils";
import { getCurrentCompetencyMonth } from "@/lib/closing-day";
import { usePreferences } from "@/contexts/preferences-context";
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
  lastReturn: number;
  lastReturnPercent: number;
  hasData: boolean;
}

export default function DashboardPage() {
  const supabase = createClient();
  const { closingDay, loading: prefsLoading } = usePreferences();

  const { year: initYear, month: initMonth } = getCurrentCompetencyMonth(closingDay);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [currentMonthForecast, setCurrentMonthForecast] = useState<MonthForecast | null>(null);
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    totalBalance: 0,
    lastReturn: 0,
    lastReturnPercent: 0,
    hasData: false,
  });
  const [loading, setLoading] = useState(true);

  // Sync initial year/month when closingDay loads
  useEffect(() => {
    if (!prefsLoading) {
      const { year: y, month: m } = getCurrentCompetencyMonth(closingDay);
      setYear(y);
      setMonth(m);
    }
  }, [closingDay, prefsLoading]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getMonthRange(year, month, closingDay);
    const { year: curYear, month: curMonth } = getCurrentCompetencyMonth(closingDay);
    const isCurrentMonthSelected = year === curYear && month === curMonth;

    const [transactionsRes, forecastResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, type, amount_cents, description, date, categories(name), accounts(name)")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false }),
      isCurrentMonthSelected
        ? calculateForecast(supabase, 0, true, closingDay)
        : Promise.resolve(null),
    ]);

    setTransactions((transactionsRes.data as TransactionRow[]) ?? []);
    setCurrentMonthForecast(
      forecastResult?.months.find((m) => m.isCurrentMonth) ?? null
    );
    setLoading(false);
  }, [supabase, year, month, closingDay]);

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
          lastReturn: 0,
          lastReturnPercent: 0,
          hasData: false,
        });
        return;
      }

      const today = new Date();

      // Current month and previous month for comparison
      const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const prevYM = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

      let totalBalance = 0;
      let totalPrevMonth = 0;

      for (const inv of investments) {
        const invEntries = entries.filter((e) => e.investment_id === inv.id);
        totalBalance += getMonthEndBalance(invEntries, currentYM);
        totalPrevMonth += getMonthEndBalance(invEntries, prevYM);
      }

      const lastReturn = totalBalance - totalPrevMonth;
      const lastReturnPercent =
        totalPrevMonth > 0
          ? ((totalBalance / totalPrevMonth) - 1) * 100
          : 0;

      setInvestmentData({
        totalBalance,
        lastReturn,
        lastReturnPercent,
        hasData: true,
      });
    }

    fetchInvestments();
  }, [supabase]);

  useEffect(() => {
    if (!prefsLoading) {
      fetchData();
    }
  }, [fetchData, prefsLoading]);

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
        <GreetingHeader />
        <div className="flex gap-2">
          <Link
            href="/transacoes?novo=receita"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Receita
          </Link>
          <Link
            href="/transacoes?novo=despesa"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
            Despesa
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <MonthPicker year={year} month={month} onPrev={prevMonth} onNext={nextMonth} closingDay={closingDay} />
      </div>

      {loading || prefsLoading ? (
        <div className="space-y-10">
          <CardsSkeleton />
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : (
        <>
          <SummaryCards totalReceitas={totalReceitas} totalDespesas={totalDespesas} />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left column — wider */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {currentMonthForecast && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Previsto vs Realizado
                  </h2>
                  <BudgetComparison month={currentMonthForecast} closingDay={closingDay} />
                </div>
              )}

              <InvestmentSummary
                totalBalance={investmentData.totalBalance}
                lastReturn={investmentData.lastReturn}
                lastReturnPercent={investmentData.lastReturnPercent}
                hasData={investmentData.hasData}
              />
            </div>

            {/* Right column — single card */}
            <div className="lg:col-span-2 flex">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
                {/* Despesas por Categoria */}
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">
                    Despesas por Categoria
                  </h2>
                  <CategoryChart data={chartData} />
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200" />

                {/* Últimas Transações */}
                <div className="p-6 flex-1">
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
