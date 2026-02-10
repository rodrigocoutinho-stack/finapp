import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Category, RecurringTransaction } from "@/types/database";

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  type: "receita" | "despesa";
  projectedAmount: number;
  projectionType: "recurring" | "historical";
}

export interface MonthForecast {
  label: string;
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
  monthsAhead: number = 3
): Promise<ForecastResult> {
  const [categoriesRes, recurringRes, transactionsRes] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase
      .from("recurring_transactions")
      .select("*, categories(name)")
      .eq("is_active", true),
    getHistoricalTransactions(supabase),
  ]);

  const categories = (categoriesRes.data as Category[]) ?? [];
  const recurrings = (recurringRes.data as RecurringRow[]) ?? [];
  const { transactions, monthsPerCategory } = transactionsRes;

  const now = new Date();
  const months: MonthForecast[] = [];

  for (let i = 1; i <= monthsAhead; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = futureDate.toLocaleDateString("pt-BR", {
      month: "short",
      year: "numeric",
    });

    const byCategory: CategoryForecast[] = [];

    for (const category of categories) {
      let monthlyAmount = 0;

      if (category.projection_type === "recurring") {
        const categoryRecurrings = recurrings.filter(
          (r) => r.category_id === category.id
        );
        monthlyAmount = categoryRecurrings.reduce(
          (sum, r) => sum + r.amount_cents,
          0
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
        }
      }

      if (monthlyAmount > 0) {
        byCategory.push({
          categoryId: category.id,
          categoryName: category.name,
          type: category.type,
          projectedAmount: monthlyAmount,
          projectionType: category.projection_type,
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
