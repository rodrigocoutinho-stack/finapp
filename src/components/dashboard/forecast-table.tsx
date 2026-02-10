"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { MonthForecast } from "@/lib/forecast";

interface ForecastTableProps {
  months: MonthForecast[];
}

export function ForecastTable({ months }: ForecastTableProps) {
  const [showReceitas, setShowReceitas] = useState(false);
  const [showDespesas, setShowDespesas] = useState(false);

  if (months.length === 0 || months.every((m) => m.byCategory.length === 0)) {
    return (
      <p className="text-gray-500 text-center py-8 text-sm">
        Sem dados para projeção.
      </p>
    );
  }

  const allCategories = months[0].byCategory;
  const receitas = allCategories.filter((c) => c.type === "receita");
  const despesas = allCategories.filter((c) => c.type === "despesa");

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-600 min-w-[160px]">
                Categoria
              </th>
              {months.map((m) => (
                <th
                  key={m.label}
                  className="text-right py-2 px-3 font-medium text-gray-600 min-w-[110px] capitalize"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Receitas header */}
            {receitas.length > 0 && (
              <>
                <tr
                  className="cursor-pointer hover:bg-emerald-50/50 transition-colors"
                  onClick={() => setShowReceitas(!showReceitas)}
                >
                  <td className="py-2.5 pr-4 font-semibold text-emerald-700">
                    <span className="flex items-center gap-1.5">
                      <ChevronIcon open={showReceitas} />
                      Receitas
                    </span>
                  </td>
                  {months.map((m) => (
                    <td
                      key={m.label}
                      className="text-right py-2.5 px-3 font-semibold text-emerald-700"
                    >
                      {formatCurrency(m.totalReceitas)}
                    </td>
                  ))}
                </tr>

                {showReceitas &&
                  receitas.map((cat) => (
                    <tr
                      key={cat.categoryId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-1.5 pr-4 pl-6 text-gray-700">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              cat.projectionType === "recurring"
                                ? "bg-emerald-500"
                                : "bg-emerald-300"
                            }`}
                            title={
                              cat.projectionType === "recurring"
                                ? "Recorrente (fixo)"
                                : "Histórico (estimado)"
                            }
                          />
                          {cat.categoryName}
                        </span>
                      </td>
                      {months.map((m) => {
                        const monthCat = m.byCategory.find(
                          (c) => c.categoryId === cat.categoryId
                        );
                        return (
                          <td
                            key={m.label}
                            className="text-right py-1.5 px-3 text-gray-600"
                          >
                            {monthCat
                              ? formatCurrency(monthCat.projectedAmount)
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}

            {/* Despesas header */}
            {despesas.length > 0 && (
              <>
                <tr
                  className="cursor-pointer hover:bg-red-50/50 transition-colors"
                  onClick={() => setShowDespesas(!showDespesas)}
                >
                  <td className="py-2.5 pr-4 font-semibold text-red-700 border-t border-gray-100">
                    <span className="flex items-center gap-1.5">
                      <ChevronIcon open={showDespesas} />
                      Despesas
                    </span>
                  </td>
                  {months.map((m) => (
                    <td
                      key={m.label}
                      className="text-right py-2.5 px-3 font-semibold text-red-700 border-t border-gray-100"
                    >
                      {formatCurrency(m.totalDespesas)}
                    </td>
                  ))}
                </tr>

                {showDespesas &&
                  despesas.map((cat) => (
                    <tr
                      key={cat.categoryId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-1.5 pr-4 pl-6 text-gray-700">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              cat.projectionType === "recurring"
                                ? "bg-red-500"
                                : "bg-red-300"
                            }`}
                            title={
                              cat.projectionType === "recurring"
                                ? "Recorrente (fixo)"
                                : "Histórico (estimado)"
                            }
                          />
                          {cat.categoryName}
                        </span>
                      </td>
                      {months.map((m) => {
                        const monthCat = m.byCategory.find(
                          (c) => c.categoryId === cat.categoryId
                        );
                        return (
                          <td
                            key={m.label}
                            className="text-right py-1.5 px-3 text-gray-600"
                          >
                            {monthCat
                              ? formatCurrency(monthCat.projectedAmount)
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}

            {/* Saldo */}
            <tr className="border-t-2 border-gray-200">
              <td className="py-3 pr-4 font-semibold text-gray-800">Saldo</td>
              {months.map((m) => (
                <td
                  key={m.label}
                  className={`text-right py-3 px-3 font-bold ${
                    m.saldo >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  {m.saldo >= 0 ? "+" : ""}
                  {formatCurrency(m.saldo)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" /> Recorrente
            (fixo)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> Histórico
            (estimado)
          </span>
        </p>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
