// ── Financial Independence (FI/RE) ───────────────────────────────

export interface FIYearlyPoint {
  year: number;
  conservative: number;
  base: number;
  optimistic: number;
  target: number;
}

export interface FIScenario {
  label: string;
  annualRealReturn: number;
  yearsToTarget: number | null; // null = não alcança em 100 anos
  finalPatrimony: number;
}

export interface FIResult {
  targetPatrimony: number;
  monthlyExpenseNeeded: number;
  currentProgress: number; // 0..1
  scenarios: [FIScenario, FIScenario, FIScenario];
  yearlyData: FIYearlyPoint[];
}

/**
 * Simula a trajetória de independência financeira com 3 cenários.
 * @param monthlyExpense Gasto mensal desejado na aposentadoria (R$)
 * @param currentPatrimony Patrimônio atual (R$)
 * @param monthlyContribution Aporte mensal (R$)
 * @param swr Taxa de retirada segura anual (ex: 4 = 4%)
 * @param realReturnBase Retorno real anual base (ex: 5 = 5%)
 */
export function fiSimulation(
  monthlyExpense: number,
  currentPatrimony: number,
  monthlyContribution: number,
  swr: number,
  realReturnBase: number
): FIResult {
  const swrDecimal = swr / 100;
  const annualExpense = monthlyExpense * 12;
  const targetPatrimony = swrDecimal > 0 ? annualExpense / swrDecimal : 0;
  const currentProgress = targetPatrimony > 0 ? currentPatrimony / targetPatrimony : 0;

  const scenarioDefs = [
    { label: "Conservador", offset: -2 },
    { label: "Base", offset: 0 },
    { label: "Otimista", offset: 2 },
  ] as const;

  const maxYears = 60;
  const yearlyData: FIYearlyPoint[] = [];
  const trajectories: [number[], number[], number[]] = [[], [], []];
  const yearsToTarget: (number | null)[] = [null, null, null];

  // Initialize
  for (let s = 0; s < 3; s++) {
    trajectories[s].push(currentPatrimony);
  }
  yearlyData.push({
    year: 0,
    conservative: currentPatrimony,
    base: currentPatrimony,
    optimistic: currentPatrimony,
    target: targetPatrimony,
  });

  for (let y = 1; y <= maxYears; y++) {
    const point: FIYearlyPoint = {
      year: y,
      conservative: 0,
      base: 0,
      optimistic: 0,
      target: targetPatrimony,
    };

    for (let s = 0; s < 3; s++) {
      const annualReturn = Math.max(0, realReturnBase + scenarioDefs[s].offset) / 100;
      const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;

      let patrimony = trajectories[s][y - 1];
      for (let m = 0; m < 12; m++) {
        patrimony = patrimony * (1 + monthlyReturn) + monthlyContribution;
      }
      patrimony = Math.round(patrimony * 100) / 100;
      trajectories[s].push(patrimony);

      if (yearsToTarget[s] === null && patrimony >= targetPatrimony && targetPatrimony > 0) {
        yearsToTarget[s] = y;
      }

      if (s === 0) point.conservative = patrimony;
      else if (s === 1) point.base = patrimony;
      else point.optimistic = patrimony;
    }

    yearlyData.push(point);
  }

  const scenarios: [FIScenario, FIScenario, FIScenario] = [
    {
      label: "Conservador",
      annualRealReturn: Math.max(0, realReturnBase - 2),
      yearsToTarget: yearsToTarget[0],
      finalPatrimony: trajectories[0][maxYears],
    },
    {
      label: "Base",
      annualRealReturn: realReturnBase,
      yearsToTarget: yearsToTarget[1],
      finalPatrimony: trajectories[1][maxYears],
    },
    {
      label: "Otimista",
      annualRealReturn: realReturnBase + 2,
      yearsToTarget: yearsToTarget[2],
      finalPatrimony: trajectories[2][maxYears],
    },
  ];

  return {
    targetPatrimony,
    monthlyExpenseNeeded: monthlyExpense,
    currentProgress,
    scenarios,
    yearlyData,
  };
}

// ── Compound Interest ────────────────────────────────────────────

export interface MonthlyDataPoint {
  month: number;
  invested: number;
  total: number;
  interest: number;
}

export interface CompoundInterestResult {
  finalAmount: number;
  totalInvested: number;
  totalInterest: number;
  monthlyData: MonthlyDataPoint[];
}

