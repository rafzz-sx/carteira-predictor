// src/app/api/simular/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import {
  PortfolioAssetInput,
  HISTORICAL_SCENARIOS,
  simulateHistoricalScenario,
  simulateCustomScenario,
  runMonteCarloSimulation,
  CustomShockParameters,
} from '@/domain/finance/scenario-simulator';
import { MarketDataService } from '@/lib/market-data';

const DEFAULT_USER_ID = 'demo-user-1';

// Reference portfolio if user has no positions in custody yet
const REFERENCE_PORTFOLIO: PortfolioAssetInput[] = [
  { ticker: 'PETR4', assetClass: 'stock', currentGrossCents: 1536800, weightPercent: 25.0, sector: 'Petróleo e Gás' },
  { ticker: 'VALE3', assetClass: 'stock', currentGrossCents: 1256000, weightPercent: 20.0, sector: 'Mineração' },
  { ticker: 'ITUB4', assetClass: 'stock', currentGrossCents: 950000, weightPercent: 15.0, sector: 'Bancos' },
  { ticker: 'HGLG11', assetClass: 'fii', currentGrossCents: 1150000, weightPercent: 18.0, sector: 'Galpões' },
  { ticker: 'KNCR11', assetClass: 'fii', currentGrossCents: 750000, weightPercent: 12.0, sector: 'Recebíveis' },
  { ticker: 'TESOURO SELIC', assetClass: 'fixed_income', currentGrossCents: 620000, weightPercent: 10.0, sector: 'Renda Fixa' },
];

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;
    const portfolioRepo = RepositoryFactory.getPortfolioRepository();
    const actionRepo = RepositoryFactory.getActionPlanRepository();

    const portfolios = await portfolioRepo.listPortfolios(userId);
    let positions: PortfolioAssetInput[] = [];

    if (portfolios.length > 0) {
      const dbPositions = await portfolioRepo.listPositions(portfolios[0].id);
      if (dbPositions.length > 0) {
        const quotes = MarketDataService.getBatchQuotes(dbPositions.map((p) => p.ticker));
        const totalGross = dbPositions.reduce(
          (acc, p) => acc + (p.quantity * (quotes[p.ticker]?.priceCents || p.averagePriceCents)),
          0
        );

        positions = dbPositions.map((p) => {
          const gross = p.quantity * (quotes[p.ticker]?.priceCents || p.averagePriceCents);
          return {
            ticker: p.ticker,
            assetClass: p.assetType,
            currentGrossCents: gross,
            weightPercent: totalGross > 0 ? Number(((gross / totalGross) * 100).toFixed(1)) : 0,
          };
        });
      }
    }

    // Fallback to reference portfolio if empty
    if (positions.length === 0) {
      positions = REFERENCE_PORTFOLIO;
    }

    const totalPortfolioCents = positions.reduce((acc, p) => acc + p.currentGrossCents, 0);

    // Get active planned action amount
    const planEntries = await actionRepo.listPlanEntries(userId);
    const currentActionCents = planEntries.length > 0 ? planEntries[0].baseAmountCents : 250000;

    // Run all 4 historical stress tests
    const historicalResults = HISTORICAL_SCENARIOS.map((scen) =>
      simulateHistoricalScenario(positions, scen.id)
    );

    // Run Monte Carlo Simulation (1,000 paths over 20 years)
    const monteCarloResult = runMonteCarloSimulation({
      initialPortfolioCents: totalPortfolioCents,
      monthlyActionCents: currentActionCents,
      years: 20,
      iterations: 1000,
      annualRealReturnPct: 6.5,
      annualVolatilityPct: 14.0,
      sustainableDividendYieldPct: 7.0,
      seed: 42,
    });

    return NextResponse.json({
      positions,
      totalPortfolioCents,
      currentActionCents,
      historicalScenarios: historicalResults,
      monteCarlo: monteCarloResult,
      isReferencePortfolio: positions === REFERENCE_PORTFOLIO,
      disclaimer: 'Simulações probabilísticas baseadas em retornos históricos do mercado brasileiro B3. Rentabilidade passada não garante rentabilidade futura.',
    });
  } catch (error) {
    console.error('Error running scenario simulation:', error);
    return NextResponse.json({ error: 'Falha ao executar simulação de cenários' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const positions: PortfolioAssetInput[] = body.positions || REFERENCE_PORTFOLIO;

    const shocks: CustomShockParameters = {
      selicShockBps: Number(body.selicShockBps) || 0,
      ipcaShockPct: Number(body.ipcaShockPct) || 0,
      ibovShockPct: Number(body.ibovShockPct) || 0,
      ifixShockPct: Number(body.ifixShockPct) || 0,
    };

    const result = simulateCustomScenario(positions, shocks);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error running custom shock simulation:', error);
    return NextResponse.json({ error: 'Falha no cálculo do choque customizado' }, { status: 500 });
  }
}
