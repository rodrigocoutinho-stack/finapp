"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
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
      <PageHeader
        title="Categorias"
        description="Organize suas receitas e despesas por categoria"
        action={<Button onClick={() => setShowForm(true)}>Nova categoria</Button>}
      />

      {loading ? (
        <TableSkeleton rows={5} cols={3} />
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
