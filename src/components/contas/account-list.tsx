"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AccountForm } from "./account-form";
import { formatCurrency } from "@/lib/utils";
import type { Account } from "@/types/database";

const typeLabels: Record<Account["type"], string> = {
  banco: "Banco",
  cartao: "Cartão",
  carteira: "Carteira",
};

interface AccountListProps {
  accounts: Account[];
  onRefresh: () => void;
}

export function AccountList({ accounts, onRefresh }: AccountListProps) {
  const supabase = createClient();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deletingAccount) return;
    setDeleteLoading(true);

    await supabase.from("accounts").delete().eq("id", deletingAccount.id);

    setDeleteLoading(false);
    setDeletingAccount(null);
    onRefresh();
  }

  if (accounts.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Nenhuma conta cadastrada. Clique em &quot;Nova conta&quot; para começar.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{account.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {typeLabels[account.type]}
                </span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">
              {formatCurrency(account.balance_cents)}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => setEditingAccount(account)}
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeletingAccount(account)}
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        title="Editar conta"
      >
        {editingAccount && (
          <AccountForm
            account={editingAccount}
            onSuccess={() => {
              setEditingAccount(null);
              onRefresh();
            }}
            onCancel={() => setEditingAccount(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        title="Excluir conta"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir a conta{" "}
          <strong>{deletingAccount?.name}</strong>? Esta ação não pode ser
          desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingAccount(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}
