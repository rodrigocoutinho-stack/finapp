"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InvestmentEntry } from "@/types/database";

const typeBadge: Record<InvestmentEntry["type"], { label: string; class: string }> = {
  aporte: { label: "Aporte", class: "bg-emerald-100 text-emerald-700" },
  resgate: { label: "Resgate", class: "bg-red-100 text-red-700" },
  saldo: { label: "Saldo", class: "bg-blue-100 text-blue-700" },
};

interface EntryListProps {
  entries: InvestmentEntry[];
  onRefresh: () => void;
}

export function EntryList({ entries, onRefresh }: EntryListProps) {
  const supabase = createClient();
  const [deletingEntry, setDeletingEntry] = useState<InvestmentEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!deletingEntry) return;
    setDeleteLoading(true);
    await supabase.from("investment_entries").delete().eq("id", deletingEntry.id);
    setDeleteLoading(false);
    setDeletingEntry(null);
    onRefresh();
  }

  if (entries.length === 0) {
    return (
      <p className="text-gray-500 text-center py-6 text-sm">
        Nenhum lançamento registrado.
      </p>
    );
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-3 font-medium text-gray-600">Tipo</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600">Valor</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Data</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">Obs.</th>
              <th className="py-2 pl-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => {
              const badge = typeBadge[entry.type];
              return (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.class}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3 font-medium text-gray-900">
                    {formatCurrency(entry.amount_cents)}
                  </td>
                  <td className="py-2 px-3 text-gray-600">{formatDate(entry.date)}</td>
                  <td className="py-2 px-3 text-gray-500 max-w-[150px] truncate">
                    {entry.notes ?? "-"}
                  </td>
                  <td className="py-2 pl-3">
                    <Button
                      variant="ghost"
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletingEntry(entry)}
                    >
                      Excluir
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        title="Excluir lançamento"
      >
        <p className="text-gray-600 mb-6">
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
