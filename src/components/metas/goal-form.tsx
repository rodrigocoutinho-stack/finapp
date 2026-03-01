"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents, formatCurrency } from "@/lib/utils";
import { GOAL_ICONS, GOAL_COLORS, HORIZON_LABELS } from "@/lib/goal-utils";
import { logAudit } from "@/lib/audit-log";
import type { Goal, Account } from "@/types/database";

const horizonOptions = Object.entries(HORIZON_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const priorityOptions = [
  { value: "1", label: "1 — Muito alta" },
  { value: "2", label: "2 — Alta" },
  { value: "3", label: "3 — Média" },
  { value: "4", label: "4 — Baixa" },
  { value: "5", label: "5 — Muito baixa" },
];

interface GoalFormProps {
  goal?: Goal;
  accounts: Account[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function GoalForm({ goal, accounts, onSuccess, onCancel }: GoalFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    goal ? (goal.target_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [currentAmount, setCurrentAmount] = useState(
    goal ? (goal.current_cents / 100).toFixed(2).replace(".", ",") : "0,00"
  );
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [horizon, setHorizon] = useState(goal?.horizon ?? "short");
  const [priority, setPriority] = useState((goal?.priority ?? 3).toString());
  const [accountId, setAccountId] = useState(goal?.account_id ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "default");
  const [color, setColor] = useState(goal?.color ?? "emerald");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accountOptions = [
    { value: "", label: "Sem conta vinculada (manual)" },
    ...accounts.map((a) => ({
      value: a.id,
      label: `${a.name} (${formatCurrency(a.balance_cents)})`,
    })),
  ];

  const showManualAmount = !accountId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Informe o nome da meta.");
      return;
    }

    const targetCents = toCents(targetAmount);
    if (targetCents <= 0) {
      setError("O valor alvo deve ser maior que zero.");
      return;
    }

    if (targetCents > 100_000_000_000) {
      setError("O valor alvo excede o limite máximo.");
      return;
    }

    if (!deadline) {
      setError("Informe o prazo da meta.");
      return;
    }

    const deadlineDate = new Date(deadline);
    const minDate = new Date("2000-01-01");
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 50);
    if (deadlineDate < minDate || deadlineDate > maxDate) {
      setError("Data do prazo fora do intervalo válido.");
      return;
    }

    const currentCents = showManualAmount ? toCents(currentAmount) : 0;
    if (showManualAmount && currentCents < 0) {
      setError("O valor atual não pode ser negativo.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      target_cents: targetCents,
      current_cents: showManualAmount ? currentCents : (goal?.current_cents ?? 0),
      deadline,
      horizon: horizon as "short" | "medium" | "long",
      priority: parseInt(priority, 10),
      account_id: accountId || null,
      icon,
      color,
    };

    if (goal) {
      const { error: dbError } = await supabase
        .from("goals")
        .update(payload)
        .eq("id", goal.id);

      if (dbError) {
        setError("Erro ao atualizar meta.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "goal.update", "goal", goal.id, { name: payload.name });
    } else {
      const { error: dbError } = await supabase.from("goals").insert({
        user_id: user.id,
        ...payload,
      });

      if (dbError) {
        setError("Erro ao criar meta.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "goal.create", "goal", null, { name: payload.name });
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        id="name"
        label="Nome da meta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Viagem para Europa"
        maxLength={200}
        required
      />

      <Input
        id="targetAmount"
        label="Valor alvo (R$)"
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
        placeholder="0,00"
        required
      />

      <Input
        id="deadline"
        label="Prazo"
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="horizon"
          label="Horizonte"
          value={horizon}
          onChange={(e) => setHorizon(e.target.value as "short" | "medium" | "long")}
          options={horizonOptions}
          required
        />

        <Select
          id="priority"
          label="Prioridade"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          options={priorityOptions}
          required
        />
      </div>

      <Select
        id="accountId"
        label="Conta vinculada"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accountOptions}
      />

      {showManualAmount && (
        <Input
          id="currentAmount"
          label="Valor atual (R$)"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          placeholder="0,00"
        />
      )}

      {/* Icon picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GOAL_ICONS).map(([key, emoji]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                icon === key
                  ? "ring-2 ring-emerald-500 bg-emerald-50 scale-110"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
              title={key}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Cor</label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GOAL_COLORS).map(([key, styles]) => (
            <button
              key={key}
              type="button"
              onClick={() => setColor(key)}
              className={`w-8 h-8 rounded-full ${styles.bar} transition-all ${
                color === key
                  ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                  : "opacity-70 hover:opacity-100"
              }`}
              title={key}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {goal ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
