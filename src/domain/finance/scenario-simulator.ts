// src/domain/finance/scenario-simulator.ts
// Quantitative stress-testing and Monte Carlo stochastic projection engine tailored for Brazilian B3 portfolios.

import { BrazilianAssetType } from '../guards/brazilian-asset-guard';

export interface PortfolioAssetInput {
  ticker: string;
  assetClass: BrazilianAssetType;
  currentGrossCents: number;
  weightPercent: number; // e.g. 25.5 for 25.5%
  sector?: string;
}

export interface HistoricalScenarioDefinition {
  id: string;
  name: string;
  period: string;
  badge: string;
  description: string;
  context: string;
  macroImpacts: {
    ibovChangePercent: number;
    ifixChangePercent: number;
    selicChangeBps: number;
    ipcaChangePercent: number;
    usdChangePercent: number;
  };
  classMultipliers: Record<BrazilianAssetType, number>; // Factor applied to asset price, e.g. -0.088 for -8.8%
}

export const HISTORICAL_SCENARIOS: HistoricalScenarioDefinition[] = [
  {
    id: 'joesley_day',
    name: 'Joesley Day (Maio/2017)',
    period: '18 de Maio de 2017',
    badge: 'ESTRESSE POLÍTICO INSTANTÂNEO',
    description: 'Vazamento de gravações abala o governo federal e aciona Circuit Breaker na B3 no primeiro minuto de negociação.',
    context: 'Ibovespa despencou -8,8% em um único dia. O DI futuro disparou mais de +150 bps e o câmbio subiu +8,1%. Ativos cíclicos e estatais sofreram forte liquidação, enquanto Renda Fixa pós-fixada (CDI) funcionou como porto seguro.',
    macroImpacts: {
      ibovChangePercent: -8.8,
      ifixChangePercent: -3.5,
      selicChangeBps: 150,
      ipcaChangePercent: 0.5,
      usdChangePercent: 8.1,
    },
    classMultipliers: {
      stock: -0.115, // -11.5% médio em ações brasileiras (bancos e estatais mais afetados)
      fii: -0.038, // -3.8% em FIIs
      fiagro: -0.025, // -2.5% em crédito agro
      fiinfra: -0.030, // -3.0% em debêntures de infraestrutura
      etf_br: -0.088, // -8.8% (espelho do Ibovespa)
      fixed_income: 0.005, // +0.5% (ganho nominal do CDI)
    },
  },
  {
    id: 'covid_crash',
    name: 'Choque da COVID-19 (Fev-Mar/2020)',
    period: 'Fevereiro a Março de 2020',
    badge: 'CRASH GLOBAL & 6 CIRCUIT BREAKERS',
    description: 'Crise sanitária global provoca pânico nos mercados mundiais e 6 Circuit Breakers em 8 pregões na B3.',
    context: 'O Ibovespa recuou ~45% do pico aos 63.000 pontos. FIIs de shopping fecharam as portas e despencaram mais de -35%. O Banco Central cortou a Selic agressivamente até a mínima histórica de 2,0% a.a.',
    macroImpacts: {
      ibovChangePercent: -45.0,
      ifixChangePercent: -28.0,
      selicChangeBps: -250,
      ipcaChangePercent: -0.3,
      usdChangePercent: 29.5,
    },
    classMultipliers: {
      stock: -0.420, // -42.0%
      fii: -0.275, // -27.5%
      fiagro: -0.150, // -15.0%
      fiinfra: -0.120, // -12.0%
      etf_br: -0.450, // -45.0%
      fixed_income: 0.015, // +1.5% pós-fixado
    },
  },
  {
    id: 'selic_hike',
    name: 'Choque de Juros (Selic de 2% para 13,75%)',
    period: '2021 a 2022',
    badge: 'CICLO DE APERTO MONETÁRIO',
    description: 'Forte aceleração inflacionária obriga o Banco Central a elevar a taxa Selic em mais de 1.100 pontos-base.',
    context: 'Ações de crescimento (tech, varejo e construção) caíram entre -30% e -60%. Em contrapartida, FIIs de papel atrelados ao CDI e CDBs pós-fixados entregaram retornos nominais acima de 13% ao ano.',
    macroImpacts: {
      ibovChangePercent: -12.0,
      ifixChangePercent: 2.5,
      selicChangeBps: 1175,
      ipcaChangePercent: 10.0,
      usdChangePercent: 5.0,
    },
    classMultipliers: {
      stock: -0.145, // -14.5%
      fii: 0.035, // +3.5% (FIIs de papel compensaram desvalorização de tijolo)
      fiagro: 0.080, // +8.0% (CRA indexado ao CDI entregou yield alto)
      fiinfra: 0.050, // +5.0%
      etf_br: -0.120, // -12.0%
      fixed_income: 0.1375, // +13.75%
    },
  },
  {
    id: 'commodity_boom',
    name: 'Superciclo das Commodities',
    period: '2021 a 2022 & 2004-2008',
    badge: 'VENTO A FAVOR B3',
    description: 'Demanda global aquecida por minério de ferro, petróleo e grãos impulsiona os pesos pesados da B3.',
    context: 'Com Vale e Petrobras representando mais de 25% do Ibovespa, a bolsa brasileira superou índices globais com distribuições recordes de dividendos de dois dígitos.',
    macroImpacts: {
      ibovChangePercent: 28.5,
      ifixChangePercent: 8.0,
      selicChangeBps: 50,
      ipcaChangePercent: 6.5,
      usdChangePercent: -12.0,
    },
    classMultipliers: {
      stock: 0.320, // +32.0%
      fii: 0.085, // +8.5%
      fiagro: 0.140, // +14.0%
      fiinfra: 0.090, // +9.0%
      etf_br: 0.285, // +28.5%
      fixed_income: 0.095, // +9.5%
    },
  },
];

