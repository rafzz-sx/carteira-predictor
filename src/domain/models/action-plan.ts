// src/domain/models/action-plan.ts
// Effective-dated Action Plan ("Plano de Ação") Domain Model and Resolver.

export type AnnualAdjustmentType = 'none' | 'fixed_pct' | 'ipca';

export interface ActionPlanEntry {
  id: string;
  userId: string;
  effectiveFrom: string; // "YYYY-MM" (e.g. "2026-07")
  baseAmountCents: number; // e.g. 250000 = R$ 2.500,00
  annualAdjustmentType: AnnualAdjustmentType;
  annualAdjustmentPct?: number; // e.g. 500 = 5.00%
  endDate?: string; // Optional "YYYY-MM"
  notes?: string;
  createdAt: string;
}

export interface ActionMonthOverride {
  id: string;
  userId: string;
  yearMonth: string; // "YYYY-MM"
  overrideAmountCents: number; // e.g. 0 to skip a month, or extra amount
  isOneOffDeposit: boolean; // e.g. 13th salary, tax refund
  description: string; // e.g. "13º Salário", "Bônus"
}

export interface ActionActualRecord {
  id: string; // `${userId}_${yearMonth}`
  userId: string;
  yearMonth: string; // "YYYY-MM"
  plannedAmountCents: number;
  actualAmountCents: number;
  status: 'pending' | 'partial' | 'completed';
  cumulativeGapCents: number;
  updatedAt: string;
}

/**
 * Pure, deterministic function that resolves the planned action amount for any given month,
 * taking into account:
 * 1. The most recent effective-dated plan entry in or prior to target month.
 * 2. Annual inflation/fixed adjustments applied on anniversary months.
 * 3. Specific month overrides (if any).
 */
export function resolveMonthlyActionPlan(
  targetYearMonth: string,
  entries: ActionPlanEntry[],
  overrides: ActionMonthOverride[] = []
): {
  plannedAmountCents: number;
  source: 'override' | 'plan';
  activeEntryId?: string;
  description?: string;
} {
  // 1. Check for specific month override
  const monthOverride = overrides.find((o) => o.yearMonth === targetYearMonth);
  if (monthOverride) {
    return {
      plannedAmountCents: monthOverride.overrideAmountCents,
      source: 'override',
      description: monthOverride.description,
    };
  }

  // 2. Filter plan entries effective on or before target month, sorted descending by effectiveFrom
  const validEntries = entries
    .filter((e) => e.effectiveFrom <= targetYearMonth)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  if (validEntries.length === 0) {
    return {
      plannedAmountCents: 0,
      source: 'plan',
      description: 'Nenhum plano vigente encontrado para este período',
    };
  }

  const activeEntry = validEntries[0];

  // If active entry has an end date and target is past it, planned is 0
  if (activeEntry.endDate && targetYearMonth > activeEntry.endDate) {
    return {
      plannedAmountCents: 0,
      source: 'plan',
      activeEntryId: activeEntry.id,
      description: 'Plano encerrado',
    };
  }

  // Calculate annual adjustment if applicable
  const [startYear, startMonth] = activeEntry.effectiveFrom.split('-').map(Number);
  const [targetYear, targetMonth] = targetYearMonth.split('-').map(Number);

  const monthsDiff = (targetYear - startYear) * 12 + (targetMonth - startMonth);
  const fullYearsPassed = Math.floor(monthsDiff / 12);

  let adjustedAmountCents = activeEntry.baseAmountCents;

  if (
    fullYearsPassed > 0 &&
    activeEntry.annualAdjustmentType === 'fixed_pct' &&
    activeEntry.annualAdjustmentPct &&
    activeEntry.annualAdjustmentPct > 0
  ) {
    // Compound annual increase: base * (1 + pct)^years
    const multiplier = Math.pow(1 + activeEntry.annualAdjustmentPct / 10000, fullYearsPassed);
    adjustedAmountCents = Math.round(activeEntry.baseAmountCents * multiplier);
  }

  return {
    plannedAmountCents: adjustedAmountCents,
    source: 'plan',
    activeEntryId: activeEntry.id,
    description: `Plano vigente (${activeEntry.effectiveFrom})`,
  };
}
