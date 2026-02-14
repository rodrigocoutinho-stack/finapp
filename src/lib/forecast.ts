import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Category, RecurringTransaction } from "@/types/database";
import {
  getCompetencyRange,
  getCurrentCompetencyMonth,
  getCompetencyDayCount,
  getElapsedDays,
  getRecurringDateInCompetency,
  getCompetencyLabel,
} from "@/lib/closing-day";

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  type: "receita" | "despesa";
  projectedAmount: number;
  forecastAmount: number;
  forecastToDateAmount: number;
  realAmount: number;
  projectionType: "recurring" | "historical";
  hasPontual: boolean;
}

export interface MonthForecast {
  label: string;
  isCurrentMonth: boolean;
  byCategory: CategoryForecast[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  forecastReceitas: number;
  forecastDespesas: number;
  forecastSaldo: number;
  forecastToDateReceitas: number;
  forecastToDateDespesas: number;
  forecastToDateSaldo: number;
  realReceitas: number;
  realDespesas: number;
  realSaldo: number;
}

export interface ForecastResult {
  months: MonthForecast[];
}

interface TransactionRow {
  category_id: string;
  type: "receita" | "despesa";
  amount_cents: number;
  date: string;
}

interface RecurringRow extends RecurringTransaction {
  categories: { name: string } | null;
}

export async function calculateForecast(
  supabase: SupabaseClient<Database>,
  monthsAhead: number = 3,
  includeCurrentMonth: boolean = false,
  closingDay: number = 1
): Promise<ForecastResult> {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Determine current competency month
  const { year: currentYear, month: currentMonth } =
    getCurrentCompetencyMonth(closingDay, now);
  const currentCompetencyLabel = getCompetencyLabel(currentYear, currentMonth);

  // Current competency range
  const currentRange = getCompetencyRange(currentYear, currentMonth, closingDay);
  const daysInCurrentPeriod = getCompetencyDayCount(currentYear, currentMonth, closingDay);
  const elapsedDays = getElapsedDays(currentYear, currentMonth, closingDay, now);

  const [categoriesRes, recurringRes, historicalRes, currentMonthRes] =
    await Promise.all([
      supabase.from("categories").select("*"),
      supabase
        .from("recurring_transactions")
        .select("*, categories(name)")
        .eq("is_active", true),
      getHistoricalTransactions(supabase, closingDay),
      includeCurrentMonth
        ? supabase
            .from("transactions")
            .select("category_id, type, amount_cents, date")
            .gte("date", currentRange.start)
            .lte("date", todayStr)
        : Promise.resolve({ data: null }),
    ]);

  const categories = (categoriesRes.data as Category[]) ?? [];
  const recurrings = (recurringRes.data as RecurringRow[]) ?? [];
  const { transactions, monthsPerCategory } = historicalRes;
  const currentMonthTransactions =
    (currentMonthRes.data as TransactionRow[] | null) ?? [];

  const months: MonthForecast[] = [];
  const startIndex = includeCurrentMonth ? 0 : 1;

  for (let i = startIndex; i <= monthsAhead; i++) {
    // Calculate target competency month
    let targetYear = currentYear;
    let targetMonth = currentMonth + i;
    while (targetMonth > 11) {
      targetMonth -= 12;
      targetYear++;
    }

    const futureDate = new Date(targetYear, targetMonth, 1);
    const label = futureDate.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
    const targetCompetencyLabel = getCompetencyLabel(targetYear, targetMonth);
    const isCurrentMonth = i === 0;

    const byCategory: CategoryForecast[] = [];

    for (const category of categories) {
      let monthlyAmount = 0;
      let forecastFull = 0;
      let forecastToDate = 0;
      let realSoFar = 0;
      let hasPontual = false;

      if (isCurrentMonth) {
        // Real: sum of transactions up to today for this category
        realSoFar = currentMonthTransactions
          .filter((t) => t.category_id === category.id)
          .reduce((sum, t) => sum + t.amount_cents, 0);

        if (category.projection_type === "recurring") {
          const allCategoryRecurrings = recurrings.filter(
            (r) =>
              r.category_id === category.id &&
              isRecurringActiveInMonth(r, currentCompetencyLabel)
          );

          // Determine which recurrings are still in the future
          const futureRecurrings = allCategoryRecurrings.filter((r) => {
            const rDate = getRecurringDateInCompetency(
              r.day_of_month,
              currentYear,
              currentMonth,
              closingDay
            );
            return rDate !== null && rDate > todayStr;
          });

          const futureAmount = futureRecurrings.reduce(
            (sum, r) => sum + r.amount_cents,
            0
          );
          monthlyAmount = realSoFar + futureAmount;

          // Forecast full month = all active recurrings for the month
          forecastFull = allCategoryRecurrings.reduce(
            (sum, r) => sum + r.amount_cents,
            0
          );

          // Forecast to date = recurrings with date <= today
          forecastToDate = allCategoryRecurrings
            .filter((r) => {
              const rDate = getRecurringDateInCompetency(
                r.day_of_month,
                currentYear,
                currentMonth,
                closingDay
              );
              return rDate !== null && rDate <= todayStr;
            })
            .reduce((sum, r) => sum + r.amount_cents, 0);

          hasPontual = allCategoryRecurrings.some(
            (r) => r.start_month !== null && r.start_month === r.end_month
          );
        } else {
          // Historical: real until today + (average / days_in_period * remaining_days)
          const categoryTransactions = transactions.filter(
            (t) => t.category_id === category.id
          );
          if (categoryTransactions.length > 0) {
            const totalHistorical = categoryTransactions.reduce(
              (sum, t) => sum + t.amount_cents,
              0
            );
            const catMonths = monthsPerCategory.get(category.id) ?? 1;
            const monthlyAvg = totalHistorical / catMonths;
            const remainingDays = daysInCurrentPeriod - elapsedDays;
            const projectedRemaining = Math.round(
              (monthlyAvg / daysInCurrentPeriod) * remainingDays
            );
            monthlyAmount = realSoFar + projectedRemaining;

            forecastFull = Math.round(monthlyAvg);
            forecastToDate = Math.round(
              (monthlyAvg / daysInCurrentPeriod) * elapsedDays
            );
          } else {
            monthlyAmount = realSoFar;
          }
        }
      } else if (category.projection_type === "recurring") {
        const categoryRecurrings = recurrings.filter(
          (r) =>
            r.category_id === category.id &&
            isRecurringActiveInMonth(r, targetCompetencyLabel)
        );
        monthlyAmount = categoryRecurrings.reduce(
          (sum, r) => sum + r.amount_cents,
          0
        );
        forecastFull = monthlyAmount;
        hasPontual = categoryRecurrings.some(
          (r) => r.start_month !== null && r.start_month === r.end_month
        );
      } else {
        const categoryTransactions = transactions.filter(
          (t) => t.category_id === category.id
        );
        if (categoryTransactions.length > 0) {
          const totalAmount = categoryTransactions.reduce(
            (sum, t) => sum + t.amount_cents,
            0
          );
          const catMonths = monthsPerCategory.get(category.id) ?? 1;
          monthlyAmount = Math.round(totalAmount / catMonths);
          forecastFull = monthlyAmount;
        }
      }

      if (monthlyAmount > 0 || forecastFull > 0 || realSoFar > 0) {
        byCategory.push({
          categoryId: category.id,
          categoryName: category.name,
          type: category.type,
          projectedAmount: monthlyAmount,
          forecastAmount: forecastFull,
          forecastToDateAmount: forecastToDate,
          realAmount: realSoFar,
          projectionType: category.projection_type,
          hasPontual,
        });
      }
    }

    byCategory.sort((a, b) => b.projectedAmount - a.projectedAmount);

    const totalReceitas = byCategory
      .filter((c) => c.type === "receita")
      .reduce((sum, c) => sum + c.projectedAmount, 0);

    const totalDespesas = byCategory
      .filter((c) => c.type === "despesa")
      .reduce((sum, c) => sum + c.projectedAmount, 0);

    const forecastReceitas = byCategory
      .filter((c) => c.type === "receita")
      .reduce((sum, c) => sum + c.forecastAmount, 0);

    const forecastDespesas = byCategory
      .filter((c) => c.type === "despesa")
      .reduce((sum, c) => sum + c.forecastAmount, 0);

    const forecastToDateReceitas = byCategory
      .filter((c) => c.type === "receita")
      .reduce((sum, c) => sum + c.forecastToDateAmount, 0);

    const forecastToDateDespesas = byCategory
      .filter((c) => c.type === "despesa")
      .reduce((sum, c) => sum + c.forecastToDateAmount, 0);

    const realReceitas = byCategory
      .filter((c) => c.type === "receita")
      .reduce((sum, c) => sum + c.realAmount, 0);

    const realDespesas = byCategory
      .filter((c) => c.type === "despesa")
      .reduce((sum, c) => sum + c.realAmount, 0);

    months.push({
      label,
      isCurrentMonth,
      byCategory,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      forecastReceitas,
      forecastDespesas,
      forecastSaldo: forecastReceitas - forecastDespesas,
      forecastToDateReceitas,
      forecastToDateDespesas,
      forecastToDateSaldo: forecastToDateReceitas - forecastToDateDespesas,
      realReceitas,
      realDespesas,
      realSaldo: realReceitas - realDespesas,
    });
  }

  return { months };
}

interface HistoricalResult {
  transactions: TransactionRow[];
  monthsPerCategory: Map<string, number>;
}

async function getHistoricalTransactions(
  supabase: SupabaseClient<Database>,
  closingDay: number = 1
): Promise<HistoricalResult> {
  const now = new Date();
  const { year: curYear, month: curMonth } =
    getCurrentCompetencyMonth(closingDay, now);

  // Go back 3 competency months from the previous one
  let lookbackYear = curYear;
  let lookbackMonth = curMonth - 3;
  while (lookbackMonth < 0) {
    lookbackMonth += 12;
    lookbackYear--;
  }

  // End of previous competency period
  let prevYear = curYear;
  let prevMonth = curMonth - 1;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }

