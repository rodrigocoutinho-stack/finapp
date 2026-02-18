"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function RecorrentesPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [recurrings, setRecurrings] = useState<RecurringWithRelations[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [recRes, accRes, catRes] = await Promise.all([
      supabase
        .from("recurring_transactions")
        .select("*, accounts(name), categories(name)")
        .order("day_of_month"),
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
