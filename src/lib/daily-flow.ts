import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getCompetencyRange,
  getCurrentCompetencyMonth,
  getCompetencyDays,
  getRecurringDateInCompetency,
  getCompetencyLabel,
} from "@/lib/closing-day";

export interface DayColumn {
  day: number;
  date: string;
  weekday: string;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
  openingBalance: number;
  closingBalance: number;
  byCategoryId: Map<string, { total: number; source: "real" | "planned" }>;
}

export interface FlowCategory {
  id: string;
  name: string;
  type: "receita" | "despesa";
}

export interface DailyFlowResult {
  days: DayColumn[];
  receitas: FlowCategory[];
  despesas: FlowCategory[];
  totalEntradas: number[];
  totalSaidas: number[];
}

function isRecurringActiveInMonth(
  recurring: { start_month: string | null; end_month: string | null },
  targetMonth: string
): boolean {
  const { start_month, end_month } = recurring;
  if (start_month && targetMonth < start_month) return false;
  if (end_month && targetMonth > end_month) return false;
  return true;
}

export async function calculateDailyFlow(
  supabase: SupabaseClient<Database>,
  year: number,
  month: number,
  closingDay: number = 1
): Promise<DailyFlowResult> {
  const competencyLabel = getCompetencyLabel(year, month);
  const { start: firstDay, end: lastDay } = getCompetencyRange(year, month, closingDay);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [accountsRes, transactionsRes, recurringRes, categoriesRes] =
    await Promise.all([
      supabase.from("accounts").select("balance_cents"),
      supabase
        .from("transactions")
        .select("category_id, type, amount_cents, date")
        .gte("date", firstDay)
        .lte("date", lastDay)
        .limit(5000),
      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("is_active", true)
        .limit(1000),
      supabase.from("categories").select("id, name, type"),
    ]);

  type RecurringRow = Database["public"]["Tables"]["recurring_transactions"]["Row"];
  type CategoryRow = { id: string; name: string; type: "receita" | "despesa" };

  const accounts = accountsRes.data ?? [];
  const transactions = transactionsRes.data ?? [];
  const recurrings = (recurringRes.data ?? []) as RecurringRow[];
  const categories = (categoriesRes.data ?? []) as CategoryRow[];

  const totalBalance = accounts.reduce(
    (sum, a) => sum + a.balance_cents,
    0
  );

  const categoryMap = new Map<string, { name: string; type: "receita" | "despesa" }>();
  for (const cat of categories) {
    categoryMap.set(cat.id, { name: cat.name, type: cat.type });
  }

  // Calculate opening balance for the competency period
  const { year: curYear, month: curMonth } = getCurrentCompetencyMonth(closingDay, today);
  const isCurrentMonth = year === curYear && month === curMonth;
  const isFutureMonth =
    year > curYear || (year === curYear && month > curMonth);

  let openingDay1: number;

  if (isCurrentMonth) {
    // Reverse real transactions of this period from the current balance
    const realReceitasThisPeriod = transactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum + t.amount_cents, 0);
    const realDespesasThisPeriod = transactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + t.amount_cents, 0);
    openingDay1 = totalBalance - realReceitasThisPeriod + realDespesasThisPeriod;
  } else if (isFutureMonth) {
    openingDay1 = totalBalance;

    // Project remaining days of current competency period
    const currentRange = getCompetencyRange(curYear, curMonth, closingDay);
    const currentLabel = getCompetencyLabel(curYear, curMonth);
    for (const r of recurrings) {
      if (!isRecurringActiveInMonth(r, currentLabel)) continue;
      const rDate = getRecurringDateInCompetency(r.day_of_month, curYear, curMonth, closingDay);
      if (rDate && rDate > todayStr && rDate <= currentRange.end) {
        if (r.type === "receita") openingDay1 += r.amount_cents;
        else openingDay1 -= r.amount_cents;
      }
    }

    // Project full intervening competency months
    let intYear = curYear;
    let intMonth = curMonth + 1;
    while (intMonth > 11) { intMonth -= 12; intYear++; }

    while (intYear < year || (intYear === year && intMonth < month)) {
      const intLabel = getCompetencyLabel(intYear, intMonth);
      for (const r of recurrings) {
        if (!isRecurringActiveInMonth(r, intLabel)) continue;
        if (r.type === "receita") openingDay1 += r.amount_cents;
        else openingDay1 -= r.amount_cents;
      }
      intMonth++;
      if (intMonth > 11) { intMonth = 0; intYear++; }
    }
  } else {
    // Past period: reverse all transactions from start of target period to today
    const { data: txSinceMonth } = await supabase
      .from("transactions")
      .select("type, amount_cents")
      .gte("date", firstDay)
      .lte("date", todayStr)
      .limit(5000);

    const txList = txSinceMonth ?? [];
    let netSince = 0;
    for (const t of txList) {
      if (t.type === "receita") netSince += t.amount_cents;
      else netSince -= t.amount_cents;
    }
    openingDay1 = totalBalance - netSince;
  }

  // Build per-day data using competency days
  const competencyDays = getCompetencyDays(year, month, closingDay, today);
  const activeRecurrings = recurrings.filter((r) =>
    isRecurringActiveInMonth(r, competencyLabel)
  );

  // Group real transactions by date (YYYY-MM-DD) and category
  const realByDateCategory = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    const dateKey = t.date;
    let catMap = realByDateCategory.get(dateKey);
    if (!catMap) {
      catMap = new Map();
      realByDateCategory.set(dateKey, catMap);
    }
    const current = catMap.get(t.category_id) ?? 0;
    if (t.type === "receita") {
      catMap.set(t.category_id, current + t.amount_cents);
    } else {
      catMap.set(t.category_id, current - t.amount_cents);
    }
  }

  // Group recurring by their actual date in this competency
  const plannedByDateCategory = new Map<string, Map<string, number>>();
  for (const r of activeRecurrings) {
    const rDate = getRecurringDateInCompetency(r.day_of_month, year, month, closingDay);
    if (!rDate) continue;
    let catMap = plannedByDateCategory.get(rDate);
    if (!catMap) {
      catMap = new Map();
      plannedByDateCategory.set(rDate, catMap);
    }
    const current = catMap.get(r.category_id) ?? 0;
    if (r.type === "receita") {
      catMap.set(r.category_id, current + r.amount_cents);
    } else {
      catMap.set(r.category_id, current - r.amount_cents);
    }
  }

  const days: DayColumn[] = [];
  const totalEntradas: number[] = [];
  const totalSaidas: number[] = [];
  const categoriesWithData = new Set<string>();

  let runningBalance = openingDay1;

  for (const cDay of competencyDays) {
    const byCategoryId = new Map<string, { total: number; source: "real" | "planned" }>();
    let dayEntradas = 0;
    let daySaidas = 0;

    if (cDay.isPast) {
      const catMap = realByDateCategory.get(cDay.date);
      if (catMap) {
        for (const [catId, signedAmount] of catMap) {
          byCategoryId.set(catId, {
            total: Math.abs(signedAmount),
            source: "real",
          });
          categoriesWithData.add(catId);
          if (signedAmount > 0) dayEntradas += signedAmount;
          else daySaidas += Math.abs(signedAmount);
        }
      }
    } else {
      const catMap = plannedByDateCategory.get(cDay.date);
      if (catMap) {
        for (const [catId, signedAmount] of catMap) {
          byCategoryId.set(catId, {
            total: Math.abs(signedAmount),
            source: "planned",
          });
          categoriesWithData.add(catId);
          if (signedAmount > 0) dayEntradas += signedAmount;
          else daySaidas += Math.abs(signedAmount);
        }
      }
    }

    const openingBalance = runningBalance;
    runningBalance = runningBalance + dayEntradas - daySaidas;

    days.push({
      day: cDay.dayLabel,
      date: cDay.date,
      weekday: cDay.weekday,
      isWeekend: cDay.isWeekend,
      isToday: cDay.isToday,
      isPast: cDay.isPast,
      openingBalance,
      closingBalance: runningBalance,
      byCategoryId,
    });

    totalEntradas.push(dayEntradas);
    totalSaidas.push(daySaidas);
  }

  // Filter categories that have data
  const receitas: FlowCategory[] = [];
  const despesas: FlowCategory[] = [];

  for (const catId of categoriesWithData) {
    const cat = categoryMap.get(catId);
    if (!cat) continue;
    const fc: FlowCategory = { id: catId, name: cat.name, type: cat.type };
    if (cat.type === "receita") receitas.push(fc);
    else despesas.push(fc);
  }

  receitas.sort((a, b) => a.name.localeCompare(b.name));
  despesas.sort((a, b) => a.name.localeCompare(b.name));

  return { days, receitas, despesas, totalEntradas, totalSaidas };
}
