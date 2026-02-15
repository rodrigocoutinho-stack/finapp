"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents, formatCurrency } from "@/lib/utils";
import type { Account, Category, Transaction } from "@/types/database";

const transactionTypeOptions = [
  { value: "despesa", label: "Despesa" },
  { value: "receita", label: "Receita" },
];

interface TransactionFormProps {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  defaultType?: "receita" | "despesa";
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionForm({
  transaction,
  accounts,
  categories,
  defaultType,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const supabase = createClient();
  const [type, setType] = useState<"receita" | "despesa">(
    transaction?.type ?? defaultType ?? "despesa"
  );
  const [amount, setAmount] = useState(
    transaction ? (transaction.amount_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [accountId, setAccountId] = useState(transaction?.account_id ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(
    transaction?.date ?? new Date().toISOString().split("T")[0]
  );
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

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    if (transaction) {
      // Revert the old transaction's effect on account balance atomically
      const oldDelta =
        transaction.type === "receita"
          ? -transaction.amount_cents
          : transaction.amount_cents;
      await supabase.rpc("adjust_account_balance", {
        p_account_id: transaction.account_id,
        p_delta: oldDelta,
      });

      // Update transaction
      const { error } = await supabase
        .from("transactions")
        .update({
          type,
          amount_cents: amountCents,
          account_id: accountId,
          category_id: categoryId,
          description,
          date,
        })
        .eq("id", transaction.id);

      if (error) {
        setError("Erro ao atualizar transação.");
        setLoading(false);
        return;
      }

      // Apply the new transaction's effect on account balance atomically
      const newDelta = type === "receita" ? amountCents : -amountCents;
      await supabase.rpc("adjust_account_balance", {
        p_account_id: accountId,
        p_delta: newDelta,
      });
    } else {
      // Create transaction
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type,
        amount_cents: amountCents,
        account_id: accountId,
        category_id: categoryId,
        description,
        date,
      });

      if (error) {
        setError("Erro ao criar transação.");
        setLoading(false);
        return;
      }

      // Update account balance atomically
      const delta = type === "receita" ? amountCents : -amountCents;
      await supabase.rpc("adjust_account_balance", {
        p_account_id: accountId,
        p_delta: delta,
      });
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
        placeholder="Ex: Supermercado"
        required
      />

      <Input
        id="date"
        label="Data"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {transaction ? "Salvar" : "Criar transação"}
        </Button>
      </div>
    </form>
  );
}