export interface ScenarioSimulationResult {
  scenario: HistoricalScenarioDefinition;
  initialTotalCents: number;
  simulatedTotalCents: number;
  deltaAmountCents: number;
  deltaPercent: number;
  assetImpacts: Array<{
    ticker: string;
    assetClass: BrazilianAssetType;
    initialCents: number;
    simulatedCents: number;
    deltaCents: number;
    deltaPercent: number;
  }>;
  resilienceScore: number; // 0 to 100
  diagnosis: string;
}

/**
 * Simulates the impact of a historical Brazilian market shock on the user's specific portfolio.
 */
export function simulateHistoricalScenario(
  positions: PortfolioAssetInput[],
  scenarioId: string
): ScenarioSimulationResult {
  const scenario = HISTORICAL_SCENARIOS.find((s) => s.id === scenarioId) || HISTORICAL_SCENARIOS[0];

  const initialTotalCents = positions.reduce((acc, p) => acc + p.currentGrossCents, 0);

  const assetImpacts = positions.map((p) => {
    const multiplier = scenario.classMultipliers[p.assetClass] ?? 0;
    const deltaCents = Math.round(p.currentGrossCents * multiplier);
    const simulatedCents = Math.max(0, p.currentGrossCents + deltaCents);
    const deltaPercent = p.currentGrossCents > 0 ? (deltaCents / p.currentGrossCents) * 100 : 0;

    return {
      ticker: p.ticker,
      assetClass: p.assetClass,
      initialCents: p.currentGrossCents,
      simulatedCents,
      deltaCents,
      deltaPercent,
    };
  });

  const simulatedTotalCents = assetImpacts.reduce((acc, a) => acc + a.simulatedCents, 0);
  const deltaAmountCents = simulatedTotalCents - initialTotalCents;
  const deltaPercent = initialTotalCents > 0 ? (deltaAmountCents / initialTotalCents) * 100 : 0;

  // Calibrate resilience score (0-100) based on loss severity
  // Loss of 0% -> Score 100. Loss of -50% -> Score 10.
  const resilienceScore = Math.max(
    10,
    Math.min(100, Math.round(100 + deltaPercent * 1.8))
  );

  let diagnosis = '';
  if (deltaPercent >= 0) {
    diagnosis = 'Excelente resiliência defensiva! Sua carteira capturou ganhos nominais mesmo sob este choque histórico.';
  } else if (deltaPercent > -10) {
    diagnosis = 'Boa proteção patrimonial. A diversificação em Renda Fixa e ativos de renda amorteceu a maior parte da turbulência.';
  } else if (deltaPercent > -25) {
    diagnosis = 'Volatilidade intermediária compatível com carteiras balanceadas. Mantenha os aportes regulares para comprar cotas com desconto.';
  } else {
    diagnosis = 'Alta sensibilidade a choques severos de renda variável. Considere calibrar a reserva de liquidez ou aumentar FIIs de recebíveis e pós-fixados.';
  }

  return {
    scenario,
    initialTotalCents,
    simulatedTotalCents,
    deltaAmountCents,
    deltaPercent,
    assetImpacts,
    resilienceScore,
    diagnosis,
  };
}

