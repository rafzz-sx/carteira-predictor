// src/app/api/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { MarketDataService } from '@/lib/market-data';

const DEFAULT_USER_ID = 'user_default';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;

    const portfolioRepo = RepositoryFactory.getPortfolioRepository();
    const portfolios = await portfolioRepo.listPortfolios(userId);

    let portfolio = portfolios.find((p) => p.isDefault) || portfolios[0];

    // Auto-create default empty portfolio if none exists for this user
    if (!portfolio) {
      portfolio = {
        id: `port_${userId}`,
        userId,
        name: 'Carteira Principal',
        isDefault: true,
        targetAllocations: {
          stocksPct: 4000,
          fiisPct: 3500,
          fixedIncomePct: 2000,
          cashReservePct: 500,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await portfolioRepo.savePortfolio(portfolio);
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

    if (totalCurrentGrossCents > 0) {
      positions.forEach((p) => {
        if (allocationByClass[p.assetType] !== undefined) {
          allocationByClass[p.assetType] += p.currentGrossCents;
        }
      });
    }

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
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
