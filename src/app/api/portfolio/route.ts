// src/app/api/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { PortfolioPosition } from '@/domain/models/portfolio';
import { MarketDataService } from '@/lib/market-data';

const DEFAULT_USER_ID = 'demo-user-1';
const DEFAULT_PORTFOLIO_ID = 'demo-portfolio-1';

// Seed demo positions if portfolio is empty
const INITIAL_DEMO_POSITIONS: Omit<PortfolioPosition, 'id' | 'portfolioId' | 'updatedAt'>[] = [
  { ticker: 'PETR4', assetType: 'stock', quantity: 300, averagePriceCents: 3450, totalInvestedCents: 1035000 },
  { ticker: 'VALE3', assetType: 'stock', quantity: 150, averagePriceCents: 6520, totalInvestedCents: 978000 },
  { ticker: 'ITUB4', assetType: 'stock', quantity: 400, averagePriceCents: 3210, totalInvestedCents: 1284000 },
  { ticker: 'WEGE3', assetType: 'stock', quantity: 100, averagePriceCents: 4850, totalInvestedCents: 485000 },
  { ticker: 'TAEE11', assetType: 'stock', quantity: 200, averagePriceCents: 3540, totalInvestedCents: 708000 },
  { ticker: 'HGLG11', assetType: 'fii', quantity: 80, averagePriceCents: 15820, totalInvestedCents: 1265600 },
  { ticker: 'KNCR11', assetType: 'fii', quantity: 120, averagePriceCents: 10140, totalInvestedCents: 1216800 },
  { ticker: 'XPLG11', assetType: 'fii', quantity: 70, averagePriceCents: 10230, totalInvestedCents: 716100 },
  { ticker: 'VGIA11', assetType: 'fiagro', quantity: 500, averagePriceCents: 960, totalInvestedCents: 480000 },
  { ticker: 'JURO11', assetType: 'fiinfra', quantity: 60, averagePriceCents: 10020, totalInvestedCents: 601200 },
  { ticker: 'BOVA11', assetType: 'etf_br', quantity: 50, averagePriceCents: 12150, totalInvestedCents: 607500 },
  { ticker: 'TESOURO SELIC 2029', assetType: 'fixed_income', quantity: 5, averagePriceCents: 1450000, totalInvestedCents: 7250000 },
];

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;

    const portfolioRepo = RepositoryFactory.getPortfolioRepository();
    const portfolios = await portfolioRepo.listPortfolios(userId);

    let portfolio = portfolios.find((p) => p.isDefault) || portfolios[0];

    // Auto-create default portfolio and seed positions if none exist
    if (!portfolio) {
      portfolio = {
        id: DEFAULT_PORTFOLIO_ID,
        userId,
        name: 'Carteira Principal',
        isDefault: true,
        targetAllocations: {
          stocksPct: 3500,
          fiisPct: 4000,
          fixedIncomePct: 2000,
          cashReservePct: 500,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await portfolioRepo.savePortfolio(portfolio);

      for (const seed of INITIAL_DEMO_POSITIONS) {
        await portfolioRepo.savePosition({
          ...seed,
          id: `pos_${portfolio.id}_${seed.ticker.replace(/\s+/g, '_')}`,
          portfolioId: portfolio.id,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const rawPositions = await portfolioRepo.listPositions(portfolio.id);

    // Compute valuations with MarketDataService
    let totalInvestedCents = 0;
    let totalCurrentGrossCents = 0;

    const enrichedPositions = rawPositions.map((pos) => {
      const quote = MarketDataService.getQuote(pos.ticker);
      const currentGrossCents = Math.round(pos.quantity * quote.priceCents);
      const gainLossCents = currentGrossCents - pos.totalInvestedCents;
      const gainLossPercent =
        pos.totalInvestedCents > 0
          ? ((currentGrossCents - pos.totalInvestedCents) / pos.totalInvestedCents) * 100
          : 0;

      totalInvestedCents += pos.totalInvestedCents;
      totalCurrentGrossCents += currentGrossCents;

      return {
        ...pos,
        quote,
        currentGrossCents,
        gainLossCents,
        gainLossPercent: Number(gainLossPercent.toFixed(2)),
      };
    });

    // Compute portfolio weights
    const positions = enrichedPositions.map((p) => ({
      ...p,
      weightPercent:
        totalCurrentGrossCents > 0
          ? Number(((p.currentGrossCents / totalCurrentGrossCents) * 100).toFixed(2))
          : 0,
    }));

    // Calculate allocation breakdown
    const allocationByClass = {
      stock: 0,
      fii: 0,
      fiagro: 0,
      fiinfra: 0,
      etf_br: 0,
      fixed_income: 0,
    };

    positions.forEach((p) => {
      if (allocationByClass[p.assetType] !== undefined) {
        allocationByClass[p.assetType] += p.currentGrossCents;
      }
    });

    const totalGainLossCents = totalCurrentGrossCents - totalInvestedCents;
    const totalGainLossPercent =
      totalInvestedCents > 0
        ? Number(((totalGainLossCents / totalInvestedCents) * 100).toFixed(2))
        : 0;

    return NextResponse.json({
      portfolio,
      positions,
      summary: {
        totalInvestedCents,
        totalCurrentGrossCents,
        totalGainLossCents,
        totalGainLossPercent,
        positionCount: positions.length,
        allocationByClass,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar carteira de investimentos' },
      { status: 500 }
    );
  }
}
