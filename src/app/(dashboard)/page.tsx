"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { FinancialKPIs } from "@/components/dashboard/financial-kpis";
import { FinancialInsights } from "@/components/dashboard/financial-insights";
import dynamic from "next/dynamic";

const CategoryChart = dynamic(
  () => import("@/components/dashboard/category-chart").then((mod) => mod.CategoryChart),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-slate-100 rounded-lg" /> }
);
import { MonthPicker } from "@/components/dashboard/month-picker";
import { InvestmentSummary } from "@/components/dashboard/investment-summary";
import { BudgetComparison } from "@/components/dashboard/budget-comparison";
import { GreetingHeader } from "@/components/layout/greeting-header";
import { Modal } from "@/components/ui/modal";
import { MonthlyClosing } from "@/components/dashboard/monthly-closing";
import { RecurrenceSuggestions } from "@/components/dashboard/recurrence-suggestions";
import { detectRecurrences, type RecurrenceSuggestion } from "@/lib/recurrence-detection";
import { CardsSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { getMonthRange, formatCurrency, formatDate } from "@/lib/utils";
import { calculateForecast, type MonthForecast } from "@/lib/forecast";
import { getMonthEndBalance } from "@/lib/investment-utils";
import { getCurrentCompetencyMonth } from "@/lib/closing-day";
import { getIPCA12Months } from "@/lib/inflation";
import { usePreferences } from "@/contexts/preferences-context";
import type { InvestmentEntry, Transaction, RecurringTransaction } from "@/types/database";

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
  const { closingDay, reserveTargetMonths, loading: prefsLoading } = usePreferences();

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
  const [showClosing, setShowClosing] = useState(false);

  // New state for KPIs/Insights
  const [totalAccountBalance, setTotalAccountBalance] = useState(0);
  const [reserveBalance, setReserveBalance] = useState(0);
  const [hasReserveAccount, setHasReserveAccount] = useState(false);
  const [avgMonthlyExpense, setAvgMonthlyExpense] = useState(0);
  const [ipca12m, setIpca12m] = useState<number | null>(null);
  const [totalRecurringDespesas, setTotalRecurringDespesas] = useState(0);
  const [recurrenceSuggestions, setRecurrenceSuggestions] = useState<RecurrenceSuggestion[]>([]);

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

    // Calculate past 3 months for avgMonthlyExpense
    const pastMonthsRanges: { start: string; end: string }[] = [];
    for (let i = 1; i <= 3; i++) {
      let pastYear = curYear;
      let pastMonth = curMonth - i;
      while (pastMonth < 0) {
        pastMonth += 12;
        pastYear--;
      }
      pastMonthsRanges.push(getMonthRange(pastYear, pastMonth, closingDay));
    }

    const globalStart = pastMonthsRanges[pastMonthsRanges.length - 1]?.start ?? start;
    const globalEnd = pastMonthsRanges[0]?.end ?? end;

    const [transactionsRes, forecastResult, accountsRes, pastExpensesRes, recurringDespesasRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("id, type, amount_cents, description, date, categories(name), accounts(name)")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .limit(2000),
      isCurrentMonthSelected
        ? calculateForecast(supabase, 0, true, closingDay)
        : Promise.resolve(null),
      supabase
        .from("accounts")
        .select("balance_cents, is_emergency_reserve"),
      supabase
        .from("transactions")
        .select("type, amount_cents")
        .eq("type", "despesa")
        .gte("date", globalStart)
        .lte("date", globalEnd)
        .limit(5000),
      supabase
        .from("recurring_transactions")
        .select("type, amount_cents")
        .eq("is_active", true)
        .eq("type", "despesa")
        .limit(1000),
    ]);

    setTransactions((transactionsRes.data as TransactionRow[]) ?? []);
    setCurrentMonthForecast(
      forecastResult?.months.find((m) => m.isCurrentMonth) ?? null
    );

    // Accounts data
    const accounts = (accountsRes.data ?? []) as { balance_cents: number; is_emergency_reserve: boolean }[];
    const totalBal = accounts.reduce((sum, a) => sum + a.balance_cents, 0);
    const reserveAccounts = accounts.filter((a) => a.is_emergency_reserve);
    const resBal = reserveAccounts.reduce((sum, a) => sum + a.balance_cents, 0);

    setTotalAccountBalance(totalBal);
    setReserveBalance(resBal);
    setHasReserveAccount(reserveAccounts.length > 0);

    // Average monthly expense (last 3 months)
    const pastExpenses = (pastExpensesRes.data ?? []) as { type: string; amount_cents: number }[];
    const totalPastExpenses = pastExpenses.reduce((sum, t) => sum + t.amount_cents, 0);
    const monthCount = pastMonthsRanges.length;
    setAvgMonthlyExpense(monthCount > 0 ? Math.round(totalPastExpenses / monthCount) : 0);

    // Total recurring despesas (active)
    const recurringDespesas = (recurringDespesasRes.data ?? []) as { type: string; amount_cents: number }[];
    setTotalRecurringDespesas(recurringDespesas.reduce((sum, r) => sum + r.amount_cents, 0));

    // Recurrence detection: fetch past 3 months of full transactions + existing recurrings
    if (isCurrentMonthSelected) {
      const [past3mRes, existingRecRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, user_id, account_id, category_id, type, amount_cents, description, date, created_at")
          .gte("date", globalStart)
          .lte("date", end)
          .limit(5000),
        supabase
          .from("recurring_transactions")
          .select("*")
          .eq("is_active", true)
          .limit(1000),
      ]);
      const past3mTransactions = (past3mRes.data as Transaction[] | null) ?? [];
      const existingRecs = (existingRecRes.data as RecurringTransaction[] | null) ?? [];
      setRecurrenceSuggestions(detectRecurrences(past3mTransactions, existingRecs));
    } else {
      setRecurrenceSuggestions([]);
    }

    setLoading(false);
  }, [year, month, closingDay]);

  // Fetch investment data once (does not depend on month)
  useEffect(() => {
    async function fetchInvestments() {
      const [investmentsRes, entriesRes, ipca] = await Promise.all([
        supabase
          .from("investments")
          .select("id, product, indexer")
          .eq("is_active", true),
        supabase
          .from("investment_entries")
          .select("investment_id, type, amount_cents, date")
          .limit(5000),
        getIPCA12Months(),
      ]);

      const investments = (investmentsRes.data ?? []) as { id: string; product: string; indexer: string }[];
      const entries = (entriesRes.data ?? []) as InvestmentEntry[];
      setIpca12m(ipca);

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
  }, []);

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

  const totalReceitas = useMemo(
    () => transactions.filter((t) => t.type === "receita").reduce((sum, t) => sum + t.amount_cents, 0),
    [transactions]
  );

  const totalDespesas = useMemo(
    () => transactions.filter((t) => t.type === "despesa").reduce((sum, t) => sum + t.amount_cents, 0),
    [transactions]
  );

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "despesa")
      .forEach((t) => {
        const catName = t.categories?.name ?? "Sem categoria";
        map.set(catName, (map.get(catName) ?? 0) + t.amount_cents);
      });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // KPIs calculated values
  const savingsRate = useMemo(
    () => totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : null,
    [totalReceitas, totalDespesas]
  );

  const runway = useMemo(
    () => avgMonthlyExpense > 0 ? totalAccountBalance / avgMonthlyExpense : null,
    [avgMonthlyExpense, totalAccountBalance]
  );

  const reserveMonths = useMemo(
    () => hasReserveAccount && avgMonthlyExpense > 0 ? reserveBalance / avgMonthlyExpense : null,
    [hasReserveAccount, avgMonthlyExpense, reserveBalance]
  );

  const forecastDespesas = useMemo(
    () => currentMonthForecast?.forecastToDateDespesas ?? 0,
    [currentMonthForecast]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <GreetingHeader />
        <div className="flex gap-2">
          {currentMonthForecast && (
            <button
              onClick={() => setShowClosing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              Revisar mês
            </button>
          )}
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

          {/* KPIs */}
          <div className="mt-4">
            <FinancialKPIs
              totalReceitas={totalReceitas}
              totalDespesas={totalDespesas}
              totalBalance={totalAccountBalance}
              avgMonthlyExpense={avgMonthlyExpense}
              reserveBalance={reserveBalance}
              hasReserveAccount={hasReserveAccount}
              reserveTargetMonths={reserveTargetMonths}
              forecastDespesas={forecastDespesas}
              totalRecurringDespesas={totalRecurringDespesas}
            />
          </div>

          {/* Insights */}
          <div className="mt-4">
            <FinancialInsights
              totalReceitas={totalReceitas}
              totalDespesas={totalDespesas}
              savingsRate={savingsRate}
              runway={runway}
              reserveMonths={reserveMonths}
              forecast={currentMonthForecast}
              hasInvestments={investmentData.hasData}
              reserveTargetMonths={reserveTargetMonths}
            />
          </div>

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
                ipca12m={ipca12m}
              />

              {recurrenceSuggestions.length > 0 && (
                <RecurrenceSuggestions suggestions={recurrenceSuggestions} />
              )}
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

      {currentMonthForecast && (
        <Modal
          open={showClosing}
          onClose={() => setShowClosing(false)}
          title="Fechamento do Mês"
        >
          <MonthlyClosing
            forecast={currentMonthForecast}
            totalReceitas={totalReceitas}
            totalDespesas={totalDespesas}
            savingsRate={savingsRate}
          />
        </Modal>
      )}
    </div>
  );
}
