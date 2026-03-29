"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
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
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error("Erro ao carregar regras de categorização:", err);
      addToast("Erro ao carregar regras.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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

  async function handleDelete() {
    if (!deletingRuleId) return;
    setDeleteLoading(true);

    const { error } = await supabase
      .from("category_rules")
      .delete()
      .eq("id", deletingRuleId);

    setDeleteLoading(false);
    setDeletingRuleId(null);

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
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-on-surface-heading mb-1">
          Nova regra de categorização
        </h3>
        <p className="text-xs text-on-surface-muted mb-4">
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
              className="block text-sm font-medium text-on-surface-secondary mb-1"
            >
              Categoria
            </label>
            <select
              id="rule-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-on-surface focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              required
            >
              <option value="">Selecione...</option>
              {despesas.length > 0 && (() => {
                const groups = new Map<string, typeof despesas>();
                for (const c of despesas) {
                  const g = c.category_group ?? "Despesas";
                  if (!groups.has(g)) groups.set(g, []);
                  groups.get(g)!.push(c);
                }
                return [...groups.entries()].map(([group, cats]) => (
                  <optgroup key={`d-${group}`} label={group === "Despesas" && groups.size === 1 ? "Despesas" : `Despesas › ${group}`}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                ));
              })()}
              {receitas.length > 0 && (() => {
                const groups = new Map<string, typeof receitas>();
                for (const c of receitas) {
                  const g = c.category_group ?? "Receitas";
                  if (!groups.has(g)) groups.set(g, []);
                  groups.get(g)!.push(c);
                }
                return [...groups.entries()].map(([group, cats]) => (
                  <optgroup key={`r-${group}`} label={group === "Receitas" && groups.size === 1 ? "Receitas" : `Receitas › ${group}`}>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                ));
              })()}
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
        <DataTable
          columns={[
            {
              key: "pattern",
              header: "Padrão",
              className: "font-mono text-on-surface",
              render: (rule: CategoryRuleWithCategory) => rule.pattern,
            },
            {
              key: "category",
              header: "Categoria",
              className: "text-on-surface-secondary",
              render: (rule: CategoryRuleWithCategory) => rule.categories?.name ?? "—",
            },
            {
              key: "type",
              header: "Tipo",
              render: (rule: CategoryRuleWithCategory) => (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    rule.categories?.type === "receita"
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {rule.categories?.type === "receita" ? "Receita" : "Despesa"}
                </span>
              ),
            },
          ]}
          data={rules}
          keyExtractor={(rule) => rule.id}
          actions={(rule) => (
            <Button
              variant="ghost"
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 dark:bg-red-950"
              onClick={() => setDeletingRuleId(rule.id)}
            >
              Excluir
            </Button>
          )}
        />
      )}

      <Modal
        open={!!deletingRuleId}
        onClose={() => setDeletingRuleId(null)}
        title="Excluir regra"
      >
        <p className="text-on-surface-secondary mb-6">
          Tem certeza que deseja excluir esta regra de categorização?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingRuleId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
