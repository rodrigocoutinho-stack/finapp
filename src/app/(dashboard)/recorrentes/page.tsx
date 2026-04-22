"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { RecurringForm } from "@/components/recorrentes/recurring-form";
import { RecurringList } from "@/components/recorrentes/recurring-list";
import { useToast } from "@/contexts/toast-context";
import type { Account, Category, RecurringTransaction } from "@/types/database";

const PAGE_SIZE = 50;

interface RecurringWithRelations extends RecurringTransaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
  destination_accounts: { name: string } | null;
}

function RecorrentesContent() {
  const supabase = createClient();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [recurrings, setRecurrings] = useState<RecurringWithRelations[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Pre-fill values from searchParams (from recurrence suggestions) — sanitized
  const rawDesc = searchParams.get("desc");
  const initialDescription = rawDesc ? rawDesc.slice(0, 200) : undefined;

  const rawTipo = searchParams.get("tipo");
  const initialType: "receita" | "despesa" | "transferencia" | "investimento" | undefined =
    rawTipo === "receita" || rawTipo === "despesa" || rawTipo === "transferencia" || rawTipo === "investimento"
      ? rawTipo
      : undefined;

  const rawValor = searchParams.get("valor");
  const parsedValor = rawValor ? parseInt(rawValor, 10) : NaN;
  const initialAmount = !isNaN(parsedValor) && parsedValor > 0 && parsedValor < 1_000_000_00
    ? parsedValor : undefined;

  const rawDia = searchParams.get("dia");
  const parsedDia = rawDia ? parseInt(rawDia, 10) : NaN;
  const initialDay = !isNaN(parsedDia) && parsedDia >= 1 && parsedDia <= 31
    ? parsedDia : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);

    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const [recRes, accRes, catRes] = await Promise.all([
      supabase
        .from("recurring_transactions")
        .select("*, accounts:accounts!account_id(name), categories(name), destination_accounts:accounts!destination_account_id(name)", { count: "exact" })
        .order("day_of_month")
        .range(from, to),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    setRecurrings((recRes.data as RecurringWithRelations[]) ?? []);
    setTotalCount(recRes.count ?? 0);
    setAccounts((accRes.data as Account[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setLoading(false);
  }, [currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Auto-open form when redirected from suggestions
  useEffect(() => {
    if (searchParams.get("novo") === "1" && !loading) {
      setShowForm(true);
    }
  }, [searchParams, loading]);

  return (
    <div>
      <PageHeader
        title="Transações Planejadas"
        description="Gerencie recorrentes, pontuais e despesas com período definido"
        action={<Button onClick={() => setShowForm(true)}>Nova transação</Button>}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <RecurringList
          recurrings={recurrings}
          accounts={accounts}
          categories={categories}
          onRefresh={fetchData}
          pagination={totalPages > 1 ? {
            currentPage,
            totalPages,
            totalCount,
            onPageChange: setCurrentPage,
            pageSize: PAGE_SIZE,
          } : undefined}
        />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova transação planejada"
      >
        <RecurringForm
          accounts={accounts}
          categories={categories}
          initialDescription={initialDescription}
          initialAmountCents={initialAmount}
          initialType={initialType}
          initialDay={initialDay}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
            addToast("Transação planejada criada com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}

export default function RecorrentesPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} cols={6} />}>
      <RecorrentesContent />
    </Suspense>
  );
}
