"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import type { Category, CategoryRule } from "@/types/database";

interface CategoryRuleWithCategory extends CategoryRule {
  categories: { name: string; type: "receita" | "despesa" } | null;
}

export function CategoryRules() {
  const supabase = createClient();
  const { addToast } = useToast();

  const [rules, setRules] = useState<CategoryRuleWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [pattern, setPattern] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [rulesRes, catsRes] = await Promise.all([
      supabase
        .from("category_rules")
        .select("*, categories(name, type)")
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .order("type")
        .order("name"),
    ]);

    setRules((rulesRes.data as CategoryRuleWithCategory[]) ?? []);
    setCategories((catsRes.data as Category[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pattern.trim() || !categoryId) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      addToast("Usuário não autenticado.", "error");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("category_rules").insert({
      user_id: user.id,
      pattern: pattern.trim(),
      category_id: categoryId,
    });

    if (error) {
      addToast("Erro ao criar regra.", "error");
    } else {
      addToast("Regra criada com sucesso.");
      setPattern("");
      setCategoryId("");
      fetchData();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("category_rules")
      .delete()
      .eq("id", id);

    if (error) {
      addToast("Erro ao excluir regra.", "error");
    } else {
      addToast("Regra excluída.");
      fetchData();
    }
  }

  if (loading) {
    return <TableSkeleton rows={4} cols={3} />;
  }

  const receitas = categories.filter((c) => c.type === "receita");
  const despesas = categories.filter((c) => c.type === "despesa");

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Nova regra de categorização
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Quando a descrição da transação OFX contiver o padrão, a categoria será atribuída automaticamente.
        </p>

        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              id="pattern"
              label="Padrão (texto)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder='Ex: "UBER", "NETFLIX", "PIX"'
              required
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="rule-category"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Categoria
            </label>
            <select
              id="rule-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            >
              <option value="">Selecione...</option>
              {despesas.length > 0 && (
                <optgroup label="Despesas">
                  {despesas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {receitas.length > 0 && (
                <optgroup label="Receitas">
                  {receitas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <Button type="submit" loading={saving}>
            Adicionar
          </Button>
        </form>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <EmptyState message="Nenhuma regra cadastrada. Adicione regras para categorizar automaticamente importações OFX." />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Padrão
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Categoria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase w-20">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-slate-900">
                    {rule.pattern}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {rule.categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        rule.categories?.type === "receita"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {rule.categories?.type === "receita" ? "Receita" : "Despesa"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
