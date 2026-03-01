"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents } from "@/lib/utils";
import { entryTypeOptions } from "@/lib/investment-utils";
import type { InvestmentEntry } from "@/types/database";

interface EntryFormProps {
  investmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EntryForm({ investmentId, onSuccess, onCancel }: EntryFormProps) {
  const supabase = createClient();
  const [type, setType] = useState<InvestmentEntry["type"]>("aporte");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
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

    const dateObj = new Date(date);
    const minDate = new Date("2000-01-01");
    const maxDate = new Date(new Date().getFullYear() + 5, 11, 31);
    if (isNaN(dateObj.getTime()) || dateObj < minDate || dateObj > maxDate) {
      newErrors.date = "Data inválida. Informe uma data entre 2000 e daqui a 5 anos.";
    }

    const cents = toCents(amount);
    if (cents <= 0) {
      newErrors.amount = "Informe um valor maior que zero.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setServerError("Usuário não autenticado.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("investment_entries").insert({
      user_id: user.id,
      investment_id: investmentId,
      type,
      amount_cents: cents,
      date,
      notes: notes || null,
    });

    if (err) {
      setServerError("Erro ao registrar lançamento.");
      setLoading(false);
      return;
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
        id="entry-type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as InvestmentEntry["type"])}
        options={[...entryTypeOptions]}
        required
      />

      <Input
        id="entry-amount"
        label="Valor (R$)"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => { setAmount(e.target.value); clearFieldError("amount"); }}
        placeholder="0,00"
        error={errors.amount}
        required
      />

      <Input
        id="entry-date"
        label="Data"
        type="date"
        value={date}
        onChange={(e) => { setDate(e.target.value); clearFieldError("date"); }}
        error={errors.date}
        required
      />

      <Input
        id="entry-notes"
        label="Observações"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Opcional"
        maxLength={500}
      />

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Registrar
        </Button>
      </div>
    </form>
  );
}
