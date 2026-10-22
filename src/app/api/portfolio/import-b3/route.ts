// src/app/api/portfolio/import-b3/route.ts
import { NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { parseB3Statement } from '@/domain/finance/b3-importer';
import { PortfolioMath } from '@/domain/finance/portfolio-math';
import { Transaction } from '@/domain/models/transaction';
import { PortfolioPosition } from '@/domain/models/portfolio';

const DEFAULT_PORTFOLIO_ID = 'demo-portfolio-1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const csvContent = body.csvContent;
    const isDryRun = Boolean(body.dryRun);
    const userId = body.userId || (body.portfolioId?.startsWith('port_') ? body.portfolioId.replace('port_', '') : 'user_default');
    const portfolioId = body.portfolioId || (userId ? `port_${userId}` : DEFAULT_PORTFOLIO_ID);

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Conteúdo do extrato não fornecido.' }, { status: 400 });
    }

    // 1. Parse statement
    const parseResult = parseB3Statement(csvContent);

    if (!parseResult.success || parseResult.transactions.length === 0) {
      return NextResponse.json({
        success: false,
        error: parseResult.errors[0] || 'Nenhuma transação válida da B3 encontrada no arquivo.',
        ignoredAssets: parseResult.ignoredAssets,
      }, { status: 400 });
    }

    // If dry run, return preview only
    if (isDryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        preview: {
          totalTrades: parseResult.transactions.length,
          uniqueTickers: parseResult.uniqueTickers,
          totalVolumeCents: parseResult.totalVolumeCents,
          transactions: parseResult.transactions.slice(0, 10), // sample
          ignoredAssets: parseResult.ignoredAssets,
        },
      });
    }

    const txRepo = RepositoryFactory.getTransactionRepository();
    const portfolioRepo = RepositoryFactory.getPortfolioRepository();

    const existingPortfolio = await portfolioRepo.getPortfolio(userId, portfolioId);
    if (!existingPortfolio) {
      await portfolioRepo.savePortfolio({
        id: portfolioId,
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
      });
    }

    // Group transactions by ticker
    const tradesByTicker: Record<string, typeof parseResult.transactions> = {};
    for (const t of parseResult.transactions) {
      if (!tradesByTicker[t.ticker]) tradesByTicker[t.ticker] = [];
      tradesByTicker[t.ticker].push(t);
    }

    // Save each transaction
    for (const t of parseResult.transactions) {
      const tx: Transaction = {
        id: `tx_b3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        portfolioId,
        userId,
        ticker: t.ticker,
        assetType: t.assetType,
        type: t.type,
        tradeDate: t.tradeDate,
        quantity: t.quantity,
        unitPriceCents: t.unitPriceCents,
        totalCostsCents: t.totalCostsCents,
        totalAmountCents: t.totalAmountCents,
        notes: t.notes,
        createdAt: new Date().toISOString(),
      };
      await txRepo.addTransaction(tx);
    }

    // Recompute positions for all affected tickers
    const existingPositions = await portfolioRepo.listPositions(portfolioId);

    for (const ticker of Object.keys(tradesByTicker)) {
      const trades = tradesByTicker[ticker];
      const assetType = trades[0].assetType;

      let positionState = {
        ticker,
        quantity: 0,
        averagePriceCents: 0,
        totalInvestedCents: 0,
      };

      const existing = existingPositions.find((p) => p.ticker === ticker);
      if (existing) {
        positionState = {
          ticker: existing.ticker,
          quantity: existing.quantity,
          averagePriceCents: existing.averagePriceCents,
          totalInvestedCents: existing.totalInvestedCents,
        };
      }

      for (const trade of trades) {
        if (trade.type === 'buy') {
          positionState = PortfolioMath.applyBuy(
            positionState,
            trade.quantity,
            trade.unitPriceCents,
            trade.totalCostsCents
          );
        } else if (trade.type === 'sell' && positionState.quantity >= trade.quantity) {
          const { updatedPosition } = PortfolioMath.applySell(
            positionState,
            trade.quantity,
            trade.unitPriceCents,
            trade.totalCostsCents
          );
          positionState = updatedPosition;
        }
      }

      const updatedPosition: PortfolioPosition = {
        id: existing?.id || `pos_${portfolioId}_${ticker.replace(/\s+/g, '_')}`,
        portfolioId,
        ticker,
        assetType,
        quantity: positionState.quantity,
        averagePriceCents: positionState.averagePriceCents,
        totalInvestedCents: positionState.totalInvestedCents,
        updatedAt: new Date().toISOString(),
      };

      if (updatedPosition.quantity > 0) {
        await portfolioRepo.savePosition(updatedPosition);
      } else if (existing) {
        await portfolioRepo.deletePosition(existing.id);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: parseResult.transactions.length,
      ignoredCount: parseResult.ignoredAssets.length,
      ignoredAssets: parseResult.ignoredAssets,
      totalVolumeCents: parseResult.totalVolumeCents,
    });
  } catch (error) {
    console.error('Error importing B3 statement:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao importar extrato B3' },
      { status: 500 }
    );
  }
}
