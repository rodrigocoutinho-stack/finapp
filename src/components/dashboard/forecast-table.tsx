"use client";

import { formatCurrency } from "@/lib/utils";
import type { CategoryForecast } from "@/lib/forecast";

interface ForecastTableProps {
  byCategory: CategoryForecast[];
  totalReceitas: number;
  totalDespesas: number;
  resultado: number;
}

export function ForecastTable({
  byCategory,
  totalReceitas,
  totalDespesas,
  resultado,
}: ForecastTableProps) {
  const receitas = byCategory.filter((c) => c.type === "receita");
  const despesas = byCategory.filter((c) => c.type === "despesa");

  if (byCategory.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8 text-sm">
        Sem dados para projeção.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {receitas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">
            Receitas
          </h3>
          <div className="space-y-1">
            {receitas.map((c) => (
              <div
                key={c.categoryId}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      c.projectionType === "recurring"
                        ? "bg-emerald-500"
                        : "bg-emerald-300"
                    }`}
                    title={
                      c.projectionType === "recurring"
                        ? "Recorrente (fixo)"
                        : "Histórico (estimado)"
                    }
                  />
                  <span className="text-sm text-gray-700">{c.categoryName}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(c.projectedAmount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 px-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-600">Subtotal</span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(totalReceitas)}
              </span>
            </div>
          </div>
        </div>
      )}

      {despesas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">
            Despesas
          </h3>
          <div className="space-y-1">
            {despesas.map((c) => (
              <div
                key={c.categoryId}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      c.projectionType === "recurring"
                        ? "bg-red-500"
                        : "bg-red-300"
                    }`}
                    title={
                      c.projectionType === "recurring"
                        ? "Recorrente (fixo)"
                        : "Histórico (estimado)"
                    }
                  />
                  <span className="text-sm text-gray-700">{c.categoryName}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(c.projectedAmount)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2 px-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-600">Subtotal</span>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(totalDespesas)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t-2 border-gray-200">
        <div className="flex items-center justify-between py-2 px-2">
          <span className="text-base font-semibold text-gray-800">Resultado</span>
          <span
            className={`text-base font-bold ${
              resultado >= 0 ? "text-blue-600" : "text-orange-600"
            }`}
          >
            {resultado >= 0 ? "+" : "-"} {formatCurrency(Math.abs(resultado))}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" /> Recorrente (fixo)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> Historico (estimado)
          </span>
        </p>
      </div>
    </div>
  );
}
