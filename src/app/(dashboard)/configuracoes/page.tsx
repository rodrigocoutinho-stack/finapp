"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/preferences-context";
import { useToast } from "@/contexts/toast-context";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function ConfiguracoesPage() {
  const { closingDay, loading, setClosingDay } = usePreferences();
  const { addToast } = useToast();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync local state when preferences load
  const currentDay = selectedDay ?? closingDay;

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

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Personalize o funcionamento do app"
      />

      {loading ? (
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
    </div>
  );
}
