"use client";

import { getMonthName } from "@/lib/utils";
import { getCompetencyRange } from "@/lib/closing-day";

interface MonthPickerProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  closingDay?: number;
}

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  const shortMonths = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${parseInt(d)}/${shortMonths[parseInt(m) - 1]}`;
}

export function MonthPicker({ year, month, onPrev, onNext, closingDay = 1 }: MonthPickerProps) {
  const showRange = closingDay > 1;
  let rangeLabel = "";

  if (showRange) {
    const { start, end } = getCompetencyRange(year, month, closingDay);
    rangeLabel = `${formatShortDate(start)} — ${formatShortDate(end)}`;
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onPrev}
        aria-label="Mês anterior"
        className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="min-w-[180px] text-center">
        <span className="text-lg font-semibold text-slate-900">
          {getMonthName(month)} {year}
        </span>
        {showRange && (
          <p className="text-xs text-slate-400 mt-0.5">{rangeLabel}</p>
        )}
      </div>
      <button
        onClick={onNext}
        aria-label="Próximo mês"
        className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
