"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type PaginationProps } from "@/components/ui/data-table";
import { RecurringForm } from "./recurring-form";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";
import type { Account, Category, RecurringTransaction } from "@/types/database";

interface RecurringWithRelations extends RecurringTransaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
  destination_accounts: { name: string } | null;
}

interface RecurringListProps {
  recurrings: RecurringWithRelations[];
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
  pagination?: PaginationProps;
}

function getPeriodBadge(r: RecurringWithRelations) {
  if (!r.start_month && !r.end_month) {
    return { label: "Recorrente", className: "bg-blue-100 text-blue-800" };
  }
  if (r.start_month === r.end_month) {
    return {
      label: `Pontual (${formatMonthLabel(r.start_month!)})`,
      className: "bg-purple-100 text-purple-800",
    };
  }
  const start = formatMonthLabel(r.start_month!);
  const end = r.end_month ? formatMonthLabel(r.end_month) : "...";
  return {
    label: `${start} a ${end}`,
    className: "bg-indigo-100 text-indigo-800",
  };
}

export function RecurringList({
  recurrings,
  accounts,
  categories,
  onRefresh,
  pagination,
}: RecurringListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editingRecurring, setEditingRecurring] = useState<RecurringWithRelations | null>(null);
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deletingRecurring) return;
    setDeleteLoading(true);

    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", deletingRecurring.id);

    setDeleteLoading(false);
    if (error) {
      addToast("Erro ao excluir transação planejada.", "error");
      return;
    }
    setDeletingRecurring(null);
    onRefresh();
    addToast("Transação planejada excluída.");
  }

  async function handleToggleActive(recurring: RecurringWithRelations) {
    setTogglingId(recurring.id);
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: !recurring.is_active })
      .eq("id", recurring.id);
    setTogglingId(null);
    if (error) {
      addToast("Erro ao alterar status da transação.", "error");
      return;
    }
    onRefresh();
    addToast(recurring.is_active ? "Transação desativada." : "Transação ativada.");
  }

  const columns = [
    {
      key: "description",
      header: "Descrição",
      render: (r: RecurringWithRelations) => (
        <span className="text-on-surface">{r.description}</span>
      ),
    },
    {
      key: "category",
      header: "Categoria",
      render: (r: RecurringWithRelations) => (
        <span className="text-on-surface-secondary">
          {r.type === "transferencia" ? "Transferência" : (r.categories?.name ?? "-")}
        </span>
      ),
    },
    {
      key: "account",
      header: "Conta",
      render: (r: RecurringWithRelations) => (
        <span className="text-on-surface-secondary">
          {r.type === "transferencia"
            ? `${r.accounts?.name ?? "-"} → ${r.destination_accounts?.name ?? "-"}`
            : (r.accounts?.name ?? "-")}
        </span>
      ),
    },
    {
      key: "day",
      header: "Dia",
      headerClassName: "text-center",
      className: "text-center text-on-surface-secondary",
      render: (r: RecurringWithRelations) => r.day_of_month,
    },
    {
      key: "period",
      header: "Período",
      headerClassName: "text-center",
      className: "text-center",
      render: (r: RecurringWithRelations) => {
        const badge = getPeriodBadge(r);
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Valor",
      headerClassName: "text-right",
      className: "text-right font-medium",
      render: (r: RecurringWithRelations) => (
        <span className={
          r.type === "receita"
            ? "text-emerald-600"
            : r.type === "transferencia"
              ? "text-blue-600 dark:text-blue-400"
              : "text-rose-600"
        }>
          {r.type === "receita" ? "+" : r.type === "transferencia" ? "" : "-"} {formatCurrency(r.amount_cents)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      className: "text-center",
      render: (r: RecurringWithRelations) => (
        <button
          onClick={() => handleToggleActive(r)}
          disabled={togglingId === r.id}
          role="switch"
          aria-checked={r.is_active}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            r.is_active
              ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
              : "bg-tab-bg text-on-surface-secondary"
          }`}
        >
          {r.is_active ? "Ativo" : "Inativo"}
        </button>
      ),
    },
  ];

  if (recurrings.length === 0) {
    return <EmptyState message="Nenhuma transação recorrente cadastrada." />;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={recurrings}
        keyExtractor={(r) => r.id}
        pagination={pagination}
        actions={(r) => (
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => setEditingRecurring(r)}
            >
              Editar
            </Button>
            <Button
              variant="ghost"
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 dark:bg-red-950"
              onClick={() => setDeletingRecurring(r)}
            >
              Excluir
            </Button>
          </div>
        )}
      />

      <Modal
        open={!!editingRecurring}
        onClose={() => setEditingRecurring(null)}
        title="Editar recorrente"
      >
        {editingRecurring && (
          <RecurringForm
            recurring={editingRecurring}
            accounts={accounts}
            categories={categories}
            onSuccess={() => {
              setEditingRecurring(null);
              onRefresh();
              addToast("Transação planejada atualizada.");
            }}
            onCancel={() => setEditingRecurring(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deletingRecurring}
        onClose={() => setDeletingRecurring(null)}
        title="Excluir transação recorrente"
      >
        <p className="text-on-surface-secondary mb-6">
          Tem certeza que deseja excluir a transação recorrente{" "}
          <strong>{deletingRecurring?.description}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingRecurring(null)}>
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
