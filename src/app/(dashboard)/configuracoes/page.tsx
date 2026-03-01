"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
import { logAudit } from "@/lib/audit-log";
import type { Category } from "@/types/database";

type Tab = "geral" | "categorias" | "regras";

export default function ConfiguracoesPage() {
  const supabase = createClient();
  const { closingDay, reserveTargetMonths, loading: prefsLoading, setClosingDay, setReserveTargetMonths } = usePreferences();
  const { addToast } = useToast();

  const [tab, setTab] = useState<Tab>("geral");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingReserve, setSavingReserve] = useState(false);
  const [selectedReserveTarget, setSelectedReserveTarget] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      logAudit(supabase, "settings.update_closing_day", "settings", null, { closing_day: currentDay });
      addToast("Configuração salva.");
    } catch {
      addToast("Erro ao salvar configuração.", "error");
    }
    setSaving(false);
  }

  const currentReserveTarget = selectedReserveTarget ?? reserveTargetMonths;
  const hasReserveChanges = currentReserveTarget !== reserveTargetMonths;

  async function handleSaveReserve() {
    setSavingReserve(true);
    try {
      await setReserveTargetMonths(currentReserveTarget);
      logAudit(supabase, "settings.update_reserve_target", "settings", null, { reserve_target_months: currentReserveTarget });
      addToast("Meta de reserva salva.");
    } catch {
      addToast("Erro ao salvar meta de reserva.", "error");
    }
    setSavingReserve(false);
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
      <div className="flex gap-1 bg-tab-bg rounded-lg p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-card text-on-surface shadow-sm"
                : "text-on-surface-muted hover:text-on-surface-secondary"
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
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm max-w-lg">
                <h2 className="text-base font-semibold text-on-surface-heading mb-1">
                  Dia de fechamento
                </h2>
                <p className="text-sm text-on-surface-muted mb-4">
                  O dia em que seu período financeiro inicia. Ex: dia 10 → fevereiro vai de 10/fev a 09/mar.
                </p>

                <div className="flex items-end gap-4">
                  <div className="flex-1 max-w-[200px]">
                    <label
                      htmlFor="closing-day"
                      className="block text-sm font-medium text-on-surface-secondary mb-1"
                    >
                      Dia do mês
                    </label>
                    <select
                      id="closing-day"
                      value={currentDay}
                      onChange={(e) => setSelectedDay(parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-on-surface focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
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

              <div className="bg-card rounded-xl border border-border p-6 shadow-sm max-w-lg">
                <h2 className="text-base font-semibold text-on-surface-heading mb-1">
                  Meta de Reserva de Emergência
                </h2>
                <p className="text-sm text-on-surface-muted mb-4">
                  Quantos meses de despesas sua reserva de emergência deve cobrir. Especialistas recomendam entre 6 e 12 meses.
                </p>

                <div className="flex items-end gap-4">
                  <div className="flex-1 max-w-[200px]">
                    <label
                      htmlFor="reserve-target"
                      className="block text-sm font-medium text-on-surface-secondary mb-1"
                    >
                      Meta (meses)
                    </label>
                    <select
                      id="reserve-target"
                      value={currentReserveTarget}
                      onChange={(e) => setSelectedReserveTarget(parseInt(e.target.value, 10))}
                      className="w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-on-surface focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses (recomendado)</option>
                      <option value={9}>9 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  </div>

                  <Button onClick={handleSaveReserve} disabled={savingReserve || !hasReserveChanges}>
                    {savingReserve ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>

              {/* Appearance / Theme */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-sm max-w-lg">
                <h2 className="text-base font-semibold text-on-surface-heading mb-1">
                  Aparência
                </h2>
                <p className="text-sm text-on-surface-muted mb-4">
                  Escolha o tema visual do aplicativo.
                </p>

                {mounted && (
                  <div className="flex gap-3">
                    {(
                      [
                        { value: "light", label: "Claro", icon: SunIcon },
                        { value: "dark", label: "Escuro", icon: MoonIcon },
                        { value: "system", label: "Sistema", icon: MonitorIcon },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                          theme === opt.value
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "border-border hover:bg-hover text-on-surface-secondary"
                        }`}
                      >
                        <opt.icon />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
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

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
    </svg>
  );
}
