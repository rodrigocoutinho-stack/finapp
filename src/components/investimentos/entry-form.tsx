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
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cents = toCents(amount);
    if (cents <= 0) {
      setError("Informe um valor maior que zero.");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Usuário não autenticado.");
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
      setError("Erro ao registrar lançamento.");
      setLoading(false);
      return;
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
        id="entry-type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as InvestmentEntry["type"])}
        options={[...entryTypeOptions]}
      />

      <Input
        id="entry-amount"
        label="Valor (R$)"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0,00"
        required
      />

      <Input
        id="entry-date"
        label="Data"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <Input
        id="entry-notes"
        label="Observações"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Opcional"
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
