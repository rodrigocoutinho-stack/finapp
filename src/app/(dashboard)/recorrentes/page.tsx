"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RecurringForm } from "@/components/recorrentes/recurring-form";
import { RecurringList } from "@/components/recorrentes/recurring-list";
import type { Account, Category, RecurringTransaction } from "@/types/database";

interface RecurringWithRelations extends RecurringTransaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
}

export default function RecorrentesPage() {
  const supabase = createClient();
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
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações Planejadas</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie recorrentes, pontuais e despesas com período definido
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Nova transação</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
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
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
