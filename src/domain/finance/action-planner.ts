// src/domain/finance/action-planner.ts
// Mathematical models for compound growth projections and reverse-engineering monthly investment actions.

/**
 * Calculates the future value of an annuity (series of regular monthly investments) in integer cents.
 * Formula: FV = P * [((1 + r)^n - 1) / r]
 * where:
 *   P = monthly investment amount in cents
 *   r = equivalent monthly real interest rate
 *   n = total months (years * 12)
 *
 * @param monthlyAmountCents Monthly action in cents (e.g. 10000 = R$ 100,00)
 * @param annualRealRatePct Annual real rate above inflation in percent (e.g. 6.0 for IPCA + 6%)
 * @param years Horizon in years (e.g. 10, 20, 30)
 * @returns Future value of accumulated portfolio in cents
 */
export function calculateAnnuityFutureValue(
  monthlyAmountCents: number,
  annualRealRatePct: number,
  years: number
): number {
  if (monthlyAmountCents <= 0 || years <= 0) return 0;
  if (annualRealRatePct <= 0) return monthlyAmountCents * years * 12;

  const monthlyRate = Math.pow(1 + annualRealRatePct / 100, 1 / 12) - 1;
  const totalMonths = years * 12;

  const futureValueCents = Math.round(
    monthlyAmountCents * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
  );

  return futureValueCents;
}

/**
 * Calculates the estimated monthly passive dividend income from a given accumulated portfolio in cents.
 *
 * @param portfolioCents Accumulated portfolio size in cents
 * @param annualDividendYieldPct Annual real dividend yield in percent (e.g. 7.0%)
 * @returns Estimated monthly passive income in cents
 */
export function calculateMonthlyPassiveIncome(
  portfolioCents: number,
  annualDividendYieldPct: number
): number {
  if (portfolioCents <= 0 || annualDividendYieldPct <= 0) return 0;
  return Math.round((portfolioCents * (annualDividendYieldPct / 100)) / 12);
}

export interface ReverseCalculationResult {
  targetPortfolioCents: number;
  requiredMonthlyCents: number;
  totalInvestedCents: number;
  compoundInterestGainedCents: number;
  targetMonthlyPassiveIncomeCents: number;
  years: number;
}

/**
 * Reverse calculator: determines the required monthly action to achieve a target monthly passive income.
 *
 * 1. Target Portfolio = (TargetMonthlyPassiveIncome * 12) / DividendYield
 * 2. Required Monthly Action = TargetPortfolio * [r / ((1 + r)^n - 1)]
 *
 * @param targetMonthlyPassiveIncomeCents Desired monthly income in cents (e.g. 500000 = R$ 5.000,00)
 * @param realDividendYieldPct Sustainable real dividend yield (e.g. 7.0%)
 * @param annualRealRatePct Real growth rate during accumulation (e.g. 6.0%)
 * @param years Horizon in years (e.g. 10, 15, 20, 25, 30)
 */
export function calculateRequiredMonthlyAction(
  targetMonthlyPassiveIncomeCents: number,
  realDividendYieldPct: number,
  annualRealRatePct: number,
  years: number
): ReverseCalculationResult {
  if (targetMonthlyPassiveIncomeCents <= 0 || years <= 0 || realDividendYieldPct <= 0) {
    return {
      targetPortfolioCents: 0,
      requiredMonthlyCents: 0,
      totalInvestedCents: 0,
      compoundInterestGainedCents: 0,
      targetMonthlyPassiveIncomeCents,
      years,
    };
  }

  // Target portfolio required to produce desired annual dividends:
  // Annual dividends = targetMonthlyPassiveIncome * 12
  // Portfolio = Annual dividends / (DY / 100)
  const targetPortfolioCents = Math.round(
    (targetMonthlyPassiveIncomeCents * 12) / (realDividendYieldPct / 100)
  );

  const monthlyRate = Math.pow(1 + annualRealRatePct / 100, 1 / 12) - 1;
  const totalMonths = years * 12;

  const requiredMonthlyCents = Math.round(
    targetPortfolioCents * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1))
  );

  const totalInvestedCents = requiredMonthlyCents * totalMonths;
  const compoundInterestGainedCents = Math.max(0, targetPortfolioCents - totalInvestedCents);

  return {
    targetPortfolioCents,
    requiredMonthlyCents,
    totalInvestedCents,
    compoundInterestGainedCents,
    targetMonthlyPassiveIncomeCents,
    years,
  };
}
