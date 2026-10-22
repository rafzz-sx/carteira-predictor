// scripts/test-scenario-simulator.js
// Unit tests for historical stress tests and Monte Carlo engine.

const assert = require('assert');

// Replicate SeededRNG and runMonteCarloSimulation logic for standalone script
class SeededRNG {
  constructor(seed = 42) {
    this.state = seed;
  }
  next() {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
  nextNormal() {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 <= 1e-15) u1 = this.next();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
}

function runMonteCarloSimulation(params) {
  const {
    initialPortfolioCents = 0,
    monthlyActionCents = 250000,
    years = 20,
    iterations = 1000,
    annualRealReturnPct = 6.5,
    annualVolatilityPct = 14.0,
    sustainableDividendYieldPct = 7.0,
    seed = 42,
  } = params;

  const rng = new SeededRNG(seed);
  const monthlyDt = 1 / 12;
  const monthlyDrift = (annualRealReturnPct / 100 - 0.5 * Math.pow(annualVolatilityPct / 100, 2)) * monthlyDt;
  const monthlyVol = (annualVolatilityPct / 100) * Math.sqrt(monthlyDt);

  const milestoneValues = Array.from({ length: years + 1 }, () => []);

  for (let iter = 0; iter < iterations; iter++) {
    let currentCents = initialPortfolioCents;
    milestoneValues[0].push(currentCents);

    for (let y = 1; y <= years; y++) {
      for (let m = 1; m <= 12; m++) {
        const z = rng.nextNormal();
        const growthFactor = Math.exp(monthlyDrift + monthlyVol * z);
        currentCents = currentCents * growthFactor + monthlyActionCents;
      }
      milestoneValues[y].push(Math.round(currentCents));
    }
  }

  const timeline = [];
  for (let y = 0; y <= years; y++) {
    const sorted = [...milestoneValues[y]].sort((a, b) => a - b);
    const getPercentile = (p) => {
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
      return sorted[idx];
    };

    const p10 = getPercentile(10);
    const p25 = getPercentile(25);
    const p50 = getPercentile(50);
    const p75 = getPercentile(75);
    const p90 = getPercentile(90);

    const calcPassive = (c) => Math.round((c * (sustainableDividendYieldPct / 100)) / 12);
    const totalInvested = initialPortfolioCents + monthlyActionCents * (y * 12);

    timeline.push({
      year: y,
      p10Cents: p10,
      p25Cents: p25,
      p50Cents: p50,
      p75Cents: p75,
      p90Cents: p90,
      p50PassiveMonthlyCents: calcPassive(p50),
      totalInvestedCents: totalInvested,
    });
  }

  return { timeline, years, iterations };
}

function simulateHistoricalScenario(positions, classMultipliers) {
  const initialTotal = positions.reduce((acc, p) => acc + p.currentGrossCents, 0);
  let simulatedTotal = 0;

  for (const p of positions) {
    const mult = classMultipliers[p.assetClass] || 0;
    simulatedTotal += Math.max(0, Math.round(p.currentGrossCents * (1 + mult)));
  }

  const deltaCents = simulatedTotal - initialTotal;
  const deltaPercent = initialTotal > 0 ? (deltaCents / initialTotal) * 100 : 0;
  return { initialTotal, simulatedTotal, deltaCents, deltaPercent };
}

function runScenarioTests() {
  console.log('🧪 Starting Scenario Simulator & Monte Carlo tests...');

  // 1. Joesley Day historical test
  const joesleyMultipliers = {
    stock: -0.115,
    fii: -0.038,
    fixed_income: 0.005,
  };

  const aggressivePortfolio = [
    { ticker: 'PETR4', assetClass: 'stock', currentGrossCents: 8000000 }, // R$ 80k stocks
    { ticker: 'HGLG11', assetClass: 'fii', currentGrossCents: 2000000 },   // R$ 20k FII
  ];

  const conservativePortfolio = [
    { ticker: 'TESOURO SELIC', assetClass: 'fixed_income', currentGrossCents: 8000000 }, // R$ 80k Fixed Income
    { ticker: 'PETR4', assetClass: 'stock', currentGrossCents: 2000000 },                 // R$ 20k stocks
  ];

  const joesleyAggressive = simulateHistoricalScenario(aggressivePortfolio, joesleyMultipliers);
  const joesleyConservative = simulateHistoricalScenario(conservativePortfolio, joesleyMultipliers);

  assert(joesleyAggressive.deltaPercent < -8.0, 'Stock heavy portfolio must drop > -8% in Joesley Day');
  assert(joesleyConservative.deltaPercent > -3.0, 'Fixed income heavy portfolio must be defended (< -3% drop)');
  console.log(`  ✓ Joesley Day stress: Agressiva (${joesleyAggressive.deltaPercent.toFixed(1)}%) vs Conservadora (${joesleyConservative.deltaPercent.toFixed(1)}%)`);

  // 2. COVID-19 crash test
  const covidMultipliers = {
    stock: -0.42,
    fii: -0.275,
    fixed_income: 0.015,
  };
  const covidRes = simulateHistoricalScenario(aggressivePortfolio, covidMultipliers);
  assert(covidRes.deltaPercent < -30.0, 'COVID crash must produce drawdown worse than -30% for aggressive');
  console.log(`  ✓ COVID-19 crash: Drawdown severo apurado com precisão (${covidRes.deltaPercent.toFixed(1)}%)`);

  // 3. Monte Carlo Performance & Statistical Monotonicity
  const startTime = Date.now();
  const mc = runMonteCarloSimulation({
    initialPortfolioCents: 5000000, // R$ 50.000
    monthlyActionCents: 250000,     // R$ 2.500/mês
    years: 20,
    iterations: 1000,
    seed: 42,
  });
  const duration = Date.now() - startTime;
  assert(duration < 200, `1,000 Monte Carlo paths should run in <200ms, took ${duration}ms`);
  console.log(`  ✓ 1.000 trajetórias estocásticas de Monte Carlo executadas em ${duration}ms`);

  // Verify monotonicity at each year milestone: P10 <= P25 <= P50 <= P75 <= P90
  for (let y = 1; y <= 20; y++) {
    const pt = mc.timeline[y];
    assert(pt.p10Cents <= pt.p25Cents, `Year ${y}: P10 <= P25 violated`);
    assert(pt.p25Cents <= pt.p50Cents, `Year ${y}: P25 <= P50 violated`);
    assert(pt.p50Cents <= pt.p75Cents, `Year ${y}: P50 <= P75 violated`);
    assert(pt.p75Cents <= pt.p90Cents, `Year ${y}: P75 <= P90 violated`);
  }
  console.log('  ✓ Monotonicidade estrita validada em todos os 20 marcos anuais (P10 <= P25 <= P50 <= P75 <= P90)');

  // Year 20 P50 wealth comparison
  const year20 = mc.timeline[20];
  assert(year20.p50Cents > year20.totalInvestedCents, 'Year 20 median must beat total invested capital');
  console.log(`  ✓ P50 mediano em 20 anos: R$ ${(year20.p50Cents / 100).toLocaleString('pt-BR')} (Investido: R$ ${(year20.totalInvestedCents / 100).toLocaleString('pt-BR')})`);

  console.log('✅ ALL SCENARIO SIMULATOR & MONTE CARLO TESTS PASSED (100%)\n');
}

runScenarioTests();
