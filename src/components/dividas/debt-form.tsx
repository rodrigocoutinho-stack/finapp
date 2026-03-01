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
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Informe o nome da dívida.");
      return;
    }

    const originalCents = toCents(originalAmount);
    if (originalCents <= 0) {
      setError("O valor original deve ser maior que zero.");
      return;
    }

    if (originalCents > 100_000_000_000) {
      setError("O valor excede o limite máximo.");
      return;
    }

    const remainingCents = debt ? toCents(remainingAmount) : originalCents;
    if (remainingCents < 0) {
      setError("O saldo devedor não pode ser negativo.");
      return;
    }

    const paymentCents = toCents(monthlyPayment);
    if (paymentCents < 0) {
      setError("A parcela não pode ser negativa.");
      return;
    }

    const rate = interestRate ? parseFloat(interestRate.replace(",", ".")) : 0;
    if (isNaN(rate) || rate < 0) {
      setError("Taxa de juros inválida.");
      return;
    }

    if (!startDate) {
      setError("Informe a data de início.");
      return;
    }

    const startDateObj = new Date(startDate);
    const minDate = new Date("2000-01-01");
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 50);
    if (startDateObj < minDate || startDateObj > maxDate) {
      setError("Data de início fora do intervalo válido.");
      return;
    }

    const installments = totalInstallments ? parseInt(totalInstallments, 10) : null;
    if (installments !== null && (isNaN(installments) || installments <= 0)) {
      setError("Número de parcelas inválido.");
      return;
    }

    const paid = parseInt(paidInstallments, 10);
    if (isNaN(paid) || paid < 0) {
      setError("Parcelas pagas inválidas.");
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
        setError("Erro ao atualizar dívida.");
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
        setError("Erro ao criar dívida.");
        setLoading(false);
        return;
      }
      logAudit(supabase, "debt.create", "debt", null, { name: payload.name });
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
        label="Nome da dívida"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Financiamento carro"
        maxLength={200}
        required
      />

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as Debt["type"])}
        options={typeOptions}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="originalAmount"
          label="Valor original (R$)"
          value={originalAmount}
          onChange={(e) => {
            setOriginalAmount(e.target.value);
            if (!debt) setRemainingAmount(e.target.value);
          }}
          placeholder="0,00"
          required
        />

        <Input
          id="remainingAmount"
          label="Saldo devedor (R$)"
          value={remainingAmount}
          onChange={(e) => setRemainingAmount(e.target.value)}
          placeholder="0,00"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="monthlyPayment"
          label="Parcela mensal (R$)"
          value={monthlyPayment}
          onChange={(e) => setMonthlyPayment(e.target.value)}
          placeholder="0,00"
        />

        <Input
          id="interestRate"
          label="Juros (% a.m.)"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="0,00"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="startDate"
          label="Data de início"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
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
          onChange={(e) => setTotalInstallments(e.target.value)}
          placeholder="Opcional"
        />

        <Input
          id="paidInstallments"
          label="Parcelas pagas"
          type="number"
          value={paidInstallments}
          onChange={(e) => setPaidInstallments(e.target.value)}
          placeholder="0"
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
