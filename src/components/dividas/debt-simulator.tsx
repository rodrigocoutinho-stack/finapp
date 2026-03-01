"use client";

import { useState } from "react";
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

  const extraValue = extraAmount.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(extraValue);
  const extraCents = isNaN(parsed) ? 0 : Math.round(parsed * 100);
  const savings =
    extraCents <= 0
      ? null
      : getExtraPaymentSavings(debt, extraCents);

  return (
    <div className="space-y-4">
      {!paymentCoversInterest && (
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 p-3 text-sm text-rose-700 dark:text-rose-300">
          A parcela atual ({formatCurrency(debt.monthly_payment_cents)}) não
          cobre os juros mensais ({formatCurrency(interestCost)}). A dívida está
          crescendo.
        </div>
      )}

      {/* Current situation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-alt rounded-lg px-3 py-2.5">
          <p className="text-xs text-on-surface-muted">Juros/mês estimado</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {formatCurrency(interestCost)}
          </p>
        </div>
        <div className="bg-surface-alt rounded-lg px-3 py-2.5">
          <p className="text-xs text-on-surface-muted">Meses para quitar</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {baseMonths !== null ? `${baseMonths} meses` : "Indeterminado"}
          </p>
        </div>
        <div className="bg-surface-alt rounded-lg px-3 py-2.5">
          <p className="text-xs text-on-surface-muted">Total de juros restante</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {baseInterest !== null
              ? formatCurrency(baseInterest)
              : "Indeterminado"}
          </p>
        </div>
        <div className="bg-surface-alt rounded-lg px-3 py-2.5">
          <p className="text-xs text-on-surface-muted">Saldo devedor</p>
          <p className="text-sm font-semibold text-on-surface-heading">
            {formatCurrency(debt.remaining_amount_cents)}
          </p>
        </div>
      </div>

      {/* Extra payment simulation */}
      {paymentCoversInterest && baseMonths !== null && baseMonths > 0 && (
        <>
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold text-on-surface-secondary mb-2">
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
              <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2.5 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600">Meses economizados</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {savings.monthsSaved}{" "}
                  {savings.monthsSaved === 1 ? "mês" : "meses"}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-2.5 border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600">Juros economizados</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
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
