// scripts/test-action-planner.js
// Unit tests for the Action Planner ("Plano de Ação"), compound growth impact, and reverse calculator.

const assert = require('assert');

function resolveMonthlyActionPlan(targetYearMonth, entries, overrides = []) {
  // 1. Check for specific month override
  const monthOverride = overrides.find((o) => o.yearMonth === targetYearMonth);
  if (monthOverride) {
    return {
      plannedAmountCents: monthOverride.overrideAmountCents,
      source: 'override',
      description: monthOverride.description,
    };
  }

  // 2. Filter plan entries effective on or before target month, sorted descending
  const validEntries = entries
    .filter((e) => e.effectiveFrom <= targetYearMonth)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  if (validEntries.length === 0) {
    return {
      plannedAmountCents: 0,
      source: 'plan',
      description: 'Nenhum plano vigente',
    };
  }

  const activeEntry = validEntries[0];

  if (activeEntry.endDate && targetYearMonth > activeEntry.endDate) {
    return {
      plannedAmountCents: 0,
      source: 'plan',
      description: 'Plano encerrado',
    };
  }

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

// Compound growth projection (Future Value of annuity in cents)
function calculateAnnuityFutureValue(monthlyAmountCents, annualRealRatePct, years) {
  const monthlyRate = Math.pow(1 + annualRealRatePct / 100, 1 / 12) - 1;
  const totalMonths = years * 12;
  const futureValueCents = Math.round(
    monthlyAmountCents * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
  );
  return futureValueCents;
}

// Reverse calculator: required monthly action for desired monthly passive income
function calculateRequiredMonthlyAction(targetMonthlyPassiveIncomeCents, realDividendYieldPct, annualRealRatePct, years) {
  // Target portfolio = targetMonthlyPassiveIncome * 12 / realDividendYieldPct
  const targetPortfolioCents = Math.round((targetMonthlyPassiveIncomeCents * 12) / (realDividendYieldPct / 100));
  const monthlyRate = Math.pow(1 + annualRealRatePct / 100, 1 / 12) - 1;
  const totalMonths = years * 12;
  const requiredMonthlyCents = Math.round(
    targetPortfolioCents * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1))
  );
  return {
    targetPortfolioCents,
    requiredMonthlyCents,
  };
}

function runActionPlannerTests() {
  console.log('🧪 Starting Action Planner ("Plano de Ação") tests...');

  // 1. Effective-dating test
  const entries = [
    { id: 'p1', effectiveFrom: '2026-01', baseAmountCents: 200000, annualAdjustmentType: 'none' }, // R$ 2.000
    { id: 'p2', effectiveFrom: '2026-07', baseAmountCents: 250000, annualAdjustmentType: 'none' }, // R$ 2.500
  ];

  const planMay = resolveMonthlyActionPlan('2026-05', entries);
  assert.strictEqual(planMay.plannedAmountCents, 200000, 'May should resolve to p1 (R$ 2.000)');

  const planOct = resolveMonthlyActionPlan('2026-10', entries);
  assert.strictEqual(planOct.plannedAmountCents, 250000, 'October should resolve to p2 (R$ 2.500)');
  console.log('  ✓ Effective-dating precedence resolves correct plan entry');

  // 2. Annual increase test (+5% after 1 full year)
  const entriesWithIncrease = [
    {
      id: 'p3',
      effectiveFrom: '2025-01',
      baseAmountCents: 200000, // R$ 2.000
      annualAdjustmentType: 'fixed_pct',
      annualAdjustmentPct: 500, // 5.00%
    },
  ];

  const planSameYear = resolveMonthlyActionPlan('2025-11', entriesWithIncrease);
  assert.strictEqual(planSameYear.plannedAmountCents, 200000, 'Same year should not apply annual increase');

  const planNextYear = resolveMonthlyActionPlan('2026-01', entriesWithIncrease);
  // 200000 * 1.05 = 210000
  assert.strictEqual(planNextYear.plannedAmountCents, 210000, 'Year 1 anniversary should increase by 5% (R$ 2.100)');
  console.log('  ✓ Annual adjustment (+5.00% p.a.) compounds accurately on anniversary');

  // 3. Month override test (e.g. 13th salary)
  const overrides = [
    {
      id: 'ov1',
      yearMonth: '2026-12',
      overrideAmountCents: 500000, // R$ 5.000
      isOneOffDeposit: true,
      description: '13º Salário',
    },
  ];

  const decPlan = resolveMonthlyActionPlan('2026-12', entries, overrides);
  assert.strictEqual(decPlan.plannedAmountCents, 500000, 'Override should take precedence over base plan');
  assert.strictEqual(decPlan.source, 'override');
  console.log('  ✓ Specific month override (13º salário) correctly overrides baseline plan');

  // 4. Long-term impact test: R$ 100/mo at 6% p.a. real return for 30 years
  const fv100_30y = calculateAnnuityFutureValue(10000, 6.0, 30);
  // FV of R$ 100/mo over 360 months at 6% real: ~ R$ 97.900 to R$ 100.500
  assert(fv100_30y > 9000000 && fv100_30y < 11000000, `Future value must be around R$ 100k, got ${fv100_30y}`);
  console.log(`  ✓ Impact of R$ 100/mês in 30 years (IPCA + 6%): R$ ${(fv100_30y / 100).toLocaleString('pt-BR')}`);

  // 5. Reverse Calculator test: Target R$ 5.000/mo passive income in 20 years at 7% DY and 6% real growth
  const reverse = calculateRequiredMonthlyAction(500000, 7.0, 6.0, 20);
  assert(reverse.targetPortfolioCents > 80000000, 'Target portfolio must be around R$ 857.000');
  assert(reverse.requiredMonthlyCents > 150000 && reverse.requiredMonthlyCents < 250000, 'Required monthly action should be ~R$ 1.800 - R$ 2.000');
  console.log(`  ✓ Reverse calculator: R$ 5.000/mês de renda passiva requer carteira de R$ ${(reverse.targetPortfolioCents / 100).toLocaleString('pt-BR')} e Ação mensal de R$ ${(reverse.requiredMonthlyCents / 100).toLocaleString('pt-BR')}`);

  console.log('✅ ALL ACTION PLANNER TESTS PASSED (100%)\n');
}

runActionPlannerTests();
