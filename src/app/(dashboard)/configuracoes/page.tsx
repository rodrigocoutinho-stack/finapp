"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { CategoryForm } from "@/components/categorias/category-form";
import { CategoryList } from "@/components/categorias/category-list";
import { CategoryRules } from "@/components/categorias/category-rules";
import { usePreferences } from "@/contexts/preferences-context";
import { useToast } from "@/contexts/toast-context";
import type { Category } from "@/types/database";

type Tab = "geral" | "categorias" | "regras";

export default function ConfiguracoesPage() {
  const supabase = createClient();
  const { closingDay, loading: prefsLoading, setClosingDay } = usePreferences();
  const { addToast } = useToast();

  const [tab, setTab] = useState<Tab>("geral");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);

  const currentDay = selectedDay ?? closingDay;

  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    setCategories((data as Category[]) ?? []);
    setCatLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "categorias") {
      fetchCategories();
    }
  }, [tab, fetchCategories]);

  async function handleSave() {
    setSaving(true);
    try {
      await setClosingDay(currentDay);
      addToast("Configuração salva.");
    } catch {
      addToast("Erro ao salvar configuração.", "error");
    }
    setSaving(false);
  }

  const hasChanges = currentDay !== closingDay;

  const tabs: { key: Tab; label: string }[] = [
    { key: "geral", label: "Geral" },
    { key: "categorias", label: "Categorias" },
    { key: "regras", label: "Regras de Importação" },
  ];

  return (
    <div>
      <PageHeader
        title="Configurações"
        description={
          tab === "geral"
            ? "Personalize o funcionamento do app"
            : tab === "categorias"
              ? "Organize suas receitas e despesas por categoria"
              : "Regras para categorizar automaticamente importações OFX"
        }
        action={
          tab === "categorias" ? (
            <Button onClick={() => setShowCatForm(true)}>Nova categoria</Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Geral */}
      {tab === "geral" && (
        <>
          {prefsLoading ? (
            <CardSkeleton />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-lg">
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                Dia de fechamento
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                O dia em que seu período financeiro inicia. Ex: dia 10 → fevereiro vai de 10/fev a 09/mar.
              </p>

              <div className="flex items-end gap-4">
                <div className="flex-1 max-w-[200px]">
                  <label
                    htmlFor="closing-day"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Dia do mês
                  </label>
                  <select
                    id="closing-day"
                    value={currentDay}
                    onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value={1}>Dia 1 (mês calendário padrão)</option>
                    {Array.from({ length: 27 }, (_, i) => i + 2).map((day) => (
                      <option key={day} value={day}>
                        Dia {day}
                      </option>
                    ))}
                  </select>
                </div>

                <Button onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Categorias */}
      {tab === "categorias" && (
        <>
          {catLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : (
            <CategoryList categories={categories} onRefresh={fetchCategories} />
          )}

          <Modal
            open={showCatForm}
            onClose={() => setShowCatForm(false)}
            title="Nova categoria"
          >
            <CategoryForm
              onSuccess={() => {
                setShowCatForm(false);
                fetchCategories();
                addToast("Categoria criada com sucesso.");
              }}
              onCancel={() => setShowCatForm(false)}
            />
          </Modal>
        </>
      )}

      {/* Tab: Regras de Importação */}
      {tab === "regras" && <CategoryRules />}
    </div>
  );
}
