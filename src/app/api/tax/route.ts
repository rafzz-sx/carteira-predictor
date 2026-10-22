// src/app/api/tax/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/domain/finance/tax-calculator';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { Transaction } from '@/domain/models/transaction';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;
    const year = parseInt(request.nextUrl.searchParams.get('year') || '2026', 10);

    const portfolioRepo = RepositoryFactory.getPortfolioRepository();
    const portfolios = await portfolioRepo.listPortfolios(userId);
    const portfolio = portfolios.find((p) => p.isDefault) || portfolios[0];

    const txRepo = RepositoryFactory.getTransactionRepository();
    let userTxs: Transaction[] = [];

    if (portfolio) {
      userTxs = await txRepo.listTransactions(portfolio.id);
    }

    // Do NOT inject sample transactions; if user has no transactions, calculate taxes on empty array
    const effectiveTxs = userTxs;

    const auditResult = TaxCalculator.auditAnnualTax(year, effectiveTxs, {
      stockLossCents: 0,
      fiiLossCents: 0,
      dayTradeLossCents: 0,
    });

    return NextResponse.json({
      success: true,
      year,
      auditResult,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error calculating taxes:', error);
    return NextResponse.json({ success: false, error: 'Failed to audit taxes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'simulate_sale') {
      const {
        ticker,
        assetType,
        quantityToSell,
        estimatedUnitPriceCents,
        averageCostCents,
        monthCurrentSalesCents,
        accumulatedLossCents,
      } = body;

      const simulation = TaxCalculator.simulateSaleTaxImpact({
        ticker: ticker || 'PETR4',
        assetType: assetType || 'stock',
        quantityToSell: Number(quantityToSell) || 100,
        estimatedUnitPriceCents: Number(estimatedUnitPriceCents) || 3800,
        averageCostCents: Number(averageCostCents) || 3450,
        monthCurrentSalesCents: Number(monthCurrentSalesCents) || 0,
        accumulatedLossCents: Number(accumulatedLossCents) || 0,
      });

      return NextResponse.json({ success: true, simulation });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in tax simulation:', error);
    return NextResponse.json({ success: false, error: 'Tax simulation failed' }, { status: 500 });
  }
}
