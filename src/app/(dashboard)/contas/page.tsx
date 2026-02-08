"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AccountForm } from "@/components/contas/account-form";
import { AccountList } from "@/components/contas/account-list";
import type { Account } from "@/types/database";

export default function ContasPage() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    setAccounts((data as Account[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie suas contas bancárias, cartões e carteiras
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Nova conta</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <AccountList accounts={accounts} onRefresh={fetchAccounts} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova conta"
      >
        <AccountForm
          onSuccess={() => {
            setShowForm(false);
            fetchAccounts();
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
