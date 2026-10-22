// src/app/api/tax/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/domain/finance/tax-calculator';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { Transaction } from '@/domain/models/transaction';

const DEFAULT_USER_ID = 'demo-user-1';

// Sample transactions across 2026 demonstrating all RFB tax rules
const SAMPLE_TAX_TRANSACTIONS: Transaction[] = [
  // Jan/2026: Compra inicial de PETR4 e VALE3
  {
    id: 'tx_jan_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'PETR4',
    assetType: 'stock',
    type: 'buy',
    tradeDate: '2026-01-10',
    quantity: 300,
    unitPriceCents: 3450,
    totalCostsCents: 500,
    totalAmountCents: 1035000,
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'tx_jan_2',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'VALE3',
    assetType: 'stock',
    type: 'buy',
    tradeDate: '2026-01-15',
    quantity: 150,
    unitPriceCents: 6520,
    totalCostsCents: 500,
    totalAmountCents: 978000,
    createdAt: '2026-01-15T11:00:00Z',
  },
  // Fev/2026: Venda isenta de ações (< R$ 20.000) com lucro
  {
    id: 'tx_fev_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'PETR4',
    assetType: 'stock',
    type: 'sell',
    tradeDate: '2026-02-18',
    quantity: 100,
    unitPriceCents: 3820,
    totalCostsCents: 200,
    totalAmountCents: 382000, // R$ 3.820,00 (< R$ 20k)
    createdAt: '2026-02-18T14:30:00Z',
  },
  // Mar/2026: Venda de FII (sem isenção de R$ 20k, 20% IR)
  {
    id: 'tx_mar_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'HGLG11',
    assetType: 'fii',
    type: 'sell',
    tradeDate: '2026-03-22',
    quantity: 20,
    unitPriceCents: 16500,
    totalCostsCents: 300,
    totalAmountCents: 330000,
    createdAt: '2026-03-22T15:00:00Z',
  },
  // Abr/2026: Prejuízo em ações (venda abaixo do PM)
  {
    id: 'tx_abr_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'VALE3',
    assetType: 'stock',
    type: 'sell',
    tradeDate: '2026-04-14',
    quantity: 50,
    unitPriceCents: 5900,
    totalCostsCents: 200,
    totalAmountCents: 295000,
    createdAt: '2026-04-14T11:20:00Z',
  },
  // Mai/2026: Venda tributável de ações (> R$ 20.000) compensando prejuízo de Abril
  {
    id: 'tx_mai_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'PETR4',
    assetType: 'stock',
    type: 'sell',
    tradeDate: '2026-05-20',
    quantity: 600,
    unitPriceCents: 3900,
    totalCostsCents: 800,
    totalAmountCents: 2340000, // R$ 23.400,00 (> R$ 20.000!)
    createdAt: '2026-05-20T16:00:00Z',
  },
  // Jun/2026: Venda pequena de FII gerando imposto < R$ 10,00 (acumula para Julho)
  {
    id: 'tx_jun_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'KNCR11',
    assetType: 'fii',
    type: 'sell',
    tradeDate: '2026-06-12',
    quantity: 5,
    unitPriceCents: 10400,
    totalCostsCents: 50,
    totalAmountCents: 52000,
    createdAt: '2026-06-12T10:15:00Z',
  },
  // Jul/2026: Mais um lucro de FII que faz o DARF superar R$ 10,00
  {
    id: 'tx_jul_1',
    portfolioId: 'demo-portfolio-1',
    userId: 'demo-user-1',
    ticker: 'KNCR11',
    assetType: 'fii',
    type: 'sell',
    tradeDate: '2026-07-25',
    quantity: 25,
    unitPriceCents: 10500,
    totalCostsCents: 150,
    totalAmountCents: 262500,
    createdAt: '2026-07-25T14:45:00Z',
  },
];

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

    // Merge or fallback to realistic tax transactions if user has no sell transactions
    const hasSells = userTxs.some((t) => t.type === 'sell');
    const effectiveTxs = hasSells ? userTxs : SAMPLE_TAX_TRANSACTIONS;

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
