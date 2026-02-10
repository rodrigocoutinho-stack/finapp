import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Category, RecurringTransaction } from "@/types/database";

export interface CategoryForecast {
  categoryId: string;
  categoryName: string;
  type: "receita" | "despesa";
  projectedAmount: number;
  projectionType: "recurring" | "historical";
}

export interface ForecastResult {
  totalReceitas: number;
  totalDespesas: number;
  resultado: number;
  byCategory: CategoryForecast[];
}

interface TransactionRow {
  category_id: string;
  type: "receita" | "despesa";
  amount_cents: number;
}

interface RecurringRow extends RecurringTransaction {
  categories: { name: string } | null;
}

export async function calculateForecast(
  supabase: SupabaseClient<Database>,
  months: number = 3
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
  const transactions = transactionsRes;

  const byCategory: CategoryForecast[] = [];

  for (const category of categories) {
    let projectedAmount = 0;

    if (category.projection_type === "recurring") {
      const categoryRecurrings = recurrings.filter(
        (r) => r.category_id === category.id
      );
      const monthlyTotal = categoryRecurrings.reduce(
        (sum, r) => sum + r.amount_cents,
        0
      );
      projectedAmount = monthlyTotal * months;
    } else {
      const categoryTransactions = transactions.filter(
        (t) => t.category_id === category.id
      );
      if (categoryTransactions.length > 0) {
        const totalAmount = categoryTransactions.reduce(
          (sum, t) => sum + t.amount_cents,
          0
        );
        const monthlyAverage = totalAmount / 3;
        projectedAmount = Math.round(monthlyAverage * months);
      }
    }

    if (projectedAmount > 0) {
      byCategory.push({
        categoryId: category.id,
        categoryName: category.name,
        type: category.type,
        projectedAmount,
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

  return {
    totalReceitas,
    totalDespesas,
    resultado: totalReceitas - totalDespesas,
    byCategory,
  };
}

async function getHistoricalTransactions(
  supabase: SupabaseClient<Database>
): Promise<TransactionRow[]> {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const startDate = threeMonthsAgo.toISOString().split("T")[0];
  const endDate = endOfLastMonth.toISOString().split("T")[0];

  const { data } = await supabase
    .from("transactions")
    .select("category_id, type, amount_cents")
    .gte("date", startDate)
    .lte("date", endDate);

  return (data as TransactionRow[]) ?? [];
}
