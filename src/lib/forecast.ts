import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Category, RecurringTransaction } from "@/types/database";

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  type: "receita" | "despesa";
  projectedAmount: number;
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
  includeCurrentMonth: boolean = false
): Promise<ForecastResult> {
  const now = new Date();
  const todayDay = now.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = now.toISOString().split("T")[0];

  // Build the start of the month for current month transactions
  const currentMonthStart = `${currentMonthStr}-01`;

  const [categoriesRes, recurringRes, historicalRes, currentMonthRes] =
    await Promise.all([
      supabase.from("categories").select("*"),
      supabase
        .from("recurring_transactions")
        .select("*, categories(name)")
        .eq("is_active", true),
      getHistoricalTransactions(supabase),
      includeCurrentMonth
        ? supabase
            .from("transactions")
            .select("category_id, type, amount_cents, date")
            .gte("date", currentMonthStart)
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
    const futureDate = new Date(currentYear, currentMonth + i, 1);
    const label = futureDate.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });
    const targetMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, "0")}`;
    const isCurrentMonth = i === 0;

    const byCategory: CategoryForecast[] = [];

    for (const category of categories) {
      let monthlyAmount = 0;
      let hasPontual = false;

      if (isCurrentMonth) {
        // Mix real + planned for current month
        // Real: sum of transactions up to today for this category
        const realAmount = currentMonthTransactions
          .filter((t) => t.category_id === category.id)
          .reduce((sum, t) => sum + t.amount_cents, 0);

        if (category.projection_type === "recurring") {
          // Real until today + recurring with day_of_month > today
          const futureRecurrings = recurrings.filter(
            (r) =>
              r.category_id === category.id &&
              r.day_of_month > todayDay &&
              isRecurringActiveInMonth(r, currentMonthStr)
          );
          const futureAmount = futureRecurrings.reduce(
            (sum, r) => sum + r.amount_cents,
            0
          );
          monthlyAmount = realAmount + futureAmount;

          const allCategoryRecurrings = recurrings.filter(
            (r) =>
              r.category_id === category.id &&
              isRecurringActiveInMonth(r, currentMonthStr)
          );
          hasPontual = allCategoryRecurrings.some(
            (r) => r.start_month !== null && r.start_month === r.end_month
          );
        } else {
          // Historical: real until today + (average / days_in_month * remaining_days)
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
            const remainingDays = daysInCurrentMonth - todayDay;
            const projectedRemaining = Math.round(
              (monthlyAvg / daysInCurrentMonth) * remainingDays
            );
            monthlyAmount = realAmount + projectedRemaining;
          } else {
            monthlyAmount = realAmount;
          }
        }
      } else if (category.projection_type === "recurring") {
        // Future months: same as before
        const categoryRecurrings = recurrings.filter(
          (r) =>
            r.category_id === category.id &&
            isRecurringActiveInMonth(r, targetMonth)
        );
        monthlyAmount = categoryRecurrings.reduce(
          (sum, r) => sum + r.amount_cents,
          0
        );
        hasPontual = categoryRecurrings.some(
          (r) => r.start_month !== null && r.start_month === r.end_month
        );
      } else {
        // Historical projection for future months
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
        }
      }

      if (monthlyAmount > 0) {
        byCategory.push({
          categoryId: category.id,
          categoryName: category.name,
          type: category.type,
          projectedAmount: monthlyAmount,
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

    months.push({
      label,
      isCurrentMonth,
      byCategory,
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
    });
  }

  return { months };
}

interface HistoricalResult {
  transactions: TransactionRow[];
  monthsPerCategory: Map<string, number>;
}

async function getHistoricalTransactions(
  supabase: SupabaseClient<Database>
): Promise<HistoricalResult> {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const startDate = threeMonthsAgo.toISOString().split("T")[0];
  const endDate = endOfLastMonth.toISOString().split("T")[0];

  const { data } = await supabase
    .from("transactions")
    .select("category_id, type, amount_cents, date")
    .gte("date", startDate)
    .lte("date", endDate);

  const transactions = (data as TransactionRow[]) ?? [];

  const categoryMonthSets = new Map<string, Set<string>>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
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
