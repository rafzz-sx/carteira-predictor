// src/app/api/portfolio/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { BrazilianAssetGuard } from '@/domain/guards/brazilian-asset-guard';
import { PortfolioMath } from '@/domain/finance/portfolio-math';
import { Transaction, TransactionType } from '@/domain/models/transaction';
import { PortfolioPosition } from '@/domain/models/portfolio';

const DEFAULT_PORTFOLIO_ID = 'demo-portfolio-1';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const portfolioId = request.nextUrl.searchParams.get('portfolioId') || (userId ? `port_${userId}` : DEFAULT_PORTFOLIO_ID);
    const ticker = request.nextUrl.searchParams.get('ticker') || undefined;

    const txRepo = RepositoryFactory.getTransactionRepository();
    const transactions = await txRepo.listTransactions(portfolioId, { ticker });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Falha ao buscar transações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || (body.portfolioId?.startsWith('port_') ? body.portfolioId.replace('port_', '') : 'user_default');
    const portfolioId = body.portfolioId || (userId ? `port_${userId}` : DEFAULT_PORTFOLIO_ID);
    const rawTicker = String(body.ticker || '').trim().toUpperCase();

    // 1. Strict validation via BrazilianAssetGuard
    const validation = BrazilianAssetGuard.validate(rawTicker);
    if (!validation.isAllowed || !validation.assetType) {
      return NextResponse.json(
        { error: validation.rejectionReason || 'Ativo não permitido no mercado nacional brasileiro.' },
        { status: 400 }
      );
    }

    const assetType = validation.assetType;
    const type: TransactionType = body.type || 'buy';
    const quantity = Math.abs(Number(body.quantity) || 0);
    const unitPriceCents = Math.max(0, Number(body.unitPriceCents) || 0);
    const totalCostsCents = Math.max(0, Number(body.totalCostsCents) || 0);
    const tradeDate = body.tradeDate || new Date().toISOString().slice(0, 10);

    if (quantity <= 0 && type !== 'dividend' && type !== 'jcp') {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero.' }, { status: 400 });
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

    // 2. Save transaction
    const totalAmountCents =
      type === 'buy'
        ? Math.round(quantity * unitPriceCents) + totalCostsCents
        : Math.round(quantity * unitPriceCents) - totalCostsCents;

    const transaction: Transaction = {
      id: body.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      portfolioId,
      userId,
      ticker: rawTicker,
      assetType,
      type,
      tradeDate,
      quantity,
      unitPriceCents,
      totalCostsCents,
      totalAmountCents,
      notes: body.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    await txRepo.addTransaction(transaction);

    // 3. Recalculate custody and average price if buy, sell, or split
    let updatedPosition: PortfolioPosition | null = null;

    if (type === 'buy' || type === 'sell' || type === 'split') {
      const positions = await portfolioRepo.listPositions(portfolioId);
      const existing = positions.find((p) => p.ticker === rawTicker) || {
        id: `pos_${portfolioId}_${rawTicker.replace(/\s+/g, '_')}`,
        portfolioId,
        ticker: rawTicker,
        assetType,
        quantity: 0,
        averagePriceCents: 0,
        totalInvestedCents: 0,
        updatedAt: new Date().toISOString(),
      };

      if (type === 'buy') {
        const nextState = PortfolioMath.applyBuy(
          {
            ticker: existing.ticker,
            quantity: existing.quantity,
            averagePriceCents: existing.averagePriceCents,
            totalInvestedCents: existing.totalInvestedCents,
          },
          quantity,
          unitPriceCents,
          totalCostsCents
        );

        updatedPosition = {
          ...existing,
          ...nextState,
          updatedAt: new Date().toISOString(),
        };
        await portfolioRepo.savePosition(updatedPosition);
      } else if (type === 'sell') {
        const { updatedPosition: nextState } = PortfolioMath.applySell(
          {
            ticker: existing.ticker,
            quantity: existing.quantity,
            averagePriceCents: existing.averagePriceCents,
            totalInvestedCents: existing.totalInvestedCents,
          },
          quantity,
          unitPriceCents,
          totalCostsCents
        );

        if (nextState.quantity <= 0) {
          await portfolioRepo.deletePosition(existing.id);
          updatedPosition = null;
        } else {
          updatedPosition = {
            ...existing,
            ...nextState,
            updatedAt: new Date().toISOString(),
          };
          await portfolioRepo.savePosition(updatedPosition);
        }
      } else if (type === 'split') {
        const ratio = Number(body.splitRatio) || 2;
        const nextState = PortfolioMath.applySplit(
          {
            ticker: existing.ticker,
            quantity: existing.quantity,
            averagePriceCents: existing.averagePriceCents,
            totalInvestedCents: existing.totalInvestedCents,
          },
          ratio
        );
        updatedPosition = {
          ...existing,
          ...nextState,
          updatedAt: new Date().toISOString(),
        };
        await portfolioRepo.savePosition(updatedPosition);
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
      position: updatedPosition,
    });
  } catch (error) {
    console.error('Error saving transaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao registrar transação' },
      { status: 500 }
    );
  }
}
