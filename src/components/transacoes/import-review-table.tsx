"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ParsedTransaction } from "@/lib/ofx-parser";
import type { Category } from "@/types/database";

interface ReviewRow extends ParsedTransaction {
  selected: boolean;
  categoryId: string;
  isDuplicate: boolean;
}

interface ImportResult {
  imported: number;
  ignored: number;
  duplicates: number;
}

interface ImportReviewTableProps {
  transactions: ParsedTransaction[];
  categories: Category[];
  accountId: string;
  userId: string;
  onImported: (result: ImportResult) => void;
  onBack: () => void;
}

export function ImportReviewTable({
  transactions,
  categories,
  accountId,
  userId,
  onImported,
  onBack,
}: ImportReviewTableProps) {
  const { addToast } = useToast();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const receitas = useMemo(
    () => categories.filter((c) => c.type === "receita"),
    [categories]
  );
  const despesas = useMemo(
    () => categories.filter((c) => c.type === "despesa"),
    [categories]
  );

  // Detect duplicates on mount
  useEffect(() => {
    async function checkDuplicates() {
      setLoading(true);
      const supabase = createClient();

      const dates = transactions.map((t) => t.date);
      const minDate = dates.reduce((a, b) => (a < b ? a : b));
      const maxDate = dates.reduce((a, b) => (a > b ? a : b));

      const { data: existing } = await supabase
        .from("transactions")
        .select("date, amount_cents, description")
        .eq("account_id", accountId)
        .gte("date", minDate)
        .lte("date", maxDate);

      const existingSet = new Set(
        (existing ?? []).map(
          (e) => `${e.date}|${e.amount_cents}|${e.description.toLowerCase()}`
        )
      );

      const reviewRows: ReviewRow[] = transactions.map((t) => {
        const key = `${t.date}|${t.amount_cents}|${t.description.toLowerCase()}`;
        const isDuplicate = existingSet.has(key);
        return {
          ...t,
          selected: !isDuplicate,
          categoryId: "",
          isDuplicate,
        };
      });

      setRows(reviewRows);
      setLoading(false);
    }

    checkDuplicates();
  }, [transactions, accountId]);

  function toggleRow(index: number) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  }

  function selectAll() {
    setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
  }

  function deselectAll() {
    setRows((prev) => prev.map((r) => ({ ...r, selected: false })));
  }

  function ignoreDuplicates() {
    setRows((prev) =>
      prev.map((r) => (r.isDuplicate ? { ...r, selected: false } : r))
    );
  }

  function setCategory(index: number, categoryId: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, categoryId } : r))
    );
  }

  const selectedRows = rows.filter((r) => r.selected);
  const selectedCount = selectedRows.length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const missingCategory = selectedRows.some((r) => !r.categoryId);

  async function handleImport() {
    if (missingCategory || selectedCount === 0) return;

    setSaving(true);
    const supabase = createClient();

    const toInsert = selectedRows.map((r) => ({
      user_id: userId,
      account_id: accountId,
      category_id: r.categoryId,
      type: r.type,
      amount_cents: r.amount_cents,
      description: r.description,
      date: r.date,
    }));

    const { error } = await supabase.from("transactions").insert(toInsert);

    if (error) {
      addToast("Erro ao importar transações.", "error");
      setSaving(false);
      return;
    }

    // Update account balance in one shot
    const delta = selectedRows.reduce((sum, r) => {
      return sum + (r.type === "receita" ? r.amount_cents : -r.amount_cents);
    }, 0);

    if (delta !== 0) {
      const { data: account } = await supabase
        .from("accounts")
        .select("balance_cents")
        .eq("id", accountId)
        .single();

      if (account) {
        await supabase
          .from("accounts")
          .update({ balance_cents: account.balance_cents + delta })
          .eq("id", accountId);
      }
    }

    setSaving(false);
    onImported({
      imported: selectedCount,
      ignored: rows.length - selectedCount,
      duplicates: duplicateCount,
    });
  }

  if (loading) {
    return <TableSkeleton rows={6} cols={5} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          2. Revise as transações
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={selectAll}>
            Selecionar todas
          </Button>
          <Button variant="ghost" onClick={deselectAll}>
            Desmarcar todas
          </Button>
          {duplicateCount > 0 && (
            <Button variant="ghost" onClick={ignoreDuplicates}>
              Ignorar duplicatas
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase w-10">
                <input
                  type="checkbox"
                  checked={selectedCount === rows.length}
                  onChange={() =>
                    selectedCount === rows.length ? deselectAll() : selectAll()
                  }
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Data
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Descrição
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                Valor
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase">
                Tipo
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase min-w-[200px]">
                Categoria
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row, i) => {
              const cats = row.type === "receita" ? receitas : despesas;
              return (
                <tr
                  key={i}
                  className={`${
                    row.selected ? "bg-white" : "bg-slate-50 opacity-60"
                  } hover:bg-slate-50`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRow(i)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-900 whitespace-nowrap">
                    {formatDate(row.date)}
                    {row.isDuplicate && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Duplicata?
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-900 max-w-[300px] truncate">
                    {row.description}
                  </td>
                  <td
                    className={`px-3 py-2 text-sm text-right whitespace-nowrap font-medium ${
                      row.type === "receita"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {row.type === "receita" ? "+" : "-"}
                    {formatCurrency(row.amount_cents)}
                  </td>
                  <td className="px-3 py-2 text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.type === "receita"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {row.type === "receita" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.categoryId}
                      onChange={(e) => setCategory(i, e.target.value)}
                      className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                        row.selected && !row.categoryId
                          ? "border-red-300 text-red-900"
                          : "border-slate-300 text-slate-900"
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3">
        <div className="text-sm text-slate-600">
          <span className="font-medium">{selectedCount}</span> de{" "}
          <span className="font-medium">{rows.length}</span> selecionadas
          {duplicateCount > 0 && (
            <>
              {" "}
              | <span className="text-yellow-600 font-medium">
                {duplicateCount} duplicata{duplicateCount !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {missingCategory && selectedCount > 0 && (
            <>
              {" "}
              |{" "}
              <span className="text-red-600">
                Selecione a categoria de todas as transações marcadas
              </span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            Voltar
          </Button>
          <Button
            onClick={handleImport}
            disabled={missingCategory || selectedCount === 0}
            loading={saving}
          >
            Importar selecionadas ({selectedCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
