"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  getTimeToPayoff,
  getTotalInterestCost,
  getExtraPaymentSavings,
  getMonthlyInterestCost,
} from "@/lib/debt-utils";
import type { Debt } from "@/types/database";

interface DebtSimulatorProps {
  debt: Debt;
}

export function DebtSimulator({ debt }: DebtSimulatorProps) {
  const [extraAmount, setExtraAmount] = useState("");

  const interestCost = getMonthlyInterestCost(debt);
  const baseMonths = getTimeToPayoff(debt);
  const baseInterest = getTotalInterestCost(debt);

  const paymentCoversInterest =
    debt.monthly_payment_cents > interestCost || interestCost === 0;

  const savings = useMemo(() => {
    const value = extraAmount.replace(/\./g, "").replace(",", ".");
    const cents = Math.round(parseFloat(value) * 100);
    if (isNaN(cents) || cents <= 0) return null;
    return getExtraPaymentSavings(debt, cents);
  }, [debt, extraAmount]);

  return (
    <div className="space-y-4">
      {!paymentCoversInterest && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
          A parcela atual ({formatCurrency(debt.monthly_payment_cents)}) não
          cobre os juros mensais ({formatCurrency(interestCost)}). A dívida está
          crescendo.
        </div>
      )}

      {/* Current situation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg px-3 py-2.5">
          <p className="text-xs text-slate-400">Juros/mês estimado</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatCurrency(interestCost)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2.5">
          <p className="text-xs text-slate-400">Meses para quitar</p>
          <p className="text-sm font-semibold text-slate-800">
            {baseMonths !== null ? `${baseMonths} meses` : "Indeterminado"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2.5">
          <p className="text-xs text-slate-400">Total de juros restante</p>
          <p className="text-sm font-semibold text-slate-800">
            {baseInterest !== null
              ? formatCurrency(baseInterest)
              : "Indeterminado"}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2.5">
          <p className="text-xs text-slate-400">Saldo devedor</p>
          <p className="text-sm font-semibold text-slate-800">
            {formatCurrency(debt.remaining_amount_cents)}
          </p>
        </div>
      </div>

      {/* Extra payment simulation */}
      {paymentCoversInterest && baseMonths !== null && baseMonths > 0 && (
        <>
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              E se eu pagar mais por mês?
            </h4>
            <Input
              id="extraAmount"
              label="Valor extra/mês (R$)"
              value={extraAmount}
              onChange={(e) => setExtraAmount(e.target.value)}
              placeholder="Ex: 200,00"
            />
          </div>

          {savings && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-lg px-3 py-2.5 border border-emerald-200">
                <p className="text-xs text-emerald-600">Meses economizados</p>
                <p className="text-sm font-semibold text-emerald-700">
                  {savings.monthsSaved}{" "}
                  {savings.monthsSaved === 1 ? "mês" : "meses"}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg px-3 py-2.5 border border-emerald-200">
                <p className="text-xs text-emerald-600">Juros economizados</p>
                <p className="text-sm font-semibold text-emerald-700">
                  {formatCurrency(savings.interestSaved)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
