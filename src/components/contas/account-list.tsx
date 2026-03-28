"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountForm } from "./account-form";
import { GroupReportModal } from "./group-report-modal";
import { formatCurrency, groupAccountsByGroup } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import type { Account } from "@/types/database";

const typeLabels: Record<Account["type"], string> = {
  banco: "Banco",
  cartao: "Cartão",
  carteira: "Carteira",
};

interface AccountListProps {
  accounts: Account[];
  existingGroups: string[];
  onRefresh: () => void;
}

export function AccountList({ accounts, existingGroups, onRefresh }: AccountListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reportGroup, setReportGroup] = useState<{ name: string; ids: string[] } | null>(null);

  async function handleDelete() {
    if (!deletingAccount) return;
    setDeleteLoading(true);

    const { error } = await supabase.from("accounts").delete().eq("id", deletingAccount.id);

    setDeleteLoading(false);
    setDeletingAccount(null);

    if (error) {
      addToast("Erro ao excluir conta. Verifique se não há transações vinculadas.", "error");
    } else {
      logAudit(supabase, "account.delete", "account", deletingAccount.id, { name: deletingAccount.name });
      onRefresh();
      addToast("Conta excluída.");
    }
  }

  const grouped = useMemo(() => groupAccountsByGroup(accounts), [accounts]);
  const showGroupHeaders = grouped.length > 1;

  if (accounts.length === 0) {
    return <EmptyState message="Nenhuma conta cadastrada. Clique em &quot;Nova conta&quot; para começar." />;
  }

  function renderAccountCard(account: Account) {
    return (
      <div
        key={account.id}
        className="bg-card rounded-xl border border-border p-6 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-on-surface">{account.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-on-surface-muted bg-tab-bg px-2 py-0.5 rounded-full">
                {typeLabels[account.type]}
              </span>
              {account.is_emergency_reserve && (
                <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Reserva
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-2xl font-bold text-on-surface mt-4">
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
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 dark:bg-red-950"
            onClick={() => setDeletingAccount(account)}
          >
            Excluir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {grouped.map(([groupName, groupAccounts]) => {
          const subtotal = groupAccounts.reduce((sum, a) => sum + a.balance_cents, 0);
          return (
            <section key={groupName}>
              {showGroupHeaders && (
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-semibold text-on-surface">{groupName}</h2>
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm text-on-surface-muted">{formatCurrency(subtotal)}</span>
                    <Button
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        setReportGroup({
                          name: groupName,
                          ids: groupAccounts.map((a) => a.id),
                        })
                      }
                    >
                      Relatório
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {groupAccounts.map(renderAccountCard)}
              </div>
            </section>
          );
        })}
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
            existingGroups={existingGroups}
            onSuccess={() => {
              setEditingAccount(null);
              onRefresh();
              addToast("Conta atualizada.");
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
        <p className="text-on-surface-secondary mb-6">
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

      {/* Group report modal */}
      <GroupReportModal
        open={!!reportGroup}
        onClose={() => setReportGroup(null)}
        groupName={reportGroup?.name ?? ""}
        accountIds={reportGroup?.ids ?? []}
      />
    </>
  );
}
