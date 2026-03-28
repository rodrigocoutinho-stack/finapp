"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toCents } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import type { Account } from "@/types/database";

const accountTypeOptions = [
  { value: "banco", label: "Banco" },
  { value: "cartao", label: "Cartão" },
  { value: "carteira", label: "Carteira" },
];

interface AccountFormProps {
  account?: Account;
  existingGroups?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, existingGroups = [], onSuccess, onCancel }: AccountFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "banco");
  const [accountGroup, setAccountGroup] = useState(account?.account_group ?? "");
  const [initialBalance, setInitialBalance] = useState("");
  const [isEmergencyReserve, setIsEmergencyReserve] = useState(account?.is_emergency_reserve ?? false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setServerError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    if (account) {
      const { error } = await supabase
        .from("accounts")
        .update({ name, type, is_emergency_reserve: isEmergencyReserve, account_group: accountGroup.trim() || null })
        .eq("id", account.id);

      if (error) {
        setServerError("Erro ao atualizar conta.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "account.update", "account", account.id, { name, type, account_group: accountGroup.trim() || null });
    } else {
      const initialCents = toCents(initialBalance);
      const { error } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          name,
          type,
          balance_cents: initialCents,
          initial_balance_cents: initialCents,
          is_emergency_reserve: isEmergencyReserve,
          account_group: accountGroup.trim() || null,
        });

      if (error) {
        setServerError("Erro ao criar conta.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "account.create", "account", null, { name, type, account_group: accountGroup.trim() || null });
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {serverError}
        </div>
      )}

      <Input
        id="name"
        label="Nome da conta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Nubank, Carteira"
        maxLength={100}
        required
      />

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as Account["type"])}
        options={accountTypeOptions}
        required
      />

      <div>
        <label htmlFor="accountGroup" className="block text-sm font-medium text-on-surface-secondary mb-1">
          Grupo
          <span className="text-on-surface-muted ml-1 font-normal">(opcional)</span>
        </label>
        <input
          id="accountGroup"
          list="account-group-suggestions"
          value={accountGroup}
          onChange={(e) => setAccountGroup(e.target.value)}
          placeholder="Ex: PJ, PF, Investimentos"
          maxLength={50}
          className="block w-full rounded-lg border border-input-border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-input-bg text-on-surface placeholder-on-surface-muted"
        />
        {existingGroups.length > 0 && (
          <datalist id="account-group-suggestions">
            {existingGroups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        )}
      </div>

      {!account && (
        <Input
          id="initialBalance"
          label="Saldo inicial (R$)"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          placeholder="0,00"
          optional
        />
      )}

      <Checkbox
        id="isEmergencyReserve"
        label="Conta de reserva de emergência"
        checked={isEmergencyReserve}
        onChange={(e) => setIsEmergencyReserve(e.target.checked)}
      />

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {account ? "Salvar" : "Criar conta"}
        </Button>
      </div>
    </form>
  );
}
