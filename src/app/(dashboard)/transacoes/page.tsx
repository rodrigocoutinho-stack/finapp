"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "@/components/transacoes/transaction-form";
import { TransactionList } from "@/components/transacoes/transaction-list";
import { getMonthRange, getMonthName } from "@/lib/utils";
import { getCurrentCompetencyMonth } from "@/lib/closing-day";
import { usePreferences } from "@/contexts/preferences-context";
import { useToast } from "@/contexts/toast-context";
import type { Account, Category } from "@/types/database";

interface TransactionWithRelations {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: "receita" | "despesa";
  amount_cents: number;
  description: string;
  date: string;
  created_at: string;
  accounts: { name: string } | null;
  categories: { name: string } | null;
}

export default function TransacoesPage() {
  return (
    <Suspense>
      <TransacoesContent />
    </Suspense>
  );
}

function TransacoesContent() {
  const supabase = createClient();
  const { addToast } = useToast();
  const { closingDay, loading: prefsLoading } = usePreferences();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { year: initYear, month: initMonth } = getCurrentCompetencyMonth(closingDay);
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<"receita" | "despesa" | undefined>();

  // Auto-open form from query param (?novo=receita|despesa)
  const novoParam = searchParams.get("novo");

  useEffect(() => {
    if ((novoParam === "receita" || novoParam === "despesa") && !loading) {
      setFormDefaultType(novoParam);
      setShowForm(true);
      router.replace("/transacoes", { scroll: false });
    }
  }, [novoParam, loading, router]);

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

    const [txRes, accRes, catRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*, accounts(name), categories(name)")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false })
        .limit(2000),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    setTransactions((txRes.data as TransactionWithRelations[]) ?? []);
    setAccounts((accRes.data as Account[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setLoading(false);
  }, [year, month, closingDay]);

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

  function handleCloseForm() {
    setShowForm(false);
    setFormDefaultType(undefined);
  }

  return (
    <div>
      <PageHeader
        title="Transações"
        description="Registre e acompanhe suas movimentações financeiras. Importe extratos e faturas em OFX, CSV ou PDF."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/transacoes/importar")}>
              Importar
            </Button>
            <Button onClick={() => setShowForm(true)}>Nova transação</Button>
          </div>
        }
      />

      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={prevMonth}
          aria-label="Mês anterior"
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
          {getMonthName(month)} {year}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Próximo mês"
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loading || prefsLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          onRefresh={fetchData}
        />
      )}

      <Modal
        open={showForm}
        onClose={handleCloseForm}
        title="Nova transação"
      >
        <TransactionForm
          accounts={accounts}
          categories={categories}
          defaultType={formDefaultType}
          onSuccess={() => {
            handleCloseForm();
            fetchData();
            addToast("Transação criada com sucesso.");
          }}
          onCancel={handleCloseForm}
        />
      </Modal>
    </div>
  );
}
