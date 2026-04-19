"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMonthRange } from "@/lib/utils";
import { calculateForecast, type MonthForecast } from "@/lib/forecast";
import { getCurrentCompetencyMonth } from "@/lib/closing-day";
import { detectRecurrences, type RecurrenceSuggestion } from "@/lib/recurrence-detection";
import { computeConsolidatedKPIs, type NetRevenueBlockBreakdown } from "@/lib/net-revenue";
import { buildCompetencyOrFilter, toCompetencyLabel } from "@/lib/competency";
import { usePreferences } from "@/contexts/preferences-context";
import { useToast } from "@/contexts/toast-context";
import type { Account, CategoryGroup, Debt, Goal, Transaction, RecurringTransaction, MonthlyClosingRow } from "@/types/database";

export interface TransactionRow {
  id: string;
  type: "receita" | "despesa" | "transferencia";
  amount_cents: number;
  description: string;
  date: string;
  categories: { name: string; category_group: string | null } | null;
  accounts: { name: string } | null;
  destination_account_id: string | null;
  destination_accounts: { name: string } | null;
}

export function useDashboardData() {
  const supabase = createClient();
  const { closingDay, reserveTargetMonths, loading: prefsLoading } = usePreferences();
  const { addToast } = useToast();

  const { year: initYear, month: initMonth } = getCurrentCompetencyMonth(closingDay);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const prevMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 0) { setYear((y) => y - 1); return 11; }
      return prev - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setMonth((prev) => {
      if (prev === 11) { setYear((y) => y + 1); return 0; }
      return prev + 1;
    });
  }, []);

  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [currentMonthForecast, setCurrentMonthForecast] = useState<MonthForecast | null>(null);
  const [loading, setLoading] = useState(true);

  // KPI / Insight state
  const [totalAccountBalance, setTotalAccountBalance] = useState(0);
  const [reserveBalance, setReserveBalance] = useState(0);
  const [hasReserveAccount, setHasReserveAccount] = useState(false);
  const [avgMonthlyExpense, setAvgMonthlyExpense] = useState(0);
  const [totalRecurringDespesas, setTotalRecurringDespesas] = useState(0);
  const [avgEssentialExpense, setAvgEssentialExpense] = useState(0);
  const [hasEssentialCategories, setHasEssentialCategories] = useState(false);
  const [pastSavingsRates, setPastSavingsRates] = useState<number[]>([]);
  const [annualProvisions, setAnnualProvisions] = useState<{ description: string; amountCents: number }[]>([]);
  const [recurrenceSuggestions, setRecurrenceSuggestions] = useState<RecurrenceSuggestion[]>([]);
  const [dashGoals, setDashGoals] = useState<Goal[]>([]);
  const [dashAccounts, setDashAccounts] = useState<Account[]>([]);
  const [dashDebts, setDashDebts] = useState<Debt[]>([]);
  const [hasDivergentAccounts, setHasDivergentAccounts] = useState(false);
  const [existingClosing, setExistingClosing] = useState<MonthlyClosingRow | null>(null);
  const [previousClosing, setPreviousClosing] = useState<MonthlyClosingRow | null>(null);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);

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

    // Past 3 months for avgMonthlyExpense
    const pastMonthsRanges: { start: string; end: string }[] = [];
    for (let i = 1; i <= 3; i++) {
      let pastYear = curYear;
      let pastMonth = curMonth - i;
      while (pastMonth < 0) { pastMonth += 12; pastYear--; }
      pastMonthsRanges.push(getMonthRange(pastYear, pastMonth, closingDay));
    }

    const globalStart = pastMonthsRanges[pastMonthsRanges.length - 1]?.start ?? start;
    const globalEnd = pastMonthsRanges[0]?.end ?? end;

    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

    // Annual provision detection range
    let annualYear = curYear - 1;
    const annualMonth = curMonth;
    let annualStartMonth = annualMonth - 1;
    if (annualStartMonth < 0) { annualStartMonth += 12; annualYear--; }
    const annualStartRange = getMonthRange(annualYear, annualStartMonth, closingDay);
    let annualEndYear = curYear - 1;
    let annualEndMonth = curMonth + 1;
    if (annualEndMonth > 11) { annualEndMonth -= 12; annualEndYear++; }
    const annualEndRange = getMonthRange(annualEndYear, annualEndMonth, closingDay);

    try {
      // Reconciliation: 6-month window
      const reconDate = new Date(curYear, curMonth - 6, 1);
      const reconStart = `${reconDate.getFullYear()}-${String(reconDate.getMonth() + 1).padStart(2, "0")}-01`;

      const [
        transactionsRes, forecastResult, accountsRes, pastExpensesRes,
        recurringDespesasRes, goalsRes, essentialCatsRes, reconTxnRes,
        debtsRes, closingRes, prevClosingRes, past3mFullRes,
        existingRecRes, annualRes, categoryGroupsRes
      ] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, type, amount_cents, description, date, competency_month, destination_account_id, categories(name, category_group), accounts:accounts!account_id(name), destination_accounts:accounts!destination_account_id(name)")
          .or(buildCompetencyOrFilter(toCompetencyLabel(year, month), start, end))
          .order("date", { ascending: false })
          .limit(2000),
        isCurrentMonthSelected
          ? calculateForecast(supabase, 0, true, closingDay)
          : Promise.resolve(null),
        supabase.from("accounts").select("*"),
        supabase
          .from("transactions")
          .select("type, amount_cents, category_id, categories(category_group)")
          .eq("type", "despesa")
          .gte("date", globalStart)
          .lte("date", globalEnd)
          .limit(5000),
        supabase
          .from("recurring_transactions")
          .select("type, amount_cents, categories(category_group)")
          .eq("is_active", true)
          .eq("type", "despesa")
          .limit(1000),
        supabase
          .from("goals")
          .select("*")
          .eq("is_active", true)
          .order("priority")
          .limit(10),
        supabase
          .from("categories")
          .select("id")
          .eq("type", "despesa")
          .eq("is_essential", true),
        supabase
          .from("transactions")
          .select("account_id, type, amount_cents, destination_account_id")
          .gte("date", reconStart)
          .limit(5000),
        supabase
          .from("debts")
          .select("*")
          .eq("is_active", true)
          .order("remaining_amount_cents", { ascending: false })
          .limit(20),
        supabase
          .from("monthly_closings")
          .select("*")
          .eq("month", monthStr)
          .maybeSingle(),
        supabase
          .from("monthly_closings")
          .select("*")
          .eq("month", prevMonthStr)
          .maybeSingle(),
        isCurrentMonthSelected
          ? supabase
              .from("transactions")
              .select("id, user_id, account_id, category_id, type, amount_cents, description, date, created_at, categories(category_group)")
              .gte("date", globalStart)
              .lte("date", end)
              .limit(5000)
          : Promise.resolve({ data: null }),
        isCurrentMonthSelected
          ? supabase
              .from("recurring_transactions")
              .select("*")
              .eq("is_active", true)
              .limit(1000)
          : Promise.resolve({ data: null }),
        isCurrentMonthSelected
          ? supabase
              .from("transactions")
              .select("type, amount_cents, description")
              .eq("type", "despesa")
              .gte("date", annualStartRange.start)
              .lte("date", annualEndRange.end)
              .gte("amount_cents", 50000)
              .limit(500)
          : Promise.resolve({ data: null }),
        supabase
          .from("category_groups")
          .select("*")
          .limit(100),
      ]);

      const txns = (transactionsRes.data as TransactionRow[]) ?? [];
      setTransactions(txns);
      setCurrentMonthForecast(
        forecastResult?.months.find((m) => m.isCurrentMonth) ?? null
      );
      const loadedGroups = (categoryGroupsRes.data as CategoryGroup[] | null) ?? [];
      setCategoryGroups(loadedGroups);
      const netRevenueSet = new Set(
        loadedGroups.filter((g) => g.is_net_revenue_block).map((g) => g.name)
      );
      const isPjExpense = (cat: { category_group: string | null } | null | undefined): boolean => {
        const g = cat?.category_group ?? null;
        return g !== null && netRevenueSet.has(g);
      };

      // Accounts
      const accountsData = (accountsRes.data as Account[] | null) ?? [];
      setDashAccounts(accountsData);
      const totalBal = accountsData.reduce((sum, a) => sum + a.balance_cents, 0);
      const reserveAccts = accountsData.filter((a) => a.is_emergency_reserve);
      const resBal = reserveAccts.reduce((sum, a) => sum + a.balance_cents, 0);
      setTotalAccountBalance(totalBal);
      setReserveBalance(resBal);
      setHasReserveAccount(reserveAccts.length > 0);

      // Average monthly expense (last 3 months) — exclui blocos de receita líquida
      type PastExpenseRow = {
        type: string;
        amount_cents: number;
        category_id: string;
        categories: { category_group: string | null } | null;
      };
      const pastExpensesAll = (pastExpensesRes.data ?? []) as PastExpenseRow[];
      const pastExpenses = pastExpensesAll.filter((t) => !isPjExpense(t.categories));
      const totalPastExpenses = pastExpenses.reduce((sum, t) => sum + t.amount_cents, 0);
      const monthCount = pastMonthsRanges.length;
      setAvgMonthlyExpense(monthCount > 0 ? Math.round(totalPastExpenses / monthCount) : 0);

      // Essential expense average
      const essentialCatIds = new Set(
        ((essentialCatsRes.data ?? []) as { id: string }[]).map((c) => c.id)
      );
      setHasEssentialCategories(essentialCatIds.size > 0);
      if (essentialCatIds.size > 0) {
        const essentialTotal = pastExpenses
          .filter((t) => essentialCatIds.has(t.category_id))
          .reduce((sum, t) => sum + t.amount_cents, 0);
        setAvgEssentialExpense(monthCount > 0 ? Math.round(essentialTotal / monthCount) : 0);
      } else {
        setAvgEssentialExpense(0);
      }

      // Recurring despesas — exclui blocos de receita líquida
      type RecurringDespesaRow = {
        type: string;
        amount_cents: number;
        categories: { category_group: string | null } | null;
      };
      const recurringDespesas = (recurringDespesasRes.data ?? []) as RecurringDespesaRow[];
      setTotalRecurringDespesas(
        recurringDespesas
          .filter((r) => !isPjExpense(r.categories))
          .reduce((sum, r) => sum + r.amount_cents, 0)
      );

      // Goals & Debts
      setDashGoals((goalsRes.data as Goal[] | null) ?? []);
      setDashDebts((debtsRes.data as Debt[] | null) ?? []);

      // Reconciliation divergence
      const reconTxns = (reconTxnRes.data ?? []) as { account_id: string; type: string; amount_cents: number; destination_account_id?: string | null }[];
      const hasDivergence = accountsData.some((account) => {
        const txnSum = reconTxns
          .filter((t) => t.account_id === account.id)
          .reduce((sum, t) => {
            if (t.type === "transferencia") return sum - t.amount_cents;
            return sum + (t.type === "receita" ? t.amount_cents : -t.amount_cents);
          }, 0);
        const destSum = reconTxns
          .filter((t) => t.type === "transferencia" && t.destination_account_id === account.id)
          .reduce((sum, t) => sum + t.amount_cents, 0);
        const calculated = account.initial_balance_cents + txnSum + destSum;
        return account.balance_cents !== calculated;
      });
      setHasDivergentAccounts(hasDivergence);

      // Monthly closings
      setExistingClosing((closingRes.data as MonthlyClosingRow | null) ?? null);
      setPreviousClosing((prevClosingRes.data as MonthlyClosingRow | null) ?? null);

      // Recurrence detection + savings rates + annual provisions
      if (isCurrentMonthSelected) {
        type Past3mRow = Transaction & { categories: { category_group: string | null } | null };
        const past3mTransactionsRaw = (past3mFullRes.data as Past3mRow[] | null) ?? [];
        const past3mTransactions = past3mTransactionsRaw as Transaction[];
        const existingRecs = (existingRecRes.data as RecurringTransaction[] | null) ?? [];
        setRecurrenceSuggestions(detectRecurrences(past3mTransactions, existingRecs));

        const rates: number[] = [];
        for (const range of pastMonthsRanges) {
          const monthTxns = past3mTransactionsRaw.filter((t) => t.date >= range.start && t.date <= range.end);
          // Aplica a mesma lógica de consolidação (PJ líquido vira receita PF)
          const blocks = new Map<string, { rec: number; desp: number }>();
          let directRec = 0;
          let directDesp = 0;
          for (const t of monthTxns) {
            if (t.type === "transferencia") continue;
            const g = t.categories?.category_group ?? null;
            const isNet = g !== null && netRevenueSet.has(g);
            if (isNet) {
              const b = blocks.get(g) ?? { rec: 0, desp: 0 };
              if (t.type === "receita") b.rec += t.amount_cents;
              else b.desp += t.amount_cents;
              blocks.set(g, b);
            } else {
              if (t.type === "receita") directRec += t.amount_cents;
              else if (t.type === "despesa") directDesp += t.amount_cents;
            }
          }
          const blocksNet = Array.from(blocks.values()).reduce((s, b) => s + (b.rec - b.desp), 0);
          const totalRec = directRec + blocksNet;
          if (totalRec > 0) rates.push(((totalRec - directDesp) / totalRec) * 100);
        }
        setPastSavingsRates(rates);

        const annualTxns = (annualRes.data ?? []) as { type: string; amount_cents: number; description: string }[];
        const currentDescriptions = new Set(
          txns
            .filter((t) => t.type === "despesa" && t.amount_cents >= 50000)
            .map((t) => t.description.toLowerCase().trim())
        );
        const existingRecDescriptions = new Set(
          existingRecs.map((r) => r.description.toLowerCase().trim())
        );
        const provisions = annualTxns
          .filter((t) => {
            const desc = t.description.toLowerCase().trim();
            return !currentDescriptions.has(desc) && !existingRecDescriptions.has(desc);
          })
          .reduce((acc, t) => {
            const desc = t.description.trim();
            const existing = acc.find((a) => a.description.toLowerCase() === desc.toLowerCase());
            if (existing) {
              existing.amountCents = Math.max(existing.amountCents, t.amount_cents);
            } else {
              acc.push({ description: desc, amountCents: t.amount_cents });
            }
            return acc;
          }, [] as { description: string; amountCents: number }[])
          .sort((a, b) => b.amountCents - a.amountCents)
          .slice(0, 3);
        setAnnualProvisions(provisions);
      } else {
        setRecurrenceSuggestions([]);
        setPastSavingsRates([]);
        setAnnualProvisions([]);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      addToast("Erro ao carregar dados do dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }, [year, month, closingDay]);

  useEffect(() => {
    if (!prefsLoading) fetchData();
  }, [fetchData, prefsLoading]);

  // Derived calculations
  const netRevenueGroupNames = useMemo(
    () => new Set(categoryGroups.filter((g) => g.is_net_revenue_block).map((g) => g.name)),
    [categoryGroups]
  );

  const consolidatedKPIs = useMemo(
    () => computeConsolidatedKPIs(transactions, netRevenueGroupNames),
    [transactions, netRevenueGroupNames]
  );

  const totalReceitas = consolidatedKPIs.totalReceitasCents;
  const totalDespesas = consolidatedKPIs.totalDespesasCents;
  const netRevenueBlocks: NetRevenueBlockBreakdown[] = consolidatedKPIs.netRevenueBlocks;

  const chartData = useMemo(() => {
    const map = new Map<string, { amount: number; categoryGroup: string | null }>();
    transactions
      .filter((t) => t.type === "despesa")
      .filter((t) => {
        const g = t.categories?.category_group ?? null;
        return !(g !== null && netRevenueGroupNames.has(g));
      })
      .forEach((t) => {
        const catName = t.categories?.name ?? "Sem categoria";
        const catGroup = t.categories?.category_group ?? null;
        const existing = map.get(catName);
        if (existing) {
          existing.amount += t.amount_cents;
        } else {
          map.set(catName, { amount: t.amount_cents, categoryGroup: catGroup });
        }
      });
    return Array.from(map.entries())
      .map(([name, { amount, categoryGroup }]) => ({ name, amount, categoryGroup }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, netRevenueGroupNames]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const savingsRate = useMemo(
    () => totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : null,
    [totalReceitas, totalDespesas]
  );

  const expenseBaseForKpis = useMemo(
    () => hasEssentialCategories && avgEssentialExpense > 0 ? avgEssentialExpense : avgMonthlyExpense,
    [hasEssentialCategories, avgEssentialExpense, avgMonthlyExpense]
  );

  const runway = useMemo(
    () => expenseBaseForKpis > 0 ? totalAccountBalance / expenseBaseForKpis : null,
    [expenseBaseForKpis, totalAccountBalance]
  );

  const reserveMonths = useMemo(
    () => hasReserveAccount && expenseBaseForKpis > 0 ? reserveBalance / expenseBaseForKpis : null,
    [hasReserveAccount, expenseBaseForKpis, reserveBalance]
  );

  const forecastDespesas = useMemo(() => {
    if (!currentMonthForecast) return 0;
    return currentMonthForecast.byCategory
      .filter((c) => c.type === "despesa")
      .filter((c) => !(c.categoryGroup !== null && netRevenueGroupNames.has(c.categoryGroup)))
      .reduce((sum, c) => sum + c.forecastToDateAmount, 0);
  }, [currentMonthForecast, netRevenueGroupNames]);

  const budgetDeviation = useMemo(
    () => forecastDespesas > 0 ? ((totalDespesas - forecastDespesas) / forecastDespesas) * 100 : null,
    [totalDespesas, forecastDespesas]
  );

  const fixedExpensePct = useMemo(
    () => totalDespesas > 0 ? (totalRecurringDespesas / totalDespesas) * 100 : null,
    [totalRecurringDespesas, totalDespesas]
  );

  const closingMonthStr = useMemo(
    () => `${year}-${String(month + 1).padStart(2, "0")}`,
    [year, month]
  );

  return {
    // Navigation
    year, month, prevMonth, nextMonth, closingDay,
    // Loading
    loading, prefsLoading,
    // Raw data
    transactions, recentTransactions, currentMonthForecast,
    dashAccounts, dashGoals, dashDebts,
    recurrenceSuggestions, existingClosing, previousClosing,
    // KPI inputs
    totalReceitas, totalDespesas, totalAccountBalance,
    avgMonthlyExpense, avgEssentialExpense, hasEssentialCategories,
    reserveBalance, hasReserveAccount, reserveTargetMonths,
    totalRecurringDespesas, forecastDespesas,
    // KPI derived
    savingsRate, runway, reserveMonths, budgetDeviation, fixedExpensePct,
    chartData, closingMonthStr,
    // Net revenue blocks (ex.: PJ)
    netRevenueBlocks, netRevenueGroupNames, categoryGroups,
    // Insights
    pastSavingsRates, annualProvisions, hasDivergentAccounts,
    // Actions
    fetchData,
  };
}
