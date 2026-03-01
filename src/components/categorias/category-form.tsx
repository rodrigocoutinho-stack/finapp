"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toCents } from "@/lib/utils";
import type { Category } from "@/types/database";

const categoryTypeOptions = [
  { value: "receita", label: "Receita" },
  { value: "despesa", label: "Despesa" },
];

const projectionTypeOptions = [
  { value: "historical", label: "Histórico (média dos últimos meses)" },
  { value: "recurring", label: "Recorrente (valor fixo mensal)" },
];

interface CategoryFormProps {
  category?: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState(category?.type ?? "despesa");
  const [projectionType, setProjectionType] = useState<"recurring" | "historical">(
    category?.projection_type ?? "historical"
  );
  const [budget, setBudget] = useState(
    category?.budget_cents != null
      ? (category.budget_cents / 100).toFixed(2).replace(".", ",")
      : ""
  );
  const [isEssential, setIsEssential] = useState(category?.is_essential ?? false);
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

    const budgetCents = type === "despesa" && budget.trim() !== ""
      ? toCents(budget)
      : null;

    if (budgetCents !== null && budgetCents <= 0) {
      setError("O teto mensal deve ser maior que zero.");
      setLoading(false);
      return;
    }

    if (category) {
      const { error } = await supabase
        .from("categories")
        .update({ name, type, projection_type: projectionType, budget_cents: budgetCents, is_essential: type === "despesa" ? isEssential : false })
        .eq("id", category.id);

      if (error) {
        setError("Erro ao atualizar categoria.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({ user_id: user.id, name, type, projection_type: projectionType, budget_cents: budgetCents, is_essential: type === "despesa" ? isEssential : false });

      if (error) {
        setError("Erro ao criar categoria.");
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
        label="Nome da categoria"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Alimentação, Salário"
        maxLength={100}
        required
      />

      <Select
        id="type"
        label="Tipo"
        value={type}
        onChange={(e) => setType(e.target.value as Category["type"])}
        options={categoryTypeOptions}
        required
      />

      <Select
        id="projectionType"
        label="Tipo de projeção"
        value={projectionType}
        onChange={(e) => setProjectionType(e.target.value as "recurring" | "historical")}
        options={projectionTypeOptions}
        required
      />
      <p className="text-xs text-slate-500 -mt-2">
        Define como calcular a projeção de gastos futuros desta categoria.
      </p>

      {type === "despesa" && (
        <>
          <Input
            id="budget"
            label="Teto mensal (R$)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Opcional — Ex: 500,00"
          />
          <p className="text-xs text-slate-500 -mt-2">
            Limite máximo de gasto mensal. Se não definido, a projeção será usada como referência.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isEssential"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isEssential" className="text-sm text-slate-700">
              Despesa essencial
            </label>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            Categorias essenciais são usadas para calcular reserva de emergência e runway financeiro com mais precisão.
          </p>
        </>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {category ? "Salvar" : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