  const startRange = getCompetencyRange(lookbackYear, lookbackMonth, closingDay);
  const endRange = getCompetencyRange(prevYear, prevMonth, closingDay);

  const { data } = await supabase
    .from("transactions")
    .select("category_id, type, amount_cents, date")
    .gte("date", startRange.start)
    .lte("date", endRange.end);

  const transactions = (data as TransactionRow[]) ?? [];

  // Count distinct competency months per category
  const categoryMonthSets = new Map<string, Set<string>>();
  for (const t of transactions) {
    // Determine which competency month this transaction belongs to
    const tDate = new Date(t.date + "T00:00:00");
    const { year: tYear, month: tMonth } = getCurrentCompetencyMonth(closingDay, tDate);
    const key = `${tYear}-${tMonth}`;
    let s = categoryMonthSets.get(t.category_id);
    if (!s) {
      s = new Set<string>();
      categoryMonthSets.set(t.category_id, s);
    }
    s.add(key);
  }

  const monthsPerCategory = new Map<string, number>();
  for (const [catId, months] of categoryMonthSets) {
    monthsPerCategory.set(catId, months.size);
  }

  return { transactions, monthsPerCategory };
}

function isRecurringActiveInMonth(
  recurring: RecurringRow,
  targetMonth: string
): boolean {
  const { start_month, end_month } = recurring;
  if (start_month && targetMonth < start_month) return false;
  if (end_month && targetMonth > end_month) return false;
  return true;
}
