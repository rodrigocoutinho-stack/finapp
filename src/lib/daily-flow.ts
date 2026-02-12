import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

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

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

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
  month: number
): Promise<DailyFlowResult> {
  const targetMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = `${targetMonth}-01`;
  const lastDay = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [accountsRes, transactionsRes, recurringRes, categoriesRes] =
    await Promise.all([
      supabase.from("accounts").select("balance_cents"),
      supabase
        .from("transactions")
        .select("category_id, type, amount_cents, date")
        .gte("date", firstDay)
        .lte("date", lastDay),
      supabase
        .from("recurring_transactions")
        .select("*")
        .eq("is_active", true),
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

  // Calculate opening balance for the month
  // For current month: reverse real transactions from today back to day 1
  // openingDay1 = totalBalance - sum(receitas do mês) + sum(despesas do mês)
  // For other months we need to account for transactions between now and that month

  let openingDay1: number;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const isCurrentMonth = year === currentYear && month === currentMonth;
  const isFutureMonth =
    year > currentYear || (year === currentYear && month > currentMonth);

  if (isCurrentMonth) {
    // Reverse real transactions of this month from the current balance
    const realReceitasThisMonth = transactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum + t.amount_cents, 0);
    const realDespesasThisMonth = transactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + t.amount_cents, 0);
    openingDay1 = totalBalance - realReceitasThisMonth + realDespesasThisMonth;
  } else if (isFutureMonth) {
    // Start from current balance, then add projected net for each intervening month
    openingDay1 = totalBalance;

    // Add recurring projections for months between now and target
    const startM = currentMonth + 1;
    const monthsBetween: string[] = [];
    const tempDate = new Date(currentYear, startM, 1);
    while (
      tempDate.getFullYear() < year ||
      (tempDate.getFullYear() === year && tempDate.getMonth() < month)
    ) {
      const mm = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, "0")}`;
      monthsBetween.push(mm);
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    // Also include remaining days of current month projected
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const todayDay = today.getDate();
    const currentMonthDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (const r of recurrings) {
      if (!isRecurringActiveInMonth(r, currentMonthStr)) continue;
      if (r.day_of_month > todayDay && r.day_of_month <= currentMonthDays) {
        if (r.type === "receita") openingDay1 += r.amount_cents;
        else openingDay1 -= r.amount_cents;
      }
    }

    for (const mm of monthsBetween) {
      for (const r of recurrings) {
        if (!isRecurringActiveInMonth(r, mm)) continue;
        if (r.type === "receita") openingDay1 += r.amount_cents;
        else openingDay1 -= r.amount_cents;
      }
    }
  } else {
    // Past month: start from current balance, reverse all transactions from today back to start of that month
    // Then add back transactions before that month
    // Simpler: totalBalance - net of all transactions from start of target month to today
    const { data: txSinceMonth } = await supabase
      .from("transactions")
      .select("type, amount_cents")
      .gte("date", firstDay)
      .lte("date", todayStr);

    const txList = txSinceMonth ?? [];
    let netSince = 0;
    for (const t of txList) {
      if (t.type === "receita") netSince += t.amount_cents;
      else netSince -= t.amount_cents;
    }
    openingDay1 = totalBalance - netSince;
  }

  // Build per-day data
  const activeRecurrings = recurrings.filter((r) =>
    isRecurringActiveInMonth(r, targetMonth)
  );

  // Group real transactions by day and category
  const realByDayCategory = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    const day = t.date.split("-")[2];
    const dayKey = parseInt(day, 10).toString();
    let catMap = realByDayCategory.get(dayKey);
    if (!catMap) {
      catMap = new Map();
      realByDayCategory.set(dayKey, catMap);
    }
    const current = catMap.get(t.category_id) ?? 0;
    // Store as signed: positive for receita, negative for despesa
    if (t.type === "receita") {
      catMap.set(t.category_id, current + t.amount_cents);
    } else {
      catMap.set(t.category_id, current - t.amount_cents);
    }
  }

  // Group recurring by day_of_month and category
  const plannedByDayCategory = new Map<string, Map<string, number>>();
  for (const r of activeRecurrings) {
    const dayKey = r.day_of_month.toString();
    let catMap = plannedByDayCategory.get(dayKey);
    if (!catMap) {
      catMap = new Map();
      plannedByDayCategory.set(dayKey, catMap);
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

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${targetMonth}-${String(d).padStart(2, "0")}`;
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();
    const isPast = dateStr <= todayStr;
    const isToday = dateStr === todayStr;

    const byCategoryId = new Map<string, { total: number; source: "real" | "planned" }>();
    let dayEntradas = 0;
    let daySaidas = 0;

    const dayKey = d.toString();

    if (isPast) {
      // Use real transactions
      const catMap = realByDayCategory.get(dayKey);
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
      // Use planned (recurring) transactions
      const catMap = plannedByDayCategory.get(dayKey);
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
      day: d,
      date: dateStr,
      weekday: WEEKDAYS[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday,
      isPast,
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
