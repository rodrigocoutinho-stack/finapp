"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { productOptions, indexerOptions } from "@/lib/investment-utils";
import type { Investment, Account } from "@/types/database";

interface InvestmentFormProps {
  investment?: Investment;
  accounts: Account[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function InvestmentForm({
  investment,
  accounts,
  onSuccess,
  onCancel,
}: InvestmentFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(investment?.name ?? "");
  const [accountId, setAccountId] = useState(investment?.account_id ?? (accounts[0]?.id ?? ""));
  const [product, setProduct] = useState<Investment["product"]>(investment?.product ?? "cdb");
  const [indexer, setIndexer] = useState<Investment["indexer"]>(investment?.indexer ?? "cdi");
  const [rate, setRate] = useState(investment?.rate ?? "");
  const [maturityDate, setMaturityDate] = useState(investment?.maturity_date ?? "");
  const [notes, setNotes] = useState(investment?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

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

    if (!accountId) {
      newErrors.account = "Selecione uma conta. Cadastre uma conta antes de criar investimentos.";
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

    const payload = {
      name,
      account_id: accountId,
      product,
      indexer,
      rate: rate || null,
      maturity_date: maturityDate || null,
      notes: notes || null,
    };

    if (investment) {
      const { error: err } = await supabase
        .from("investments")
        .update(payload)
        .eq("id", investment.id);

      if (err) {
        setServerError("Erro ao atualizar investimento.");
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from("investments")
        .insert({ ...payload, user_id: user.id });

      if (err) {
        setServerError("Erro ao criar investimento.");
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

      <Input
        id="inv-name"
        label="Nome do investimento"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: CDB Banco Inter 120% CDI"
        maxLength={200}
        required
      />

      <Select
        id="inv-account"
        label="Conta / Corretora"
        value={accountId}
        onChange={(e) => { setAccountId(e.target.value); clearFieldError("account"); }}
        options={accountOptions}
        error={errors.account}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="inv-product"
          label="Produto"
          value={product}
          onChange={(e) => setProduct(e.target.value as Investment["product"])}
          options={[...productOptions]}
          required
        />

        <Select
          id="inv-indexer"
          label="Indexador"
          value={indexer}
          onChange={(e) => setIndexer(e.target.value as Investment["indexer"])}
          options={[...indexerOptions]}
          required
        />
      </div>

      <Input
        id="inv-rate"
        label="Taxa contratada"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        placeholder="Ex: 120% CDI, IPCA+6,5%"
        maxLength={50}
      />

      <Input
        id="inv-maturity"
        label="Vencimento"
        type="date"
        value={maturityDate}
        onChange={(e) => setMaturityDate(e.target.value)}
      />

      <Input
        id="inv-notes"
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
          {investment ? "Salvar" : "Criar investimento"}
        </Button>
      </div>
    </form>
  );
}
