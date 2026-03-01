"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState(account?.type ?? "banco");
  const [initialBalance, setInitialBalance] = useState("");
  const [isEmergencyReserve, setIsEmergencyReserve] = useState(account?.is_emergency_reserve ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    if (account) {
      const { error } = await supabase
        .from("accounts")
        .update({ name, type, is_emergency_reserve: isEmergencyReserve })
        .eq("id", account.id);

      if (error) {
        setError("Erro ao atualizar conta.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "account.update", "account", account.id, { name, type });
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
        });

      if (error) {
        setError("Erro ao criar conta.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "account.create", "account", null, { name, type });
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
      />

      {!account && (
        <Input
          id="initialBalance"
          label="Saldo inicial (R$)"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          placeholder="0,00"
        />
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isEmergencyReserve}
          onChange={(e) => setIsEmergencyReserve(e.target.checked)}
          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-sm text-slate-700">Conta de reserva de emergência</span>
      </label>

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
