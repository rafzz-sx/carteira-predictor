// src/app/api/fixed-income/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FixedIncomeService } from '@/domain/finance/fixed-income';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;

    // Load user positions to calculate FGC and portfolio fixed income metrics
    const portfolioRepo = RepositoryFactory.getPortfolioRepository();
    const portfolios = await portfolioRepo.listPortfolios(userId);
    const portfolio = portfolios.find((p) => p.isDefault) || portfolios[0];

    let fgcPositions: Array<{
      issuer: string;
      assetType: 'stock' | 'fii' | 'fiagro' | 'fiinfra' | 'etf_br' | 'fixed_income';
      category?: 'cdb' | 'lci' | 'lca' | 'cri' | 'cra' | 'debenture' | 'tesouro_direto' | 'outros';
      amountCents: number;
    }> = [];

    if (portfolio) {
      const positions = await portfolioRepo.listPositions(portfolio.id);
      fgcPositions = positions.map((p) => {
        let category: 'cdb' | 'lci' | 'lca' | 'cri' | 'cra' | 'debenture' | 'tesouro_direto' | 'outros' = 'outros';
        if (p.assetType === 'fixed_income') {
          if (p.ticker.toUpperCase().includes('TESOURO')) {
            category = 'tesouro_direto';
          } else if (p.ticker.toUpperCase().includes('LCI')) {
            category = 'lci';
          } else if (p.ticker.toUpperCase().includes('LCA')) {
            category = 'lca';
          } else if (p.ticker.toUpperCase().includes('CRI')) {
            category = 'cri';
          } else if (p.ticker.toUpperCase().includes('CRA')) {
            category = 'cra';
          } else {
            category = 'cdb';
          }
        }
        return {
          issuer: p.ticker,
          assetType: p.assetType,
          category,
          amountCents: p.totalInvestedCents,
        };
      });
    }

    // If portfolio has only 1 or 0 fixed income positions, supplement with realistic Brazilian fixed income custody for rich demonstration
    const fixedIncomeCount = fgcPositions.filter((p) => p.assetType === 'fixed_income').length;
    if (fixedIncomeCount <= 1) {
      fgcPositions.push(
        { issuer: 'Banco Inter S.A.', assetType: 'fixed_income', category: 'cdb', amountCents: 12000000 }, // R$ 120.000 (CDB 115% CDI)
        { issuer: 'Itaú Unibanco S.A.', assetType: 'fixed_income', category: 'lca', amountCents: 8500000 }, // R$ 85.000 (LCA 94% CDI)
        { issuer: 'Banco do Brasil S.A.', assetType: 'fixed_income', category: 'lci', amountCents: 6000000 }, // R$ 60.000 (LCI 92% CDI)
        { issuer: 'Tesouro Nacional', assetType: 'fixed_income', category: 'tesouro_direto', amountCents: 14500000 }, // R$ 145.000 (Tesouro IPCA+ 2035)
        { issuer: 'Vale S.A. Infraestrutura', assetType: 'fixed_income', category: 'debenture', amountCents: 4000000 } // R$ 40.000 (Debênture Incentivada)
      );
    }

    const fgcAnalysis = FixedIncomeService.calculateFgcCoverage(fgcPositions);
    const tesouroSecurities = FixedIncomeService.getTesouroSecurities();
    const privateCreditShowcase = FixedIncomeService.getPrivateCreditShowcase();
    const yieldCurve = FixedIncomeService.getYieldCurvePoints();

    // Default 24-month (2 years, 15% IR) comparison for R$ 10.000
    const defaultComparison = FixedIncomeService.compareInstruments({
      amountCents: 1000000,
      termMonths: 24,
      currentCdiPercent: 10.65,
      currentIpcaPercent: 4.42,
    });

    // Default MtM simulation for Tesouro IPCA+ 2035 with a +50 bps rate shift
    const defaultMtm = FixedIncomeService.calculateMarkToMarket({
      security: tesouroSecurities.find((s) => s.id === 'tesouro_ipca_2035') || tesouroSecurities[0],
      investedCents: 1000000,
      purchaseRatePercent: 6.45,
      currentSimulatedRatePercent: 6.95, // +50 bps
      daysElapsed: 365,
      daysTotal: 365 * 10,
    });

    return NextResponse.json({
      success: true,
      macroRates: {
        selicPercent: 10.75,
        cdiPercent: 10.65,
        ipca12mPercent: 4.42,
        realInterestPercent: 6.33, // (1 + 0.1075) / (1 + 0.0442) - 1
        referenceDate: 'Outubro / 2026',
        source: 'Banco Central do Brasil / B3 / IBGE',
        isExample: true,
      },
      yieldCurve,
      tesouroSecurities,
      privateCreditShowcase,
      defaultComparison,
      defaultMtm,
      fgcAnalysis,
    });
  } catch (error) {
    console.error('Error fetching fixed income data:', error);
    return NextResponse.json({ success: false, error: 'Failed to load fixed income data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'compare') {
      const { amountCents, termMonths } = body;
      const comparison = FixedIncomeService.compareInstruments({
        amountCents: Number(amountCents) || 1000000,
        termMonths: Number(termMonths) || 24,
      });
      return NextResponse.json({ success: true, comparison });
    }

    if (action === 'mtm') {
      const {
        securityId,
        investedCents,
        purchaseRatePercent,
        currentSimulatedRatePercent,
        daysElapsed,
        daysTotal,
      } = body;

      const securities = FixedIncomeService.getTesouroSecurities();
      const security = securities.find((s) => s.id === securityId) || securities[0];

      const mtmResult = FixedIncomeService.calculateMarkToMarket({
        security,
        investedCents: Number(investedCents) || 1000000,
        purchaseRatePercent: Number(purchaseRatePercent) || security.baseRatePercent,
        currentSimulatedRatePercent: Number(currentSimulatedRatePercent) || security.baseRatePercent,
        daysElapsed: Number(daysElapsed) || 365,
        daysTotal: Number(daysTotal) || 1825,
      });

      return NextResponse.json({ success: true, mtmResult });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Error in fixed income simulation:', error);
    return NextResponse.json({ success: false, error: 'Simulation failed' }, { status: 500 });
  }
}
