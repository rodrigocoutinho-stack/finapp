"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AccountForm } from "@/components/contas/account-form";
import { AccountList } from "@/components/contas/account-list";
import { AccountReconciliation } from "@/components/contas/account-reconciliation";
import { useToast } from "@/contexts/toast-context";
import type { Account } from "@/types/database";

interface TransactionSummary {
  account_id: string;
  type: "receita" | "despesa" | "transferencia";
  amount_cents: number;
  destination_account_id?: string | null;
}

export default function ContasPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReconciliation, setShowReconciliation] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [accountsRes, txnsRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("transactions")
        .select("account_id, type, amount_cents, destination_account_id")
        .limit(10000),
    ]);

    setAccounts((accountsRes.data as Account[]) ?? []);
    setTransactions((txnsRes.data as TransactionSummary[]) ?? []);
    setLoading(false);
  }, []);

  const existingGroups = useMemo(
    () => [...new Set(accounts.map((a) => a.account_group).filter(Boolean))] as string[],
    [accounts]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <PageHeader
        title="Contas"
        description="Gerencie suas contas bancárias, cartões e carteiras"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowReconciliation(true)}
            >
              Reconciliar
            </Button>
            <Button onClick={() => setShowForm(true)}>Nova conta</Button>
          </div>
        }
      />

      {loading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : (
        <AccountList accounts={accounts} existingGroups={existingGroups} onRefresh={fetchData} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova conta"
      >
        <AccountForm
          existingGroups={existingGroups}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
            addToast("Conta criada com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        open={showReconciliation}
        onClose={() => setShowReconciliation(false)}
        title="Reconciliação de Saldo"
      >
        <AccountReconciliation
          accounts={accounts}
          transactions={transactions}
          onRefresh={() => {
            fetchData();
          }}
        />
      </Modal>
    </div>
  );
}