export interface CustomShockParameters {
  selicShockBps: number; // e.g. +200 or -150
  ipcaShockPct: number; // e.g. +3.0 or -1.5
  ibovShockPct: number; // e.g. -15.0 or +10.0
  ifixShockPct: number; // e.g. -5.0 or +8.0
}

/**
 * Calculates portfolio impact from custom user-defined macro shocks.
 */
export function simulateCustomScenario(
  positions: PortfolioAssetInput[],
  shocks: CustomShockParameters
) {
  const initialTotalCents = positions.reduce((acc, p) => acc + p.currentGrossCents, 0);

  const assetImpacts = positions.map((p) => {
    let multiplier = 0;

    switch (p.assetClass) {
      case 'stock':
        // Equities move with Ibov shock, plus sensitivity to Selic (higher Selic lowers valuation multiples)
        multiplier = shocks.ibovShockPct / 100 - (shocks.selicShockBps / 10000) * 1.5;
        break;
      case 'fii':
        // Real estate moves with IFIX shock, negative sensitivity to Selic
        multiplier = shocks.ifixShockPct / 100 - (shocks.selicShockBps / 10000) * 0.8;
        break;
      case 'fiagro':
      case 'fiinfra':
        // Credit funds are more resilient, move slightly with IFIX, positive carry on higher Selic
        multiplier = (shocks.ifixShockPct / 100) * 0.5 + (shocks.selicShockBps / 10000) * 0.5;
        break;
      case 'etf_br':
        multiplier = shocks.ibovShockPct / 100;
        break;
      case 'fixed_income':
      default:
        // Cash / post-fixed gains from higher Selic, slight mark-to-market impact if IPCA+
        multiplier = (shocks.selicShockBps / 10000) * 0.6;
        break;
    }

    const deltaCents = Math.round(p.currentGrossCents * multiplier);
    const simulatedCents = Math.max(0, p.currentGrossCents + deltaCents);
    const deltaPercent = p.currentGrossCents > 0 ? (deltaCents / p.currentGrossCents) * 100 : 0;

    return {
      ticker: p.ticker,
      assetClass: p.assetClass,
      initialCents: p.currentGrossCents,
      simulatedCents,
      deltaCents,
      deltaPercent,
    };
  });

  const simulatedTotalCents = assetImpacts.reduce((acc, a) => acc + a.simulatedCents, 0);
  const deltaAmountCents = simulatedTotalCents - initialTotalCents;
  const deltaPercent = initialTotalCents > 0 ? (deltaAmountCents / initialTotalCents) * 100 : 0;

  return {
    initialTotalCents,
    simulatedTotalCents,
    deltaAmountCents,
    deltaPercent,
    assetImpacts,
  };
}

// ============================================================================
// MONTE CARLO STOCHASTIC ENGINE
// ============================================================================

export interface MonteCarloYearPoint {
  year: number;
  p10Cents: number; // Pessimistic (90% probability portfolio is higher)
  p25Cents: number;
  p50Cents: number; // Median expected trajectory
  p75Cents: number;
  p90Cents: number; // Optimistic (top 10%)
  p10PassiveMonthlyCents: number;
  p50PassiveMonthlyCents: number;
  p90PassiveMonthlyCents: number;
  totalInvestedCents: number;
}

