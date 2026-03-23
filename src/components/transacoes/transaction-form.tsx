"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents, formatCurrency } from "@/lib/utils";
import { logAudit } from "@/lib/audit-log";
import type { Account, Category, Transaction } from "@/types/database";

const transactionTypeOptions = [
  { value: "despesa", label: "Despesa" },
  { value: "receita", label: "Receita" },
  { value: "transferencia", label: "Transferência" },
];

type TransactionType = "receita" | "despesa" | "transferencia";

interface TransactionFormProps {
  transaction?: Transaction;
  accounts: Account[];
  categories: Category[];
  defaultType?: TransactionType;
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
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? defaultType ?? "despesa"
  );
  const [amount, setAmount] = useState(
    transaction ? (transaction.amount_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [accountId, setAccountId] = useState(transaction?.account_id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(
    transaction?.destination_account_id ?? ""
  );
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [date, setDate] = useState(
    transaction?.date ?? new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const isTransfer = type === "transferencia";
  const filteredCategories = categories.filter((c) => c.type === type);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.name} (${formatCurrency(a.balance_cents)})`,
  }));

  const destinationAccountOptions = accounts
    .filter((a) => a.id !== accountId)
    .map((a) => ({
      value: a.id,
      label: `${a.name} (${formatCurrency(a.balance_cents)})`,
    }));

  const categoryOptions = filteredCategories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  function clearFieldError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const newErrors: Record<string, string> = {};

    const dateObj = new Date(date);
    const minDate = new Date("2000-01-01");
    const maxDate = new Date(new Date().getFullYear() + 5, 11, 31);
    if (isNaN(dateObj.getTime()) || dateObj < minDate || dateObj > maxDate) {
      newErrors.date = "Data inválida. Informe uma data entre 2000 e daqui a 5 anos.";
    }

    const amountCents = toCents(amount);
    if (amountCents <= 0) {
      newErrors.amount = "O valor deve ser maior que zero.";
    }

    if (!accountId) {
      newErrors.account = "Selecione uma conta.";
    }

    if (isTransfer) {
      if (!destinationAccountId) {
        newErrors.destinationAccount = "Selecione a conta de destino.";
      }
      if (destinationAccountId && destinationAccountId === accountId) {
        newErrors.destinationAccount = "A conta de destino deve ser diferente da conta de origem.";
      }
    } else {
      if (!categoryId) {
        newErrors.category = "Selecione uma categoria.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setServerError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    if (transaction) {
      // === EDIT ===
      // Revert the old transaction's effect on account balance
      if (transaction.type === "transferencia") {
        // Revert transfer: +amount on old origin, -amount on old destination
        const [revertOrigin, revertDest] = await Promise.all([
          supabase.rpc("adjust_account_balance", {
            p_account_id: transaction.account_id,
            p_delta: transaction.amount_cents,
          }),
          supabase.rpc("adjust_account_balance", {
            p_account_id: transaction.destination_account_id!,
            p_delta: -transaction.amount_cents,
          }),
        ]);
        if (revertOrigin.error || revertDest.error) {
          setServerError("Erro ao reverter saldo das contas.");
          setLoading(false);
          return;
        }
      } else {
        const oldDelta =
          transaction.type === "receita"
            ? -transaction.amount_cents
            : transaction.amount_cents;
        const { error: revertError } = await supabase.rpc("adjust_account_balance", {
          p_account_id: transaction.account_id,
          p_delta: oldDelta,
        });
        if (revertError) {
          setServerError("Erro ao ajustar saldo da conta.");
          setLoading(false);
          return;
        }
      }

      // Update transaction
      const { error } = await supabase
        .from("transactions")
        .update({
          type,
          amount_cents: amountCents,
          account_id: accountId,
          category_id: isTransfer ? null : categoryId,
          destination_account_id: isTransfer ? destinationAccountId : null,
          description,
          date,
        })
        .eq("id", transaction.id);

      if (error) {
        setServerError("Erro ao atualizar transação.");
        setLoading(false);
        return;
      }

      // Apply the new transaction's effect on account balance
      if (isTransfer) {
        const [applyOrigin, applyDest] = await Promise.all([
          supabase.rpc("adjust_account_balance", {
            p_account_id: accountId,
            p_delta: -amountCents,
          }),
          supabase.rpc("adjust_account_balance", {
            p_account_id: destinationAccountId,
            p_delta: amountCents,
          }),
        ]);
        if (applyOrigin.error || applyDest.error) {
          setServerError("Transação atualizada, mas houve erro ao ajustar os saldos.");
          setLoading(false);
          return;
        }
      } else {
        const newDelta = type === "receita" ? amountCents : -amountCents;
        const { error: applyError } = await supabase.rpc("adjust_account_balance", {
          p_account_id: accountId,
          p_delta: newDelta,
        });
        if (applyError) {
          setServerError("Transação atualizada, mas houve erro ao ajustar o saldo.");
          setLoading(false);
          return;
        }
      }
      logAudit(supabase, "transaction.update", "transaction", transaction.id, { type, amount_cents: amountCents, description });
    } else {
      // === CREATE ===
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type,
        amount_cents: amountCents,
        account_id: accountId,
        category_id: isTransfer ? null : categoryId,
        destination_account_id: isTransfer ? destinationAccountId : null,
        description,
        date,
      });

      if (error) {
        setServerError("Erro ao criar transação.");
        setLoading(false);
        return;
      }

      // Update account balance(s)
      if (isTransfer) {
        const [originRes, destRes] = await Promise.all([
          supabase.rpc("adjust_account_balance", {
            p_account_id: accountId,
            p_delta: -amountCents,
          }),
          supabase.rpc("adjust_account_balance", {
            p_account_id: destinationAccountId,
            p_delta: amountCents,
          }),
        ]);
        if (originRes.error || destRes.error) {
          setServerError("Transação criada, mas houve erro ao ajustar os saldos.");
          setLoading(false);
          return;
        }
      } else {
        const delta = type === "receita" ? amountCents : -amountCents;
        const { error: balanceError } = await supabase.rpc("adjust_account_balance", {
          p_account_id: accountId,
          p_delta: delta,
        });
        if (balanceError) {
          setServerError("Transação criada, mas houve erro ao ajustar o saldo.");
          setLoading(false);
          return;
        }
      }
      logAudit(supabase, "transaction.create", "transaction", null, { type, amount_cents: amountCents, description });
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

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => {
          const newType = e.target.value as TransactionType;
          setType(newType);
          if (newType === "transferencia") {
            setCategoryId("");
          } else {
            setCategoryId("");
            setDestinationAccountId("");
          }
        }}
        options={transactionTypeOptions}
        required
      />

      <Input
        id="amount"
        label="Valor (R$)"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); clearFieldError("amount"); }}
        placeholder="0,00"
        error={errors.amount}
        required
      />

      <Select
        id="account"
        label={isTransfer ? "Conta de origem" : "Conta"}
        value={accountId}
        onChange={(e) => {
          setAccountId(e.target.value);
          clearFieldError("account");
          // Reset destination if it became same as origin
          if (e.target.value === destinationAccountId) {
            setDestinationAccountId("");
          }
        }}
        options={accountOptions}
        placeholder="Selecione a conta"
        error={errors.account}
        required
      />

      {isTransfer ? (
        <Select
          id="destinationAccount"
          label="Conta de destino"
          value={destinationAccountId}
          onChange={(e) => { setDestinationAccountId(e.target.value); clearFieldError("destinationAccount"); }}
          options={destinationAccountOptions}
          placeholder="Selecione a conta de destino"
          error={errors.destinationAccount}
          required
        />
      ) : (
        <Select
          id="category"
          label="Categoria"
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); clearFieldError("category"); }}
          options={categoryOptions}
          placeholder="Selecione a categoria"
          error={errors.category}
          required
        />
      )}

      <Input
        id="description"
        label="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={isTransfer ? "Ex: Pagamento fatura cartão" : "Ex: Supermercado"}
        maxLength={500}
        required
      />

      <Input
        id="date"
        label="Data"
        type="date"
        value={date}
        onChange={(e) => { setDate(e.target.value); clearFieldError("date"); }}
        error={errors.date}
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
