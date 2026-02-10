"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents, formatCurrency } from "@/lib/utils";
import type { Account, Category, RecurringTransaction } from "@/types/database";

const transactionTypeOptions = [
  { value: "despesa", label: "Despesa" },
  { value: "receita", label: "Receita" },
];

interface RecurringFormProps {
  recurring?: RecurringTransaction;
  accounts: Account[];
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecurringForm({
  recurring,
  accounts,
  categories,
  onSuccess,
  onCancel,
}: RecurringFormProps) {
  const supabase = createClient();
  const [type, setType] = useState<"receita" | "despesa">(
    recurring?.type ?? "despesa"
  );
  const [amount, setAmount] = useState(
    recurring ? (recurring.amount_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [accountId, setAccountId] = useState(recurring?.account_id ?? "");
  const [categoryId, setCategoryId] = useState(recurring?.category_id ?? "");
  const [description, setDescription] = useState(recurring?.description ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(
    recurring?.day_of_month?.toString() ?? ""
  );
  const [isActive, setIsActive] = useState(recurring?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = categories.filter((c) => c.type === type);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${formatCurrency(a.balance_cents)})`,
  }));

  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      setError("O valor deve ser maior que zero.");
      return;
    }

    if (!accountId) {
      setError("Selecione uma conta.");
      return;
    }

    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }

    const day = parseInt(dayOfMonth, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setError("O dia deve ser entre 1 e 31.");
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

    if (recurring) {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({
          type,
          amount_cents: amountCents,
          account_id: accountId,
          category_id: categoryId,
          description,
          day_of_month: day,
          is_active: isActive,
        })
        .eq("id", recurring.id);

      if (error) {
        setError("Erro ao atualizar transação recorrente.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("recurring_transactions").insert({
        user_id: user.id,
        type,
        amount_cents: amountCents,
        account_id: accountId,
        category_id: categoryId,
        description,
        day_of_month: day,
        is_active: isActive,
      });

      if (error) {
        setError("Erro ao criar transação recorrente.");
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

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => {
          setType(e.target.value as "receita" | "despesa");
          setCategoryId("");
        }}
        options={transactionTypeOptions}
      />

      <Input
        id="amount"
        label="Valor (R$)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0,00"
        required
      />

      <Select
        id="account"
        label="Conta"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
        options={accountOptions}
        placeholder="Selecione a conta"
      />

      <Select
        id="category"
        label="Categoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
        placeholder="Selecione a categoria"
      />

      <Input
        id="description"
        label="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex: Salário, Aluguel"
        required
      />

      <Input
        id="dayOfMonth"
        label="Dia do mês (1-31)"
        type="number"
        min={1}
        max={31}
        value={dayOfMonth}
        onChange={(e) => setDayOfMonth(e.target.value)}
        placeholder="Ex: 5"
        required
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Ativo
        </label>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {recurring ? "Salvar" : "Criar recorrente"}
        </Button>
      </div>
    </form>
  );
}
