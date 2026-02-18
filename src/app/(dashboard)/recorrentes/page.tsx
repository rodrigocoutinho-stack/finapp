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

interface RecurringWithRelations extends RecurringTransaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
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

  // Pre-fill values from searchParams (from recurrence suggestions)
  const initialDescription = searchParams.get("desc") ?? undefined;
  const initialAmount = searchParams.get("valor") ? parseInt(searchParams.get("valor")!, 10) : undefined;
  const initialType = (searchParams.get("tipo") as "receita" | "despesa" | null) ?? undefined;
  const initialDay = searchParams.get("dia") ? parseInt(searchParams.get("dia")!, 10) : undefined;

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [recRes, accRes, catRes] = await Promise.all([
      supabase
        .from("recurring_transactions")
        .select("*, accounts(name), categories(name)")
        .order("day_of_month")
        .limit(1000),
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    setRecurrings((recRes.data as RecurringWithRelations[]) ?? []);
    setAccounts((accRes.data as Account[]) ?? []);
    setCategories((catRes.data as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
