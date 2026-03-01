"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DebtForm } from "./debt-form";
import { DebtSimulator } from "./debt-simulator";
import { useToast } from "@/contexts/toast-context";
import { formatCurrency } from "@/lib/utils";
import {
  DEBT_TYPE_LABELS,
  getDebtProgress,
  getDebtStatus,
  getMonthlyInterestCost,
  getTimeToPayoff,
} from "@/lib/debt-utils";
import { logAudit } from "@/lib/audit-log";
import type { Debt } from "@/types/database";

interface DebtListProps {
  debts: Debt[];
  onRefresh: () => void;
}

const statusColors = {
  green: "bg-emerald-100 text-emerald-700 dark:text-emerald-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:text-yellow-300",
  red: "bg-rose-100 text-rose-700 dark:text-rose-300",
  gray: "bg-tab-bg text-on-surface-secondary",
};

export function DebtList({ debts, onRefresh }: DebtListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null);
  const [simulateDebt, setSimulateDebt] = useState<Debt | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteDebt) return;
    setDeleting(true);

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("id", deleteDebt.id);

    if (error) {
      addToast("Erro ao excluir dívida.", "error");
      setDeleting(false);
      return;
    }

    logAudit(supabase, "debt.delete", "debt", deleteDebt.id, { name: deleteDebt.name });
    addToast("Dívida excluída com sucesso.");
    setDeleteDebt(null);
    setDeleting(false);
    onRefresh();
  }

  if (debts.length === 0) {
    return (
      <EmptyState message="Nenhuma dívida cadastrada. Registre suas dívidas para acompanhar pagamentos e simular economia." />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {debts.map((debt) => {
          const progress = getDebtProgress(debt);
          const status = getDebtStatus(debt);
          const interestCost = getMonthlyInterestCost(debt);
          const monthsLeft = getTimeToPayoff(debt);
          const typeLabel = DEBT_TYPE_LABELS[debt.type] ?? debt.type;

          return (
            <div
              key={debt.id}
              className={`rounded-xl border border-border shadow-sm overflow-hidden ${
                !debt.is_active ? "opacity-60" : ""
              }`}
            >
              {/* Header */}
              <div className="px-4 py-3 bg-surface-alt flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    className="w-5 h-5 text-on-surface-muted shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                    />
                  </svg>
                  <h3 className="text-sm font-semibold text-on-surface-heading truncate">
                    {debt.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-card text-on-surface-muted font-medium border border-border">
                    {typeLabel}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status.color]}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 bg-card space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-on-surface-muted mb-1">
                    <span>Pago</span>
                    <span>{formatCurrency(debt.original_amount_cents)}</span>
                  </div>
                  <div className="h-2.5 bg-tab-bg rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-on-surface-secondary">
                      {progress.toFixed(1)}% quitado
                    </span>
                    <span className="text-xs text-on-surface-muted">
                      Resta {formatCurrency(debt.remaining_amount_cents)}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-alt rounded-lg px-2.5 py-2">
                    <p className="text-on-surface-muted">Parcela/mês</p>
                    <p className="text-on-surface-secondary font-medium">
                      {debt.monthly_payment_cents > 0
                        ? formatCurrency(debt.monthly_payment_cents)
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-surface-alt rounded-lg px-2.5 py-2">
                    <p className="text-on-surface-muted">Juros/mês</p>
                    <p
                      className={`font-medium ${
                        interestCost > 0 ? "text-rose-600" : "text-on-surface-secondary"
                      }`}
                    >
                      {interestCost > 0 ? formatCurrency(interestCost) : "—"}
                    </p>
                  </div>
                </div>

                {/* Months to payoff */}
                {debt.remaining_amount_cents > 0 &&
                  debt.monthly_payment_cents > 0 && (
                    <div className="text-xs text-on-surface-muted">
                      Previsão:{" "}
                      <span className="font-medium text-on-surface-secondary">
                        {monthsLeft !== null
                          ? `${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"} para quitar`
                          : "Parcela não cobre juros"}
                      </span>
                    </div>
                  )}

                {/* Installments */}
                {debt.total_installments && (
                  <div className="text-xs text-on-surface-muted">
                    Parcelas:{" "}
                    <span className="font-medium text-on-surface-secondary">
                      {debt.paid_installments}/{debt.total_installments}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {debt.remaining_amount_cents > 0 &&
                    debt.monthly_payment_cents > 0 && (
                      <button
                        onClick={() => setSimulateDebt(debt)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors font-medium"
                      >
                        Simular
                      </button>
                    )}
                  <button
                    onClick={() => setEditDebt(debt)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-tab-bg text-on-surface-secondary hover:bg-skeleton transition-colors font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteDebt(debt)}
                    className="text-xs px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:bg-rose-950 transition-colors font-medium ml-auto"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editDebt}
        onClose={() => setEditDebt(null)}
        title="Editar dívida"
      >
        {editDebt && (
          <DebtForm
            debt={editDebt}
            onSuccess={() => {
              setEditDebt(null);
              onRefresh();
              addToast("Dívida atualizada com sucesso.");
            }}
            onCancel={() => setEditDebt(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteDebt}
        onClose={() => setDeleteDebt(null)}
        title="Excluir dívida"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-secondary">
            Tem certeza que deseja excluir a dívida{" "}
            <strong>&ldquo;{deleteDebt?.name}&rdquo;</strong>? Esta ação não
            pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteDebt(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* Simulator modal */}
      <Modal
        open={!!simulateDebt}
        onClose={() => setSimulateDebt(null)}
        title={`Simulador — ${simulateDebt?.name ?? ""}`}
      >
        {simulateDebt && <DebtSimulator debt={simulateDebt} />}
      </Modal>
    </>
  );
}
