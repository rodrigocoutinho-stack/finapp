"use client";

import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/lib/category-icons";
import type { DailyFlowResult } from "@/lib/daily-flow";

interface DailyFlowTableProps {
  data: DailyFlowResult;
}

export function DailyFlowTable({ data }: DailyFlowTableProps) {
  const { days, receitas, despesas, totalEntradas, totalSaidas } = data;
  const [showReceitas, setShowReceitas] = useState(true);
  const [showDespesas, setShowDespesas] = useState(true);
  const todayRef = useRef<HTMLTableCellElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const cell = todayRef.current;
      const offset = cell.offsetLeft - container.offsetLeft - 200;
      container.scrollLeft = Math.max(0, offset);
    }
  }, [data]);

  if (days.length === 0) {
    return (
      <p className="text-on-surface-muted text-center py-8 text-sm">
        Sem dados para exibir.
      </p>
    );
  }

  const hasReceitas = receitas.length > 0;
  const hasDespesas = despesas.length > 0;

  function cellBg(day: typeof days[0], isHeader = false): string {
    if (day.isToday) return isHeader ? "bg-amber-100 dark:bg-amber-900/40" : "bg-amber-50/60 dark:bg-amber-950/40";
    if (day.isWeekend) return isHeader ? "bg-tab-bg" : "bg-surface-alt/50";
    return "";
  }

  function balanceColor(cents: number): string {
    if (cents < 0) return "text-orange-600 font-semibold";
    return "text-on-surface-heading";
  }

  function formatCompact(cents: number): string {
    if (cents === 0) return "";
    return formatCurrency(cents);
  }

  return (
    <div className="space-y-3">
      <div ref={scrollRef} className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card text-left py-2 pr-2 font-medium text-on-surface-secondary min-w-[160px] border-b border-border">
                &nbsp;
              </th>
              {days.map((day) => (
                <th
                  key={day.day}
                  ref={day.isToday ? todayRef : undefined}
                  className={`text-center py-2 px-1 font-medium min-w-[80px] border-b border-border ${cellBg(day, true)} ${
                    day.isToday ? "text-amber-800" : "text-on-surface-secondary"
                  }`}
                >
                  <div className="text-[10px] uppercase">{day.weekday}</div>
                  <div className="text-sm">{day.day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Saldo Inicial */}
            <tr className="border-b border-border-light">
              <td className="sticky left-0 z-10 bg-card py-1.5 pr-2 font-semibold text-on-surface-secondary">
                Saldo Inicial
              </td>
              {days.map((day) => (
                <td
                  key={day.day}
                  className={`text-right py-1.5 px-1 ${cellBg(day)} ${balanceColor(day.openingBalance)}`}
                >
                  {formatCurrency(day.openingBalance)}
                </td>
              ))}
            </tr>

            {/* Entradas */}
            {hasReceitas && (
              <>
                <tr
                  className="cursor-pointer hover:bg-emerald-50/50 transition-colors border-b border-border-light"
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
                  <td className="sticky left-0 z-10 bg-card py-1.5 pr-2 font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="flex items-center gap-1">
                      <ChevronIcon open={showReceitas} />
                      Entrada
                    </span>
                  </td>
                  {days.map((day, i) => (
                    <td
                      key={day.day}
                      className={`text-right py-1.5 px-1 font-semibold text-emerald-700 dark:text-emerald-300 ${cellBg(day)}`}
                    >
                      {totalEntradas[i] > 0 ? formatCompact(totalEntradas[i]) : ""}
                    </td>
                  ))}
                </tr>

                {showReceitas &&
                  receitas.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-surface-alt transition-colors border-b border-border-light"
                    >
                      <td className="sticky left-0 z-10 bg-card py-1 pr-2 pl-5 text-on-surface-secondary max-w-[160px]">
                        <span className="flex items-center gap-1.5 truncate">
                          <CategoryIcon name={cat.name} className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
                          {cat.name}
                        </span>
                      </td>
                      {days.map((day) => {
                        const entry = day.byCategoryId.get(cat.id);
                        if (!entry || entry.total === 0) {
                          return (
                            <td key={day.day} className={`text-right py-1 px-1 ${cellBg(day)}`}>
                              &nbsp;
                            </td>
                          );
                        }
                        const isPlanned = entry.source === "planned";
                        return (
                          <td
                            key={day.day}
                            className={`text-right py-1 px-1 ${cellBg(day)} ${
                              isPlanned ? "text-blue-600 italic" : "text-on-surface-secondary"
                            }`}
                          >
                            {formatCompact(entry.total)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}

            {/* Saídas */}
            {hasDespesas && (
              <>
                <tr
                  className="cursor-pointer hover:bg-rose-50/50 transition-colors border-b border-border-light"
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
                  <td className="sticky left-0 z-10 bg-card py-1.5 pr-2 font-semibold text-rose-700 dark:text-rose-300">
                    <span className="flex items-center gap-1">
                      <ChevronIcon open={showDespesas} />
                      Saída
                    </span>
                  </td>
                  {days.map((day, i) => (
                    <td
                      key={day.day}
                      className={`text-right py-1.5 px-1 font-semibold text-rose-700 dark:text-rose-300 ${cellBg(day)}`}
                    >
                      {totalSaidas[i] > 0 ? formatCompact(totalSaidas[i]) : ""}
                    </td>
                  ))}
                </tr>

                {showDespesas &&
                  despesas.map((cat) => (
                    <tr
                      key={cat.id}
                      className="hover:bg-surface-alt transition-colors border-b border-border-light"
                    >
                      <td className="sticky left-0 z-10 bg-card py-1 pr-2 pl-5 text-on-surface-secondary max-w-[160px]">
                        <span className="flex items-center gap-1.5 truncate">
                          <CategoryIcon name={cat.name} className="w-3.5 h-3.5 text-on-surface-muted shrink-0" />
                          {cat.name}
                        </span>
                      </td>
                      {days.map((day) => {
                        const entry = day.byCategoryId.get(cat.id);
                        if (!entry || entry.total === 0) {
                          return (
                            <td key={day.day} className={`text-right py-1 px-1 ${cellBg(day)}`}>
                              &nbsp;
                            </td>
                          );
                        }
                        const isPlanned = entry.source === "planned";
                        return (
                          <td
                            key={day.day}
                            className={`text-right py-1 px-1 ${cellBg(day)} ${
                              isPlanned ? "text-blue-600 italic" : "text-on-surface-secondary"
                            }`}
                          >
                            {formatCompact(entry.total)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            )}

            {/* Saldo Final */}
            <tr className="border-t-2 border-border">
              <td className="sticky left-0 z-10 bg-card py-1.5 pr-2 font-semibold text-on-surface-secondary">
                Saldo Final
              </td>
              {days.map((day) => (
                <td
                  key={day.day}
                  className={`text-right py-1.5 px-1 font-bold ${cellBg(day)} ${balanceColor(day.closingBalance)}`}
                >
                  {formatCurrency(day.closingBalance)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="pt-2 border-t border-border-light">
        <p className="text-xs text-on-surface-muted flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-on-surface-secondary" /> Real
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />{" "}
            <span className="italic">Planejado</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-tab-bg border border-input-border" /> Fim de semana
          </span>
        </p>
      </div>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
