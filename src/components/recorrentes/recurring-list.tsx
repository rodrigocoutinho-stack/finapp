"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RecurringForm } from "./recurring-form";
import { formatCurrency, formatMonthLabel } from "@/lib/utils";
import type { Account, Category, RecurringTransaction } from "@/types/database";

interface RecurringWithRelations extends RecurringTransaction {
  accounts: { name: string } | null;
  categories: { name: string } | null;
}

interface RecurringListProps {
  recurrings: RecurringWithRelations[];
  accounts: Account[];
  categories: Category[];
  onRefresh: () => void;
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
}: RecurringListProps) {
  const supabase = createClient();
  const [editingRecurring, setEditingRecurring] = useState<RecurringWithRelations | null>(null);
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deletingRecurring) return;
    setDeleteLoading(true);

    await supabase.from("recurring_transactions").delete().eq("id", deletingRecurring.id);

    setDeleteLoading(false);
    setDeletingRecurring(null);
    onRefresh();
  }

  async function handleToggleActive(recurring: RecurringWithRelations) {
    await supabase
      .from("recurring_transactions")
      .update({ is_active: !recurring.is_active })
      .eq("id", recurring.id);
    onRefresh();
  }

  if (recurrings.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Nenhuma transação recorrente cadastrada.
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Conta</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Dia</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Período</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recurrings.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{r.description}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.categories?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.accounts?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {r.day_of_month}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const badge = getPeriodBadge(r);
                      return (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      r.type === "receita" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {r.type === "receita" ? "+" : "-"}{" "}
                    {formatCurrency(r.amount_cents)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(r)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
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
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingRecurring(r)}
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
        <p className="text-gray-600 mb-6">
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
