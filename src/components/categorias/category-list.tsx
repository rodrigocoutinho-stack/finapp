"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CategoryForm } from "./category-form";
import { CategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/types/database";

interface CategoryListProps {
  categories: Category[];
  onRefresh: () => void;
}

export function CategoryList({ categories, onRefresh }: CategoryListProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const receitas = categories.filter((c) => c.type === "receita");
  const despesas = categories.filter((c) => c.type === "despesa");

  async function handleDelete() {
    if (!deletingCategory) return;
    setDeleteLoading(true);
    setDeleteError("");

    // Check if category has transactions
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("category_id", deletingCategory.id);

    if (count && count > 0) {
      setDeleteError(
        "Não é possível excluir esta categoria pois existem transações vinculadas."
      );
      setDeleteLoading(false);
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", deletingCategory.id);

    if (error) {
      setDeleteError("Erro ao excluir categoria.");
      setDeleteLoading(false);
      return;
    }

    setDeleteLoading(false);
    setDeletingCategory(null);
    onRefresh();
    addToast("Categoria excluída.");
  }

  function renderGroup(title: string, items: Category[]) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-on-surface-heading mb-3">{title}</h2>
        {items.length === 0 ? (
          <p className="text-on-surface-muted text-sm">Nenhuma categoria.</p>
        ) : (
          <div className="space-y-2">
            {items.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3"
              >
                <span className="flex items-center gap-2 text-on-surface">
                  <CategoryIcon name={cat.name} className="w-4 h-4 text-on-surface-muted" />
                  {cat.name}
                  {cat.is_essential && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Essencial
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setEditingCategory(cat)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950 dark:bg-red-950"
                    onClick={() => {
                      setDeleteError("");
                      setDeletingCategory(cat);
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        {renderGroup("Receitas", receitas)}
        {renderGroup("Despesas", despesas)}
      </div>

      <Modal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Editar categoria"
      >
        {editingCategory && (
          <CategoryForm
            category={editingCategory}
            onSuccess={() => {
              setEditingCategory(null);
              onRefresh();
              addToast("Categoria atualizada.");
            }}
            onCancel={() => setEditingCategory(null)}
          />
        )}
      </Modal>

      <Modal
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Excluir categoria"
      >
        {deleteError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            {deleteError}
          </div>
        )}
        <p className="text-on-surface-secondary mb-6">
          Tem certeza que deseja excluir a categoria{" "}
          <strong>{deletingCategory?.name}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeletingCategory(null)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleteLoading} onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}
