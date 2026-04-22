"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toCents, formatCurrency, buildGroupedAccountOptions, buildGroupedCategoryOptions } from "@/lib/utils";
import type { Account, Category, RecurringTransaction } from "@/types/database";

const transactionTypeOptions = [
  { value: "despesa", label: "Despesa" },
  { value: "receita", label: "Receita" },
  { value: "investimento", label: "Investimento" },
  { value: "transferencia", label: "Transferência" },
];

type TransactionType = "receita" | "despesa" | "transferencia" | "investimento";

const scheduleTypeOptions = [
  { value: "recurring", label: "Recorrente (sem prazo)" },
  { value: "pontual", label: "Pontual (mês único)" },
  { value: "period", label: "Recorrente com período" },
];

function getInitialScheduleType(recurring?: RecurringTransaction): string {
  if (!recurring) return "recurring";
  if (!recurring.start_month && !recurring.end_month) return "recurring";
  if (recurring.start_month === recurring.end_month) return "pontual";
  return "period";
}

interface RecurringFormProps {
  recurring?: RecurringTransaction;
  accounts: Account[];
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
  initialDescription?: string;
  initialAmountCents?: number;
  initialType?: TransactionType;
  initialDay?: number;
}

export function RecurringForm({
  recurring,
  accounts,
  categories,
  onSuccess,
  onCancel,
  initialDescription,
  initialAmountCents,
  initialType,
  initialDay,
}: RecurringFormProps) {
  const supabase = createClient();
  const [type, setType] = useState<TransactionType>(
    recurring?.type ?? initialType ?? "despesa"
  );
  const [amount, setAmount] = useState(
    recurring
      ? (recurring.amount_cents / 100).toFixed(2).replace(".", ",")
      : initialAmountCents
        ? (initialAmountCents / 100).toFixed(2).replace(".", ",")
        : ""
  );
  const [accountId, setAccountId] = useState(recurring?.account_id ?? "");
  const [destinationAccountId, setDestinationAccountId] = useState(
    recurring?.destination_account_id ?? ""
  );
  const [categoryId, setCategoryId] = useState(recurring?.category_id ?? "");
  const [description, setDescription] = useState(recurring?.description ?? initialDescription ?? "");
  const [dayOfMonth, setDayOfMonth] = useState(
    recurring?.day_of_month?.toString() ?? initialDay?.toString() ?? ""
  );
  const [isActive, setIsActive] = useState(recurring?.is_active ?? true);
  const [scheduleType, setScheduleType] = useState(
    getInitialScheduleType(recurring)
  );
  const [startMonth, setStartMonth] = useState(recurring?.start_month ?? "");
  const [endMonth, setEndMonth] = useState(recurring?.end_month ?? "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const isTransfer = type === "transferencia";
  const filteredCategories = categories.filter((c) => c.type === type);

  const accountLabelFn = (a: Account) => `${a.name} (${formatCurrency(a.balance_cents)})`;
  const { groupedOptions: accountGrouped } = buildGroupedAccountOptions(accounts, accountLabelFn);
  const accountOptions = accounts.map((a) => ({ value: a.id, label: accountLabelFn(a) }));

  const destAccounts = accounts.filter((a) => a.id !== accountId);
  const { groupedOptions: destGrouped } = buildGroupedAccountOptions(destAccounts, accountLabelFn);
  const destinationAccountOptions = destAccounts.map((a) => ({ value: a.id, label: accountLabelFn(a) }));

  const { options: categoryOptions, groupedOptions: categoryGrouped } = buildGroupedCategoryOptions(filteredCategories);

  function resolveMonthFields(): {
    start_month: string | null;
    end_month: string | null;
  } {
    if (scheduleType === "recurring") {
      return { start_month: null, end_month: null };
    }
    if (scheduleType === "pontual") {
      return { start_month: startMonth || null, end_month: startMonth || null };
    }
    return {
      start_month: startMonth || null,
      end_month: endMonth || null,
    };
  }

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

    const day = parseInt(dayOfMonth, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      newErrors.dayOfMonth = "O dia deve ser entre 1 e 31.";
    }

    if (scheduleType === "pontual" && !startMonth) {
      newErrors.startMonth = "Selecione o mês da transação pontual.";
    }

    if (scheduleType === "period" && !startMonth) {
      newErrors.startMonth = "Selecione o mês de início.";
    }

    if (scheduleType === "period" && endMonth && endMonth < startMonth) {
      newErrors.endMonth = "O mês de término deve ser igual ou posterior ao mês de início.";
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

    const monthFields = resolveMonthFields();

    if (recurring) {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({
          type,
          amount_cents: amountCents,
          account_id: accountId,
          category_id: isTransfer ? null : categoryId,
          destination_account_id: isTransfer ? destinationAccountId : null,
          description,
          day_of_month: day,
          is_active: isActive,
          ...monthFields,
        })
        .eq("id", recurring.id);

      if (error) {
        setServerError("Erro ao atualizar transação.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.from("recurring_transactions").insert({
        user_id: user.id,
        type,
        amount_cents: amountCents,
        account_id: accountId,
        category_id: isTransfer ? null : categoryId,
        destination_account_id: isTransfer ? destinationAccountId : null,
        description,
        day_of_month: day,
        is_active: isActive,
        ...monthFields,
      });

      if (error) {
        setServerError("Erro ao criar transação.");
        setLoading(false);
        return;
      }
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
          if (e.target.value === destinationAccountId) {
            setDestinationAccountId("");
          }
        }}
        options={accountGrouped ? undefined : accountOptions}
        groupedOptions={accountGrouped}
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
          options={destGrouped ? undefined : destinationAccountOptions}
          groupedOptions={destGrouped}
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
          groupedOptions={categoryGrouped}
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
        placeholder={isTransfer ? "Ex: Pagamento fatura cartão" : "Ex: Salário, Aluguel, Viagem"}
        maxLength={500}
        required
      />

      <Select
        id="scheduleType"
        label="Frequência"
        value={scheduleType}
        onChange={(e) => setScheduleType(e.target.value)}
        options={scheduleTypeOptions}
        required
      />

      {scheduleType === "pontual" && (
        <Input
          id="startMonth"
          label="Mês"
          type="month"
          value={startMonth}
          onChange={(e) => { setStartMonth(e.target.value); clearFieldError("startMonth"); }}
          error={errors.startMonth}
          required
        />
      )}

      {scheduleType === "period" && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="startMonth"
            label="Mês de início"
            type="month"
            value={startMonth}
            onChange={(e) => { setStartMonth(e.target.value); clearFieldError("startMonth"); }}
            error={errors.startMonth}
            required
          />
          <Input
            id="endMonth"
            label="Mês de término (opcional)"
            type="month"
            value={endMonth}
            onChange={(e) => { setEndMonth(e.target.value); clearFieldError("endMonth"); }}
            error={errors.endMonth}
          />
        </div>
      )}

      <Input
        id="dayOfMonth"
        label="Dia do mês (1-31)"
        type="number"
        min={1}
        max={31}
        value={dayOfMonth}
        onChange={(e) => { setDayOfMonth(e.target.value); clearFieldError("dayOfMonth"); }}
        placeholder="Ex: 5"
        error={errors.dayOfMonth}
        required
      />

      <Checkbox
        id="isActive"
        label="Ativo"
        checked={isActive}
        onChange={(e) => setIsActive(e.target.checked)}
      />

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {recurring ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
