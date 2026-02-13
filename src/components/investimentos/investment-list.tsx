"use client";

import { useCallback, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InvestmentForm } from "./investment-form";
import { EntryForm } from "./entry-form";
import { EntryList } from "./entry-list";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getInvestmentGroup,
  getGroupLabel,
  getProductLabel,
  getIndexerLabel,
  calculateInvestmentBalance,
  groupOrder,
} from "@/lib/investment-utils";
import type { Investment, InvestmentEntry, Account } from "@/types/database";

interface InvestmentListProps {
  investments: Investment[];
  accounts: Account[];
  onRefresh: () => void;
}

export function InvestmentList({ investments, accounts, onRefresh }: InvestmentListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Entries modal state
  const [entriesInvestment, setEntriesInvestment] = useState<Investment | null>(null);
  const [entries, setEntries] = useState<InvestmentEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);

  // Balances for all investments
  const [balances, setBalances] = useState<Record<string, number>>({});

  const today = new Date().toISOString().split("T")[0];

  const fetchAllEntries = useCallback(async () => {
    if (investments.length === 0) return;
    const { data } = await supabase
      .from("investment_entries")
      .select("*")
      .in("investment_id", investments.map((i) => i.id))
      .order("date", { ascending: false });

    if (data) {
      const bals: Record<string, number> = {};
      for (const inv of investments) {
        const invEntries = (data as InvestmentEntry[]).filter(
          (e) => e.investment_id === inv.id
        );
        bals[inv.id] = calculateInvestmentBalance(invEntries, today);
      }
      setBalances(bals);
    }
  }, [investments, supabase, today]);

  useEffect(() => {
    fetchAllEntries();
  }, [fetchAllEntries]);

  const fetchEntries = useCallback(
    async (investmentId: string) => {
      setEntriesLoading(true);
      const { data } = await supabase
        .from("investment_entries")
        .select("*")
        .eq("investment_id", investmentId)
        .order("date", { ascending: false });

      setEntries((data as InvestmentEntry[]) ?? []);
      setEntriesLoading(false);
    },
    [supabase]
  );

  function handleOpenEntries(inv: Investment) {
    setEntriesInvestment(inv);
    fetchEntries(inv.id);
  }

  async function handleDelete() {
    if (!deletingInvestment) return;
    setDeleteLoading(true);
    await supabase.from("investments").delete().eq("id", deletingInvestment.id);
    setDeleteLoading(false);
    setDeletingInvestment(null);
    onRefresh();
    addToast("Investimento excluído.");
  }

  function getAccountName(accountId: string): string {
    return accounts.find((a) => a.id === accountId)?.name ?? "-";
  }

  if (investments.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Nenhum investimento cadastrado. Clique em &quot;Novo investimento&quot; para começar.
      </p>
    );
  }

  // Group investments
  const grouped = new Map<string, Investment[]>();
  for (const inv of investments) {
    const group = getInvestmentGroup(inv.product, inv.indexer);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(inv);
  }

  return (
    <>
      <div className="space-y-6">
        {groupOrder
          .filter((g) => grouped.has(g))
          .map((group) => {
            const items = grouped.get(group)!;
            const groupTotal = items.reduce(
              (sum, inv) => sum + (balances[inv.id] ?? 0),
              0
            );

            return (
              <div key={group}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {getGroupLabel(group)}
                  </h3>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(groupTotal)}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {inv.name}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {getProductLabel(inv.product)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {getIndexerLabel(inv.indexer)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xl font-bold text-gray-900 mt-3">
                        {formatCurrency(balances[inv.id] ?? 0)}
                      </p>

                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <p>Conta: {getAccountName(inv.account_id)}</p>
                        {inv.rate && <p>Taxa: {inv.rate}</p>}
                        {inv.maturity_date && (
                          <p>Vencimento: {formatDate(inv.maturity_date)}</p>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3 flex-wrap">
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => handleOpenEntries(inv)}
                        >
                          Lançamentos
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs"
                          onClick={() => setEditingInvestment(inv)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingInvestment(inv)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editingInvestment}
        onClose={() => setEditingInvestment(null)}
        title="Editar investimento"
      >
        {editingInvestment && (
          <InvestmentForm
            investment={editingInvestment}
            accounts={accounts}
            onSuccess={() => {
              setEditingInvestment(null);
              onRefresh();
              addToast("Investimento atualizado.");
            }}
            onCancel={() => setEditingInvestment(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingInvestment}
        onClose={() => setDeletingInvestment(null)}
        title="Excluir investimento"
      >
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir{" "}
          <strong>{deletingInvestment?.name}</strong>? Todos os lançamentos
          associados serão excluídos. Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingInvestment(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>

      {/* Entries modal */}
      <Modal
        open={!!entriesInvestment}
        onClose={() => {
          setEntriesInvestment(null);
          setShowEntryForm(false);
          fetchAllEntries();
        }}
        title={`Lançamentos — ${entriesInvestment?.name ?? ""}`}
      >
        {entriesInvestment && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                className="text-xs"
                onClick={() => setShowEntryForm(!showEntryForm)}
              >
                {showEntryForm ? "Cancelar" : "Novo lançamento"}
              </Button>
            </div>

            {showEntryForm && (
              <EntryForm
                investmentId={entriesInvestment.id}
                onSuccess={() => {
                  setShowEntryForm(false);
                  fetchEntries(entriesInvestment.id);
                  addToast("Lançamento registrado.");
                }}
                onCancel={() => setShowEntryForm(false)}
              />
            )}

            {entriesLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
              </div>
            ) : (
              <EntryList
                entries={entries}
                onRefresh={() => fetchEntries(entriesInvestment.id)}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
