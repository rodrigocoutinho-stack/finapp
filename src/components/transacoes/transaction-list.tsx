"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TransactionForm } from "./transaction-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types/database";

interface TransactionWithRelations extends Transaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
}

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  onRefresh,
}: TransactionListProps) {
  const supabase = createClient();
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deletingTransaction) return;
    setDeleteLoading(true);

    // Revert balance
    const account = accounts.find((a) => a.id === deletingTransaction.account_id);
    if (account) {
      const delta =
        deletingTransaction.type === "receita"
          ? -deletingTransaction.amount_cents
          : deletingTransaction.amount_cents;
      await supabase
        .from("accounts")
        .update({ balance_cents: account.balance_cents + delta })
        .eq("id", account.id);
    }

    await supabase.from("transactions").delete().eq("id", deletingTransaction.id);

    setDeleteLoading(false);
    setDeletingTransaction(null);
    onRefresh();
  }

  if (transactions.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Nenhuma transação encontrada neste mês.
      </p>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Conta</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 text-gray-900">{t.description}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.categories?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.accounts?.name ?? "-"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      t.type === "receita" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "receita" ? "+" : "-"}{" "}
                    {formatCurrency(t.amount_cents)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={() => setEditingTransaction(t)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingTransaction(t)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Editar transação"
      >
        {editingTransaction && (
          <TransactionForm
            transaction={editingTransaction}
            accounts={accounts}
            categories={categories}
            onSuccess={() => {
              setEditingTransaction(null);
              onRefresh();
            }}
            onCancel={() => setEditingTransaction(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        title="Excluir transação"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir a transação{" "}
          <strong>{deletingTransaction?.description}</strong>? O saldo da conta
          será ajustado automaticamente.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingTransaction(null)}>
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
