"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalForm } from "./goal-form";
import { useToast } from "@/contexts/toast-context";
import { formatCurrency, toCents } from "@/lib/utils";
import {
  GOAL_ICONS,
  GOAL_COLORS,
  HORIZON_LABELS,
  getGoalProgress,
  getGoalProgressPercent,
  getGoalStatus,
  getRequiredMonthlyContribution,
  getMonthsRemaining,
} from "@/lib/goal-utils";
import { logAudit } from "@/lib/audit-log";
import type { Goal, Account } from "@/types/database";

interface GoalListProps {
  goals: Goal[];
  accounts: Account[];
  onRefresh: () => void;
}

const statusColors = {
  green: "bg-emerald-100 text-emerald-700 dark:text-emerald-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:text-yellow-300",
  red: "bg-rose-100 text-rose-700 dark:text-rose-300",
  gray: "bg-tab-bg text-on-surface-secondary",
};

export function GoalList({ goals, accounts, onRefresh }: GoalListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [updateGoal, setUpdateGoal] = useState<Goal | null>(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function handleDelete() {
    if (!deleteGoal) return;
    setDeleting(true);

    const { error } = await supabase.from("goals").delete().eq("id", deleteGoal.id);

    if (error) {
      addToast("Erro ao excluir meta.", "error");
      setDeleting(false);
      return;
    }

    logAudit(supabase, "goal.delete", "goal", deleteGoal.id, { name: deleteGoal.name });
    addToast("Meta excluída com sucesso.");
    setDeleteGoal(null);
    setDeleting(false);
    onRefresh();
  }

  async function handleUpdateBalance() {
    if (!updateGoal) return;
    setUpdating(true);

    const cents = toCents(updateAmount);

    if (isNaN(cents) || cents < 0) {
      addToast("Valor inválido.", "error");
      setUpdating(false);
      return;
    }

    const { error } = await supabase
      .from("goals")
      .update({ current_cents: cents })
      .eq("id", updateGoal.id);

    if (error) {
      addToast("Erro ao atualizar saldo.", "error");
      setUpdating(false);
      return;
    }

    logAudit(supabase, "goal.update_balance", "goal", updateGoal.id, { current_cents: cents });
    addToast("Saldo atualizado com sucesso.");
    setUpdateGoal(null);
    setUpdateAmount("");
    setUpdating(false);
    onRefresh();
  }

  if (goals.length === 0) {
    return (
      <EmptyState
        message="Nenhuma meta cadastrada. Crie sua primeira meta financeira para acompanhar seu progresso."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const colorKey = goal.color in GOAL_COLORS ? goal.color : "emerald";
          const colorStyles = GOAL_COLORS[colorKey];
          const iconEmoji = GOAL_ICONS[goal.icon] ?? GOAL_ICONS.default;
          const progress = getGoalProgressPercent(goal, accounts);
          const currentCents = getGoalProgress(goal, accounts);
          const status = getGoalStatus(goal, accounts);
          const monthlyNeeded = getRequiredMonthlyContribution(goal, accounts);
          const monthsLeft = getMonthsRemaining(goal);
          const isLinked = !!goal.account_id;
          const linkedAccount = isLinked
            ? accounts.find((a) => a.id === goal.account_id)
            : null;

          return (
            <div
              key={goal.id}
              className={`rounded-xl border border-border shadow-sm overflow-hidden ${
                !goal.is_active ? "opacity-60" : ""
              }`}
            >
              {/* Header */}
              <div className={`px-4 py-3 ${colorStyles.bg} flex items-center justify-between`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{iconEmoji}</span>
                  <h3 className={`text-sm font-semibold truncate ${colorStyles.text}`}>
                    {goal.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-on-surface-secondary font-medium">
                    {HORIZON_LABELS[goal.horizon] ?? goal.horizon}
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
                    <span>{formatCurrency(currentCents)}</span>
                    <span>{formatCurrency(goal.target_cents)}</span>
                  </div>
                  <div className="h-2.5 bg-tab-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorStyles.bar}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-on-surface-secondary">
                      {progress.toFixed(1)}%
                    </span>
                    {isLinked && linkedAccount && (
                      <span className="text-xs text-on-surface-muted">
                        via {linkedAccount.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-surface-alt rounded-lg px-2.5 py-2">
                    <p className="text-on-surface-muted">Prazo</p>
                    <p className="text-on-surface-secondary font-medium">
                      {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="bg-surface-alt rounded-lg px-2.5 py-2">
                    <p className="text-on-surface-muted">
                      {monthsLeft > 0 ? "Faltam" : "Vencido"}
                    </p>
                    <p className="text-on-surface-secondary font-medium">
                      {monthsLeft > 0
                        ? `${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Monthly contribution needed */}
                {progress < 100 && monthsLeft > 0 && (
                  <div className="text-xs text-on-surface-muted">
                    Necessário:{" "}
                    <span className="font-medium text-on-surface-secondary">
                      {formatCurrency(monthlyNeeded)}/mês
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {!isLinked && progress < 100 && (
                    <button
                      onClick={() => {
                        setUpdateGoal(goal);
                        setUpdateAmount(
                          (goal.current_cents / 100).toFixed(2).replace(".", ",")
                        );
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors font-medium"
                    >
                      Atualizar saldo
                    </button>
                  )}
                  <button
                    onClick={() => setEditGoal(goal)}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-tab-bg text-on-surface-secondary hover:bg-skeleton transition-colors font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteGoal(goal)}
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
        open={!!editGoal}
        onClose={() => setEditGoal(null)}
        title="Editar meta"
      >
        {editGoal && (
          <GoalForm
            goal={editGoal}
            accounts={accounts}
            onSuccess={() => {
              setEditGoal(null);
              onRefresh();
              addToast("Meta atualizada com sucesso.");
            }}
            onCancel={() => setEditGoal(null)}
          />
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteGoal}
        onClose={() => setDeleteGoal(null)}
        title="Excluir meta"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-secondary">
            Tem certeza que deseja excluir a meta{" "}
            <strong>&ldquo;{deleteGoal?.name}&rdquo;</strong>? Esta ação não pode
            ser desfeita.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteGoal(null)}
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

      {/* Update balance modal */}
      <Modal
        open={!!updateGoal}
        onClose={() => {
          setUpdateGoal(null);
          setUpdateAmount("");
        }}
        title="Atualizar saldo da meta"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-secondary">
            Informe o valor atual acumulado para{" "}
            <strong>&ldquo;{updateGoal?.name}&rdquo;</strong>.
          </p>
          <Input
            id="updateAmount"
            label="Valor atual (R$)"
            value={updateAmount}
            onChange={(e) => setUpdateAmount(e.target.value)}
            placeholder="0,00"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setUpdateGoal(null);
                setUpdateAmount("");
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateBalance} loading={updating}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
