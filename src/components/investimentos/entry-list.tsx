"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DataTable } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvestmentEntry } from "@/types/database";

const typeBadge: Record<InvestmentEntry["type"], { label: string; class: string }> = {
  aporte: { label: "Aporte", class: "bg-emerald-100 text-emerald-700" },
  resgate: { label: "Resgate", class: "bg-rose-100 text-rose-700" },
  saldo: { label: "Saldo", class: "bg-blue-100 text-blue-700" },
};

interface EntryListProps {
  entries: InvestmentEntry[];
  onRefresh: () => void;
}

export function EntryList({ entries, onRefresh }: EntryListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [deletingEntry, setDeletingEntry] = useState<InvestmentEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deletingEntry) return;
    setDeleteLoading(true);
    const { error } = await supabase.from("investment_entries").delete().eq("id", deletingEntry.id);
    setDeleteLoading(false);
    if (error) {
      addToast("Erro ao excluir lançamento.", "error");
      return;
    }
    setDeletingEntry(null);
    onRefresh();
    addToast("Lançamento excluído.");
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const columns = [
    {
      key: "type",
      header: "Tipo",
      render: (entry: InvestmentEntry) => {
        const badge = typeBadge[entry.type];
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.class}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Valor",
      headerClassName: "text-right",
      className: "text-right font-medium text-slate-900",
      render: (entry: InvestmentEntry) => formatCurrency(entry.amount_cents),
    },
    {
      key: "date",
      header: "Data",
      className: "text-slate-600",
      render: (entry: InvestmentEntry) => formatDate(entry.date),
    },
    {
      key: "notes",
      header: "Obs.",
      className: "text-slate-500 max-w-[150px] truncate",
      render: (entry: InvestmentEntry) => entry.notes ?? "-",
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={sorted}
        keyExtractor={(entry) => entry.id}
        emptyMessage="Nenhum lançamento registrado."
        actions={(entry) => (
          <Button
            variant="ghost"
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setDeletingEntry(entry)}
          >
            Excluir
          </Button>
        )}
      />

      <Modal
        open={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        title="Excluir lançamento"
      >
        <p className="text-slate-600 mb-6">
          Tem certeza que deseja excluir este lançamento de{" "}
          <strong>{deletingEntry ? formatCurrency(deletingEntry.amount_cents) : ""}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingEntry(null)}>
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
