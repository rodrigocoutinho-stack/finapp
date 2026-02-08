"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthPicker } from "@/components/dashboard/month-picker";
import { getMonthRange, formatCurrency, formatDate } from "@/lib/utils";

interface TransactionRow {
  id: string;
  type: "receita" | "despesa";
  amount_cents: number;
  description: string;
  date: string;
  categories: { name: string } | null;
  accounts: { name: string } | null;
}

export default function DashboardPage() {
  const supabase = createClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getMonthRange(year, month);

    const { data } = await supabase
      .from("transactions")
      .select("id, type, amount_cents, description, date, categories(name), accounts(name)")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    setTransactions((data as TransactionRow[]) ?? []);
    setLoading(false);
  }, [supabase, year, month]);

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

  // Compute totals
  const totalReceitas = transactions
    .filter((t) => t.type === "receita")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalDespesas = transactions
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  // Compute category chart data (despesas only)
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

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            Visão geral das suas finanças
          </p>
        </div>
      </div>

      <div className="mb-6">
        <MonthPicker year={year} month={month} onPrev={prevMonth} onNext={nextMonth} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="space-y-8">
          <SummaryCards totalReceitas={totalReceitas} totalDespesas={totalDespesas} />

          {/* Category chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Despesas por Categoria
            </h2>
            <CategoryChart data={chartData} />
          </div>

          {/* Recent transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Últimas Transações
            </h2>
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Nenhuma transação neste mês.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {t.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(t.date)} &middot;{" "}
                        {t.categories?.name ?? "-"} &middot;{" "}
                        {t.accounts?.name ?? "-"}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        t.type === "receita" ? "text-emerald-600" : "text-red-600"
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