export interface MonteCarloSimulationResult {
  years: number;
  iterations: number;
  initialPortfolioCents: number;
  monthlyActionCents: number;
  expectedAnnualRealReturnPct: number;
  annualVolatilityPct: number;
  annualSustainableDividendYieldPct: number;
  timeline: MonteCarloYearPoint[];
  finalOutcome: {
    p10Cents: number;
    p50Cents: number;
    p90Cents: number;
    p50PassiveMonthlyCents: number;
    totalInvestedCents: number;
    p50Multiplier: number;
  };
}

// Pseudo-random seedable generator (Linear Congruential Generator) for reproducible quant tests
class SeededRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  // Box-Muller transform to generate standard normal variables N(0, 1)
  nextNormal(): number {
    let u1 = this.next();
    const u2 = this.next();
    while (u1 <= 1e-15) u1 = this.next();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
}

/**
 * Runs 1,000 Monte Carlo stochastic simulation paths for Brazilian investment accumulation.
 * Formula: Geometric Brownian Motion with periodic monthly investments.
 * dS = S * (mu * dt + sigma * dW) + Action
 */
export function runMonteCarloSimulation(params: {
  initialPortfolioCents: number;
  monthlyActionCents: number;
  years?: number;
  iterations?: number;
  annualRealReturnPct?: number; // e.g. 6.5 for IPCA + 6.5% a.a.
  annualVolatilityPct?: number; // e.g. 14.0%
  sustainableDividendYieldPct?: number; // e.g. 7.0%
  seed?: number;
}): MonteCarloSimulationResult {
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

  // Store final portfolio values at each year milestone for all iterations
  // milestoneValues[yearIndex][iterationIndex]
  const milestoneValues: number[][] = Array.from({ length: years + 1 }, () => []);

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

  // Calculate percentiles at each year point
  const timeline: MonteCarloYearPoint[] = [];

  for (let y = 0; y <= years; y++) {
    const sorted = [...milestoneValues[y]].sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
      return sorted[idx];
    };

    const p10 = getPercentile(10);
    const p25 = getPercentile(25);
    const p50 = getPercentile(50);
    const p75 = getPercentile(75);
    const p90 = getPercentile(90);

    const calcPassiveMonthly = (valCents: number) =>
      Math.round((valCents * (sustainableDividendYieldPct / 100)) / 12);

    const totalInvested = initialPortfolioCents + monthlyActionCents * (y * 12);

    timeline.push({
      year: y,
      p10Cents: p10,
      p25Cents: p25,
      p50Cents: p50,
      p75Cents: p75,
      p90Cents: p90,
      p10PassiveMonthlyCents: calcPassiveMonthly(p10),
      p50PassiveMonthlyCents: calcPassiveMonthly(p50),
      p90PassiveMonthlyCents: calcPassiveMonthly(p90),
      totalInvestedCents: totalInvested,
    });
  }

  const finalYearPoint = timeline[timeline.length - 1];
  const p50Multiplier = finalYearPoint.totalInvestedCents > 0
    ? Number((finalYearPoint.p50Cents / finalYearPoint.totalInvestedCents).toFixed(1))
    : 1.0;

  return {
    years,
    iterations,
    initialPortfolioCents,
    monthlyActionCents,
    expectedAnnualRealReturnPct: annualRealReturnPct,
    annualVolatilityPct,
    annualSustainableDividendYieldPct: sustainableDividendYieldPct,
    timeline,
    finalOutcome: {
      p10Cents: finalYearPoint.p10Cents,
      p50Cents: finalYearPoint.p50Cents,
      p90Cents: finalYearPoint.p90Cents,
      p50PassiveMonthlyCents: finalYearPoint.p50PassiveMonthlyCents,
      totalInvestedCents: finalYearPoint.totalInvestedCents,
      p50Multiplier,
    },
  };
}
