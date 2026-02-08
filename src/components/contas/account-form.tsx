"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
        .update({ name, type })
        .eq("id", account.id);

      if (error) {
        setError("Erro ao atualizar conta.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("accounts")
        .insert({ user_id: user.id, name, type });

      if (error) {
        setError("Erro ao criar conta.");
        setLoading(false);
        return;
      }
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
        required
      />

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as Account["type"])}
        options={accountTypeOptions}
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
