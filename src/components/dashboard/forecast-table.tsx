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
  const [showInvestimentos, setShowInvestimentos] = useState(false);

  if (months.length === 0 || months.every((m) => m.byCategory.length === 0)) {
    return (
      <p className="text-on-surface-muted text-center py-8 text-sm">
        Sem dados para projeção.
      </p>
    );
  }

  const allCategories = months[0].byCategory;
  const receitas = allCategories.filter((c) => c.type === "receita");
  const despesas = allCategories.filter((c) => c.type === "despesa");
  const investimentos = allCategories.filter((c) => c.type === "investimento");

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 font-medium text-on-surface-secondary min-w-[160px]">
                Categoria
              </th>
              {months.map((m) => (
                <th
                  key={m.label}
                  className={`text-right py-2 px-3 font-medium min-w-[110px] capitalize ${
                    m.isCurrentMonth
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/50"
                      : "text-on-surface-secondary"
                  }`}
                >
                  {m.label}
                  {m.isCurrentMonth && (
                    <span className="block text-[10px] font-normal text-emerald-600">
                      (atual)
                    </span>
                  )}
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
                  tabIndex={0}
                  role="button"
                  aria-expanded={showReceitas}
                  onClick={() => setShowReceitas(!showReceitas)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowReceitas(!showReceitas);
                    }
                  }}
                >
                  <td className="py-2.5 pr-4 font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <ChevronIcon open={showReceitas} />
                      Receitas
                    </span>
                  </td>
                  {months.map((m) => (
                    <td
                      key={m.label}
                      className={`text-right py-2.5 px-3 font-semibold text-emerald-700 dark:text-emerald-300 ${
                        m.isCurrentMonth ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      {formatCurrency(m.totalReceitas)}
                      {m.isCurrentMonth && (
                        <div className="text-[10px] font-normal text-on-surface-muted mt-0.5">
                          Real {formatCurrency(m.realReceitas)} · Prev{" "}
                          {formatCurrency(m.forecastReceitas)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {showReceitas &&
                  receitas.map((cat) => (
                    <tr
                      key={cat.categoryId}
                      className="hover:bg-surface-alt transition-colors"
                    >
                      <td className="py-1.5 pr-4 pl-6 text-on-surface-secondary">
                        <span className="flex items-center gap-2">
                          <ProjectionIcon
                            projectionType={cat.projectionType}
                            hasPontual={cat.hasPontual}
                            color="emerald"
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
                            className={`text-right py-1.5 px-3 text-on-surface-secondary ${
                              m.isCurrentMonth ? "bg-emerald-50/50" : ""
                            }`}
                          >
                            {monthCat ? (
                              <div>
                                {formatCurrency(monthCat.projectedAmount)}
                                {m.isCurrentMonth && (
                                  <div className="text-[10px] text-on-surface-muted mt-0.5">
                                    Real {formatCurrency(monthCat.realAmount)} · Prev{" "}
                                    {formatCurrency(monthCat.forecastAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
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
                  className="cursor-pointer hover:bg-rose-50/50 transition-colors"
                  tabIndex={0}
                  role="button"
                  aria-expanded={showDespesas}
                  onClick={() => setShowDespesas(!showDespesas)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowDespesas(!showDespesas);
                    }
                  }}
                >
                  <td className="py-2.5 pr-4 font-semibold text-rose-700 dark:text-rose-300 border-t border-border-light">
                    <span className="flex items-center gap-1.5">
                      <ChevronIcon open={showDespesas} />
                      Despesas
                    </span>
                  </td>
                  {months.map((m) => (
                    <td
                      key={m.label}
                      className={`text-right py-2.5 px-3 font-semibold text-rose-700 dark:text-rose-300 border-t border-border-light ${
                        m.isCurrentMonth ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      {formatCurrency(m.totalDespesas)}
                      {m.isCurrentMonth && (
                        <div className="text-[10px] font-normal text-on-surface-muted mt-0.5">
                          Real {formatCurrency(m.realDespesas)} · Prev{" "}
                          {formatCurrency(m.forecastDespesas)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {showDespesas &&
                  despesas.map((cat) => (
                    <tr
                      key={cat.categoryId}
                      className="hover:bg-surface-alt transition-colors"
                    >
                      <td className="py-1.5 pr-4 pl-6 text-on-surface-secondary">
                        <span className="flex items-center gap-2">
                          <ProjectionIcon
                            projectionType={cat.projectionType}
                            hasPontual={cat.hasPontual}
                            color="rose"
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
                            className={`text-right py-1.5 px-3 text-on-surface-secondary ${
                              m.isCurrentMonth ? "bg-emerald-50/50" : ""
                            }`}
                          >
                            {monthCat ? (
                              <div>
                                {formatCurrency(monthCat.projectedAmount)}
                                {m.isCurrentMonth && (
                                  <div className="text-[10px] text-on-surface-muted mt-0.5">
                                    Real {formatCurrency(monthCat.realAmount)} · Prev{" "}
                                    {formatCurrency(monthCat.forecastAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}

            {/* Investimentos header */}
            {investimentos.length > 0 && (
              <>
                <tr
                  className="cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-950/30 transition-colors"
                  tabIndex={0}
                  role="button"
                  aria-expanded={showInvestimentos}
                  onClick={() => setShowInvestimentos(!showInvestimentos)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setShowInvestimentos(!showInvestimentos);
                    }
                  }}
                >
                  <td className="py-2.5 pr-4 font-semibold text-violet-700 dark:text-violet-300 border-t border-border-light">
                    <span className="flex items-center gap-1.5">
                      <ChevronIcon open={showInvestimentos} />
                      Investimentos
                    </span>
                  </td>
                  {months.map((m) => (
                    <td
                      key={m.label}
                      className={`text-right py-2.5 px-3 font-semibold text-violet-700 dark:text-violet-300 border-t border-border-light ${
                        m.isCurrentMonth ? "bg-emerald-50/50" : ""
                      }`}
                    >
                      {formatCurrency(m.totalInvestimentos)}
                      {m.isCurrentMonth && (
                        <div className="text-[10px] font-normal text-on-surface-muted mt-0.5">
                          Real {formatCurrency(m.realInvestimentos)} · Prev{" "}
                          {formatCurrency(m.forecastInvestimentos)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                {showInvestimentos &&
                  investimentos.map((cat) => (
                    <tr
                      key={cat.categoryId}
                      className="hover:bg-surface-alt transition-colors"
                    >
                      <td className="py-1.5 pr-4 pl-6 text-on-surface-secondary">
                        <span className="flex items-center gap-2">
                          <ProjectionIcon
                            projectionType={cat.projectionType}
                            hasPontual={cat.hasPontual}
                            color="violet"
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
                            className={`text-right py-1.5 px-3 text-on-surface-secondary ${
                              m.isCurrentMonth ? "bg-emerald-50/50" : ""
                            }`}
                          >
                            {monthCat ? (
                              <div>
                                {formatCurrency(monthCat.projectedAmount)}
                                {m.isCurrentMonth && (
                                  <div className="text-[10px] text-on-surface-muted mt-0.5">
                                    Real {formatCurrency(monthCat.realAmount)} · Prev{" "}
                                    {formatCurrency(monthCat.forecastAmount)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}

            {/* Saldo */}
            <tr className="border-t-2 border-border">
              <td className="py-3 pr-4 font-semibold text-on-surface-heading">Saldo</td>
              {months.map((m) => (
                <td
                  key={m.label}
                  className={`text-right py-3 px-3 font-bold ${
                    m.saldo >= 0 ? "text-emerald-600" : "text-orange-600"
                  } ${m.isCurrentMonth ? "bg-emerald-50/50" : ""}`}
                >
                  {m.saldo >= 0 ? "+" : ""}
                  {formatCurrency(m.saldo)}
                  {m.isCurrentMonth && (
                    <div className="text-[10px] font-normal text-on-surface-muted mt-0.5">
                      Real {m.realSaldo >= 0 ? "+" : ""}
                      {formatCurrency(m.realSaldo)} · Prev{" "}
                      {m.forecastSaldo >= 0 ? "+" : ""}
                      {formatCurrency(m.forecastSaldo)}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-border-light">
        <p className="text-xs text-on-surface-muted flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-surface-alt0" /> Recorrente
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-on-surface-muted" /> Histórico
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rotate-45 bg-surface-alt0" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} /> Pontual
          </span>
        </p>
      </div>
    </div>
  );
}

function ProjectionIcon({
  projectionType,
  hasPontual,
  color,
}: {
  projectionType: "recurring" | "historical";
  hasPontual: boolean;
  color: "emerald" | "rose" | "violet";
}) {
  const solid =
    color === "emerald" ? "bg-emerald-500" : color === "violet" ? "bg-violet-500" : "bg-rose-500";
  const light =
    color === "emerald" ? "bg-emerald-300" : color === "violet" ? "bg-violet-300" : "bg-rose-300";

  if (projectionType === "historical") {
    return (
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${light}`}
        title="Histórico (estimado)"
      />
    );
  }

  if (hasPontual) {
    return (
      <span
        className={`w-2 h-2 flex-shrink-0 ${solid}`}
        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
        title="Inclui pontual"
      />
    );
  }

  return (
    <span
      className={`w-2 h-2 rounded-full flex-shrink-0 ${solid}`}
      title="Recorrente (fixo)"
    />
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
