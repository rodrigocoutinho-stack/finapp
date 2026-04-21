"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable, type PaginationProps, type SortState } from "@/components/ui/data-table";
import { TransactionForm } from "./transaction-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import type { Account, Category, Transaction } from "@/types/database";

interface TransactionWithRelations extends Transaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
  destination_accounts: { name: string } | null;
}

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
  pagination?: PaginationProps;
  sortState?: SortState | null;
  onSortChange?: (key: string) => void;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  onRefresh,
  pagination,
  sortState,
  onSortChange,
}: TransactionListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deletingTransaction) return;
    setDeleteLoading(true);

    if (deletingTransaction.type === "transferencia") {
      // Revert transfer: +amount on origin, -amount on destination
      const [revertOrigin, revertDest] = await Promise.all([
        supabase.rpc("adjust_account_balance", {
          p_account_id: deletingTransaction.account_id,
          p_delta: deletingTransaction.amount_cents,
        }),
        supabase.rpc("adjust_account_balance", {
          p_account_id: deletingTransaction.destination_account_id!,
          p_delta: -deletingTransaction.amount_cents,
        }),
      ]);
      if (revertOrigin.error || revertDest.error) {
        addToast("Erro ao ajustar saldo das contas.", "error");
        setDeleteLoading(false);
        setDeletingTransaction(null);
        return;
      }
    } else {
      // Revert balance atomically
      const delta =
        deletingTransaction.type === "receita"
          ? -deletingTransaction.amount_cents
          : deletingTransaction.amount_cents;
      const { error: rpcError } = await supabase.rpc("adjust_account_balance", {
        p_account_id: deletingTransaction.account_id,
        p_delta: delta,
      });

      if (rpcError) {
        addToast("Erro ao ajustar saldo da conta.", "error");
        setDeleteLoading(false);
        setDeletingTransaction(null);
        return;
      }
    }

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", deletingTransaction.id);

    if (deleteError) {
      // Revert: re-apply the balance that was just removed
      if (deletingTransaction.type === "transferencia") {
        await Promise.all([
          supabase.rpc("adjust_account_balance", {
            p_account_id: deletingTransaction.account_id,
            p_delta: -deletingTransaction.amount_cents,
          }),
          supabase.rpc("adjust_account_balance", {
            p_account_id: deletingTransaction.destination_account_id!,
            p_delta: deletingTransaction.amount_cents,
          }),
        ]);
      } else {
        const reverseDelta =
          deletingTransaction.type === "receita"
            ? deletingTransaction.amount_cents
            : -deletingTransaction.amount_cents;
        await supabase.rpc("adjust_account_balance", {
          p_account_id: deletingTransaction.account_id,
          p_delta: reverseDelta,
        });
      }
      addToast("Erro ao excluir transação.", "error");
      setDeleteLoading(false);
      setDeletingTransaction(null);
      return;
    }

    logAudit(supabase, "transaction.delete", "transaction", deletingTransaction.id, { description: deletingTransaction.description, amount_cents: deletingTransaction.amount_cents });
    setDeleteLoading(false);
    setDeletingTransaction(null);
    onRefresh();
    addToast("Transação excluída.");
  }

  const columns = useMemo(() => [
    {
      key: "date",
      header: "Data",
      sortable: true,
      render: (t: TransactionWithRelations) => (
        <div className="flex flex-col">
          <span className="text-on-surface-secondary">{formatDate(t.date)}</span>
          {t.competency_month && (
            <span
              className="mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 w-fit"
              title="Competência diferente da data"
            >
              Competência {t.competency_month}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "Descrição",
      sortable: true,
      render: (t: TransactionWithRelations) => (
        <span className="text-on-surface">{t.description}</span>
      ),
    },
    {
      key: "category",
      header: "Categoria",
      sortable: true,
      render: (t: TransactionWithRelations) => (
        <span className="text-on-surface-secondary">
          {t.type === "transferencia" ? "Transferência" : (t.categories?.name ?? "-")}
        </span>
      ),
    },
    {
      key: "account",
      header: "Conta",
      sortable: true,
      render: (t: TransactionWithRelations) => (
        <span className="text-on-surface-secondary">
          {t.type === "transferencia"
            ? `${t.accounts?.name ?? "-"} → ${t.destination_accounts?.name ?? "-"}`
            : (t.accounts?.name ?? "-")}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Valor",
      sortable: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (t: TransactionWithRelations) => (
        <span
          className={`font-medium ${
            t.type === "receita"
              ? "text-emerald-600"
              : t.type === "transferencia"
                ? "text-blue-600 dark:text-blue-400"
                : t.type === "investimento"
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-rose-600"
          }`}
        >
          {t.type === "receita" ? "+" : t.type === "transferencia" ? "" : "-"} {formatCurrency(t.amount_cents)}
        </span>
      ),
    },
  ], []);

  return (
    <>
      <DataTable
        columns={columns}
        data={transactions}
        keyExtractor={(t) => t.id}
        emptyMessage="Nenhuma transação encontrada neste mês."
        pagination={pagination}
        sortState={sortState}
        onSortChange={onSortChange}
        actions={(t) => (
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
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 dark:bg-red-950"
              onClick={() => setDeletingTransaction(t)}
            >
              Excluir
            </Button>
          </div>
        )}
      />

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
              addToast("Transação atualizada.");
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
        <p className="text-on-surface-secondary mb-6">
          Tem certeza que deseja excluir a transação{" "}
          <strong>{deletingTransaction?.description}</strong>?{" "}
          {deletingTransaction?.type === "transferencia"
            ? "Os saldos de ambas as contas serão ajustados automaticamente."
            : "O saldo da conta será ajustado automaticamente."}
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
