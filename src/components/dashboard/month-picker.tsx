"use client";

import { getMonthName } from "@/lib/utils";

interface MonthPickerProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthPicker({ year, month, onPrev, onNext }: MonthPickerProps) {
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
      <span className="text-lg font-semibold text-slate-900 min-w-[180px] text-center">
        {getMonthName(month)} {year}
      </span>
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
