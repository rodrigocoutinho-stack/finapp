"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents } from "@/lib/utils";
import { DEBT_TYPE_LABELS } from "@/lib/debt-utils";
import { logAudit } from "@/lib/audit-log";
import type { Debt } from "@/types/database";

const typeOptions = Object.entries(DEBT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface DebtFormProps {
  debt?: Debt;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DebtForm({ debt, onSuccess, onCancel }: DebtFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(debt?.name ?? "");
  const [type, setType] = useState(debt?.type ?? "emprestimo");
  const [originalAmount, setOriginalAmount] = useState(
    debt ? (debt.original_amount_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [remainingAmount, setRemainingAmount] = useState(
    debt ? (debt.remaining_amount_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [monthlyPayment, setMonthlyPayment] = useState(
    debt && debt.monthly_payment_cents > 0
      ? (debt.monthly_payment_cents / 100).toFixed(2).replace(".", ",")
      : ""
  );
  const [interestRate, setInterestRate] = useState(
    debt ? String(Number(debt.interest_rate_monthly)) : ""
  );
  const [startDate, setStartDate] = useState(debt?.start_date ?? "");
  const [dueDate, setDueDate] = useState(debt?.due_date ?? "");
  const [totalInstallments, setTotalInstallments] = useState(
    debt?.total_installments ? String(debt.total_installments) : ""
  );
  const [paidInstallments, setPaidInstallments] = useState(
    debt ? String(debt.paid_installments) : "0"
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

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

    if (!name.trim()) {
      newErrors.name = "Informe o nome da dívida.";
    }

    const originalCents = toCents(originalAmount);
    if (originalCents <= 0) {
      newErrors.originalAmount = "O valor original deve ser maior que zero.";
    } else if (originalCents > 100_000_000_000) {
      newErrors.originalAmount = "O valor excede o limite máximo.";
    }

    const remainingCents = debt ? toCents(remainingAmount) : originalCents;
    if (debt && remainingCents < 0) {
      newErrors.remainingAmount = "O saldo devedor não pode ser negativo.";
    }

    const paymentCents = toCents(monthlyPayment);
    if (paymentCents < 0) {
      newErrors.monthlyPayment = "A parcela não pode ser negativa.";
    }

    const rate = interestRate ? parseFloat(interestRate.replace(",", ".")) : 0;
    if (isNaN(rate) || rate < 0) {
      newErrors.interestRate = "Taxa de juros inválida.";
    }

    if (!startDate) {
      newErrors.startDate = "Informe a data de início.";
    } else {
      const startDateObj = new Date(startDate);
      const minDate = new Date("2000-01-01");
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 50);
      if (startDateObj < minDate || startDateObj > maxDate) {
        newErrors.startDate = "Data de início fora do intervalo válido.";
      }
    }

    const installments = totalInstallments ? parseInt(totalInstallments, 10) : null;
    if (installments !== null && (isNaN(installments) || installments <= 0)) {
      newErrors.totalInstallments = "Número de parcelas inválido.";
    }

    const paid = parseInt(paidInstallments, 10);
    if (isNaN(paid) || paid < 0) {
      newErrors.paidInstallments = "Parcelas pagas inválidas.";
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

    const payload = {
      name: name.trim(),
      type: type as Debt["type"],
      original_amount_cents: originalCents,
      remaining_amount_cents: remainingCents,
      monthly_payment_cents: paymentCents,
      interest_rate_monthly: rate,
      start_date: startDate,
      due_date: dueDate || null,
      total_installments: installments,
      paid_installments: paid,
    };

    if (debt) {
      const { error: dbError } = await supabase
        .from("debts")
        .update(payload)
        .eq("id", debt.id);

      if (dbError) {
        setServerError("Erro ao atualizar dívida.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "debt.update", "debt", debt.id, { name: payload.name });
    } else {
      const { error: dbError } = await supabase.from("debts").insert({
        user_id: user.id,
        ...payload,
      });

      if (dbError) {
        setServerError("Erro ao criar dívida.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "debt.create", "debt", null, { name: payload.name });
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {serverError}
        </div>
      )}

      <Input
        id="name"
        label="Nome da dívida"
        value={name}
        onChange={(e) => { setName(e.target.value); clearFieldError("name"); }}
        placeholder="Ex: Financiamento carro"
        maxLength={200}
        error={errors.name}
        required
      />

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as Debt["type"])}
        options={typeOptions}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="originalAmount"
          label="Valor original (R$)"
          value={originalAmount}
          onChange={(e) => {
            setOriginalAmount(e.target.value);
            clearFieldError("originalAmount");
            if (!debt) setRemainingAmount(e.target.value);
          }}
          placeholder="0,00"
          error={errors.originalAmount}
          required
        />

        <Input
          id="remainingAmount"
          label="Saldo devedor (R$)"
          value={remainingAmount}
          onChange={(e) => { setRemainingAmount(e.target.value); clearFieldError("remainingAmount"); }}
          placeholder="0,00"
          error={errors.remainingAmount}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="monthlyPayment"
          label="Parcela mensal (R$)"
          value={monthlyPayment}
          onChange={(e) => { setMonthlyPayment(e.target.value); clearFieldError("monthlyPayment"); }}
          placeholder="0,00"
          error={errors.monthlyPayment}
        />

        <Input
          id="interestRate"
          label="Juros (% a.m.)"
          value={interestRate}
          onChange={(e) => { setInterestRate(e.target.value); clearFieldError("interestRate"); }}
          placeholder="0,00"
          error={errors.interestRate}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="startDate"
          label="Data de início"
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); clearFieldError("startDate"); }}
          error={errors.startDate}
          required
        />

        <Input
          id="dueDate"
          label="Data de vencimento"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="totalInstallments"
          label="Total de parcelas"
          type="number"
          value={totalInstallments}
          onChange={(e) => { setTotalInstallments(e.target.value); clearFieldError("totalInstallments"); }}
          placeholder="Opcional"
          error={errors.totalInstallments}
        />

        <Input
          id="paidInstallments"
          label="Parcelas pagas"
          type="number"
          value={paidInstallments}
          onChange={(e) => { setPaidInstallments(e.target.value); clearFieldError("paidInstallments"); }}
          placeholder="0"
          error={errors.paidInstallments}
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {debt ? "Salvar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
