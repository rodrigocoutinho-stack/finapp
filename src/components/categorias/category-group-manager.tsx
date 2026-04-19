"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/contexts/toast-context";
import { logAudit } from "@/lib/audit-log";
import type { CategoryGroup } from "@/types/database";

interface CategoryGroupManagerProps {
  existingGroupNames: string[];
}

export function CategoryGroupManager({ existingGroupNames }: CategoryGroupManagerProps) {
  const supabase = createClient();
  const { addToast } = useToast();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("category_groups")
      .select("*")
      .order("name", { ascending: true });

    const loaded = (data as CategoryGroup[] | null) ?? [];
    setGroups(loaded);

    // Cria automaticamente grupos que aparecem em categorias mas não existem em category_groups
    const existingNames = new Set(loaded.map((g) => g.name));
    const missing = existingGroupNames.filter((n) => !existingNames.has(n));
    if (missing.length > 0) {
      const rows = missing.map((name) => ({
        user_id: user.id,
        name,
        is_net_revenue_block: false,
      }));
      const { data: inserted, error } = await supabase
        .from("category_groups")
        .upsert(rows, { onConflict: "user_id,name", ignoreDuplicates: true })
        .select();
      if (error) {
        addToast("Erro ao sincronizar grupos de categoria.", "error");
      } else if (inserted && inserted.length > 0) {
        setGroups((prev) => [...prev, ...(inserted as CategoryGroup[])].sort((a, b) => a.name.localeCompare(b.name)));
      }
    }

    setLoading(false);
  }, [existingGroupNames, addToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  async function toggleNetRevenue(group: CategoryGroup) {
    setSaving(group.id);
    const newValue = !group.is_net_revenue_block;
    const { error } = await supabase
      .from("category_groups")
      .update({ is_net_revenue_block: newValue })
      .eq("id", group.id);

    if (error) {
      addToast("Erro ao atualizar grupo.", "error");
    } else {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, is_net_revenue_block: newValue } : g))
      );
      logAudit(supabase, "category_group.toggle_net_revenue", "category_group", group.id, {
        name: group.name,
        is_net_revenue_block: newValue,
      });
      addToast(
        newValue
          ? `"${group.name}" agora é bloco de receita líquida.`
          : `"${group.name}" deixou de ser bloco de receita líquida.`
      );
    }
    setSaving(null);
  }

  if (loading) {
    return <TableSkeleton rows={4} cols={2} />;
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-on-surface-muted py-4">
        Nenhum grupo de categoria configurado ainda. Grupos são criados automaticamente quando você atribui um &quot;Grupo&quot; a uma categoria.
      </p>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border">
        <h3 className="text-base font-semibold text-on-surface-heading mb-1">
          Grupos de categorias
        </h3>
        <p className="text-sm text-on-surface-muted">
          Marque um grupo como <strong>receita líquida</strong> se ele representa um bloco que
          deve ser consolidado (receitas − despesas) em uma única linha de receita na visão PF.
          Exemplo: Pessoa Jurídica — receita bruta menos impostos e custos vira o lucro
          distribuído, que é a renda efetiva da pessoa física.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {groups.map((group) => (
          <li key={group.id} className="flex items-center justify-between px-5 py-4 gap-4">
            <div>
              <p className="text-sm font-medium text-on-surface">{group.name}</p>
              {group.is_net_revenue_block && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Consolidado como receita líquida na visão PF
                </p>
              )}
            </div>
            <Checkbox
              checked={group.is_net_revenue_block}
              onChange={() => toggleNetRevenue(group)}
              disabled={saving === group.id}
              label="Bloco de receita líquida"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
