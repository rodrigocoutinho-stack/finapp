"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CategoryForm } from "@/components/categorias/category-form";
import { CategoryList } from "@/components/categorias/category-list";
import { useToast } from "@/contexts/toast-context";
import type { Category } from "@/types/database";

export default function CategoriasPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600 text-sm mt-1">
            Organize suas receitas e despesas por categoria
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>Nova categoria</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <CategoryList categories={categories} onRefresh={fetchCategories} />
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Nova categoria"
      >
        <CategoryForm
          onSuccess={() => {
            setShowForm(false);
            fetchCategories();
            addToast("Categoria criada com sucesso.");
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
