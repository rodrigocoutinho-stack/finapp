"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AccountForm } from "@/components/contas/account-form";
import { AccountList } from "@/components/contas/account-list";
import { useToast } from "@/contexts/toast-context";
import type { Account } from "@/types/database";

export default function ContasPage() {
  const supabase = createClient();
  const { addToast } = useToast();
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
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Gerencie suas contas bancárias, cartões e carteiras"
        action={<Button onClick={() => setShowForm(true)}>Nova conta</Button>}
      />

      {loading ? (
        <TableSkeleton rows={4} cols={3} />
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
            addToast("Conta criada com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