/**
 * Calcula juros compostos mês a mês.
 * @param principal Valor inicial (R$)
 * @param monthlyRate Taxa mensal (ex: 1 = 1%)
 * @param months Número de meses
 * @param monthlyContribution Aporte mensal (R$)
 */
export function compoundInterest(
  principal: number,
  monthlyRate: number,
  months: number,
  monthlyContribution: number
): CompoundInterestResult {
  const rate = monthlyRate / 100;
  const monthlyData: MonthlyDataPoint[] = [];
  let total = principal;
  let invested = principal;

  monthlyData.push({ month: 0, invested, total, interest: 0 });

  for (let m = 1; m <= months; m++) {
    total = total * (1 + rate) + monthlyContribution;
    invested += monthlyContribution;
    monthlyData.push({
      month: m,
      invested,
      total: Math.round(total * 100) / 100,
      interest: Math.round((total - invested) * 100) / 100,
    });
  }

  return {
    finalAmount: Math.round(total * 100) / 100,
    totalInvested: invested,
    totalInterest: Math.round((total - invested) * 100) / 100,
    monthlyData,
  };
}

// ── Inflation Impact ─────────────────────────────────────────────

export interface YearlyInflationPoint {
  year: number;
  nominalValue: number;
  realValue: number;
}

export interface InflationImpactResult {
  futureNominal: number;
  futureReal: number;
  purchasingPowerLoss: number;
  yearlyData: YearlyInflationPoint[];
}

/**
 * Simula o impacto da inflação sobre um valor ao longo dos anos.
 * @param currentValue Valor atual (R$)
 * @param annualInflation Inflação anual (ex: 5 = 5%)
 * @param years Número de anos
 */
export function inflationImpact(
  currentValue: number,
  annualInflation: number,
  years: number
): InflationImpactResult {
  const rate = annualInflation / 100;
  const yearlyData: YearlyInflationPoint[] = [];

  yearlyData.push({ year: 0, nominalValue: currentValue, realValue: currentValue });

  for (let y = 1; y <= years; y++) {
    const nominalValue = currentValue; // o valor nominal não muda se parado
    const realValue = Math.round((currentValue / Math.pow(1 + rate, y)) * 100) / 100;
    yearlyData.push({ year: y, nominalValue, realValue });
  }

  const finalReal = yearlyData[yearlyData.length - 1].realValue;
  return {
    futureNominal: currentValue,
    futureReal: finalReal,
    purchasingPowerLoss: Math.round((currentValue - finalReal) * 100) / 100,
    yearlyData,
  };
}

// ── Opportunity Cost ─────────────────────────────────────────────

export interface YearlyOpportunityCostPoint {
  year: number;
  totalSpent: number;
  couldHaveBeen: number;
}

export interface OpportunityCostResult {
  totalSpent: number;
  couldHaveBeen: number;
  difference: number;
  yearlyData: YearlyOpportunityCostPoint[];
}

/**
 * Calcula o custo de oportunidade de um gasto mensal recorrente.
 * "E se em vez de gastar R$ X/mês, eu investisse?"
 * @param monthlyExpense Gasto mensal (R$)
 * @param monthlyRate Taxa mensal de rendimento (ex: 0.8 = 0.8%)
 * @param years Número de anos
 */
export function opportunityCost(
  monthlyExpense: number,
  monthlyRate: number,
  years: number
): OpportunityCostResult {
  const rate = monthlyRate / 100;
  const yearlyData: YearlyOpportunityCostPoint[] = [];

  yearlyData.push({ year: 0, totalSpent: 0, couldHaveBeen: 0 });

  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const totalSpent = monthlyExpense * months;

    // FV of annuity: PMT * ((1+r)^n - 1) / r
    let couldHaveBeen: number;
    if (rate === 0) {
      couldHaveBeen = totalSpent;
    } else {
      couldHaveBeen = monthlyExpense * ((Math.pow(1 + rate, months) - 1) / rate);
    }

    yearlyData.push({
      year: y,
      totalSpent: Math.round(totalSpent * 100) / 100,
      couldHaveBeen: Math.round(couldHaveBeen * 100) / 100,
    });
  }

  const last = yearlyData[yearlyData.length - 1];
  return {
    totalSpent: last.totalSpent,
    couldHaveBeen: last.couldHaveBeen,
    difference: Math.round((last.couldHaveBeen - last.totalSpent) * 100) / 100,
    yearlyData,
  };
}
