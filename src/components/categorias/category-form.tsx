"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  existingGroups?: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, existingGroups = [], onSuccess, onCancel }: CategoryFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(category?.name ?? "");
  const [type, setType] = useState(category?.type ?? "despesa");
  const [categoryGroup, setCategoryGroup] = useState(category?.category_group ?? "");
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

    const budgetCents = type === "despesa" && budget.trim() !== ""
      ? toCents(budget)
      : null;

    if (budgetCents !== null && budgetCents <= 0) {
      newErrors.budget = "O teto mensal deve ser maior que zero.";
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

    if (category) {
      const { error } = await supabase
        .from("categories")
        .update({ name, type, projection_type: projectionType, budget_cents: budgetCents, is_essential: type === "despesa" ? isEssential : false, category_group: categoryGroup.trim() || null })
        .eq("id", category.id);

      if (error) {
        setServerError("Erro ao atualizar categoria.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({ user_id: user.id, name, type, projection_type: projectionType, budget_cents: budgetCents, is_essential: type === "despesa" ? isEssential : false, category_group: categoryGroup.trim() || null });

      if (error) {
        setServerError("Erro ao criar categoria.");
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
        id="name"
        label="Nome da categoria"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Alimentação, Salário"
        maxLength={100}
        required
      />

      <div>
        <label htmlFor="categoryGroup" className="block text-sm font-medium text-on-surface-secondary mb-1">
          Grupo <span className="text-on-surface-muted font-normal">(opcional)</span>
        </label>
        <input
          id="categoryGroup"
          list={`category-group-suggestions-${category?.id ?? "new"}`}
          autoComplete="off"
          value={categoryGroup}
          onChange={(e) => setCategoryGroup(e.target.value)}
          placeholder="Ex: Despesas Essenciais Fixas, Receitas PF"
          maxLength={50}
          className="w-full rounded-lg border border-input-border bg-card px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-muted focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        {existingGroups.length > 0 && (
          <datalist id={`category-group-suggestions-${category?.id ?? "new"}`}>
            {existingGroups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        )}
      </div>

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
      <p className="text-xs text-on-surface-muted -mt-2">
        Define como calcular a projeção de gastos futuros desta categoria.
      </p>

      {type === "despesa" && (
        <>
          <Input
            id="budget"
            label="Teto mensal (R$)"
            value={budget}
            onChange={(e) => { setBudget(e.target.value); clearFieldError("budget"); }}
            placeholder="Opcional — Ex: 500,00"
            error={errors.budget}
          />
          <p className="text-xs text-on-surface-muted -mt-2">
            Limite máximo de gasto mensal. Se não definido, a projeção será usada como referência.
          </p>
          <Checkbox
            id="isEssential"
            label="Despesa essencial"
            checked={isEssential}
            onChange={(e) => setIsEssential(e.target.checked)}
            helpText="Categorias essenciais são usadas para calcular reserva de emergência e runway financeiro com mais precisão."
          />
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
