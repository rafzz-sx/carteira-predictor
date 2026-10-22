// src/domain/finance/fixed-income.ts
// Domain module for Brazilian Fixed Income (Renda Fixa Brasileira).
// Covers Tesouro Direto (Selic, Prefixado, IPCA+, RendA+, Educa+),
// Mark-to-Market (Marcação a Mercado / MtM) engine, Duration & Convexity,
// Private credit instruments (CDB, LCI, LCA, CRI, CRA, Debêntures Incentivadas),
// Brazilian progressive/regressive income tax rules (Tabela Regressiva da RFB),
// and FGC (Fundo Garantidor de Créditos) coverage thermometer.

export type TesouroType = 'selic' | 'prefixado' | 'ipca' | 'renda_mais' | 'educa_mais';

export interface TesouroDirectSecurity {
  id: string;
  name: string;
  type: TesouroType;
  maturityDate: string; // YYYY-MM-DD
  annualRateDescription: string; // e.g. "Selic + 0,08%", "12,15% a.a.", "IPCA + 6,45%"
  baseRatePercent: number; // For prefixado or the spread for Selic/IPCA
  currentUnitPriceCents: number; // Preço Unitário (PU) em centavos
  minInvestmentCents: number; // Valor mínimo de aplicação (~1% do PU ou R$ 30)
  modifiedDurationYears: number; // Duration modificada em anos
  convexity: number; // Convexidade aproximada
  hasSemiannualCoupon: boolean;
  benchmark: 'SELIC' | 'IPCA' | 'PREFIXADO';
  description: string;
}

export interface PrivateCreditInstrument {
  id: string;
  issuer: string;
  category: 'cdb' | 'lci' | 'lca' | 'cri' | 'cra' | 'debenture_incentivada';
  indexer: 'cdi' | 'prefixado' | 'ipca';
  contractedRateDescription: string; // e.g. "118% do CDI", "12,40% a.a.", "IPCA + 7,20%"
  ratePercent: number; // e.g. 118 for % CDI, 12.4 for prefixado, 7.2 for IPCA spread
  termDays: number;
  maturityDate: string;
  isTaxExempt: boolean; // true para LCI, LCA, CRI, CRA, Debêntures Incentivadas
  hasFgcGuarantee: boolean; // true para CDB, LCI, LCA; false para CRI, CRA, Debêntures
  creditRating: string; // e.g. "AAA (br)", "AA+ (br)"
  minInvestmentCents: number;
  description: string;
}

export interface YieldCurvePoint {
  vertex: string; // e.g. "DI 1 Ano (2027)", "DI 2 Anos (2028)"
  maturityYear: number;
  ratePercent: number; // e.g. 11.25%
  changeBps1D: number; // bps change
}

export interface MarkToMarketSimulationResult {
  securityId: string;
  securityName: string;
  investedCents: number;
  purchaseDate: string;
  maturityDate: string;
  purchaseRatePercent: number;
  currentSimulatedRatePercent: number;
  rateDeltaBps: number; // current - purchase in bps
  daysElapsed: number;
  daysRemaining: number;
  
  // At maturity (Carregar até o vencimento)
  valueAtMaturityGrossCents: number;
  profitAtMaturityGrossCents: number;
  annualizedReturnAtMaturityPercent: number;
  
  // Today's early exit (Resgate antecipado a mercado)
  curveAccrualGrossCents: number; // Valor pela curva do papel (juros acumulados sem MtM)
  marketExitGrossCents: number; // Valor de venda antecipada a mercado (com ágio/deságio)
  mtmGainLossCents: number; // Diferença entre saída a mercado e curva teórica
  mtmGainLossPercent: number; // Impacto percentual da MtM
  
  // Taxes on early exit
  applicableTaxRatePercent: number; // Tabela regressiva
  marketExitNetCents: number; // Valor líquido de IR se resgatado hoje
  
  // Duration & Sensitivity metrics
  modifiedDurationYears: number;
  priceSensitivityPer100Bps: number; // Variação estimada do PU para cada 100 bps de variação na taxa
  
  // Pedagogical analysis
  diagnosis: 'agio' | 'desagio' | 'neutro';
  verdictText: string;
}

export interface InvestmentComparisonItem {
  id: string;
  title: string;
  issuerOrCategory: string;
  isTaxExempt: boolean;
  hasFgc: boolean;
  grossAmountCents: number;
  grossProfitCents: number;
  taxRatePercent: number;
  taxAmountCents: number;
  netAmountCents: number;
  netProfitCents: number;
  netAnnualYieldPercent: number;
  equivalentGrossPercent: number; // For tax-exempt: gross CDI % equivalent
  badge: string;
}

export interface FgcIssuerGroup {
  issuer: string;
  instrumentsCount: number;
  totalInvestedCents: number;
  coveredCents: number;
  excessCents: number;
  coverageRatioPercent: number;
  status: 'safe' | 'warning' | 'danger'; // safe: < 80% (R$ 200k), warning: 80-100%, danger: > 100% (> R$ 250k)
}

export interface FgcAnalysisResult {
  totalPrivateCreditCents: number;
  totalSovereignTreasuryCents: number; // 100% guaranteed by National Treasury (unlimited, no FGC ceiling)
  totalExemptOrUncoveredCents: number; // CRI, CRA, Debêntures (no FGC)
  totalFgcEligibleCents: number; // CDB, LCI, LCA
  totalCoveredByFgcCents: number;
  totalExcessAboveFgcCents: number; // Amount at bank risk above R$ 250k limit
  globalFgcUtilizationPercent: number; // Relative to R$ 1.000.000 global ceiling
  issuers: FgcIssuerGroup[];
  isFullyProtected: boolean;
  recommendations: string[];
}

export class FixedIncomeService {
  // Brazilian Regressive Income Tax Table for Fixed Income (Tabela Regressiva da Receita Federal)
  // Até 180 dias: 22,5%
  // De 181 a 360 dias: 20,0%
  // De 361 a 720 dias: 17,5%
  // Acima de 720 dias: 15,0%
  static getRegressiveTaxRate(days: number): number {
    if (days <= 180) return 22.5;
    if (days <= 360) return 20.0;
    if (days <= 720) return 17.5;
    return 15.0;
  }

  // Calculate gross equivalent rate for tax-exempt instruments (LCI/LCA/CRI/CRA/Debêntures)
  // Equivalent = exemptRate / (1 - taxRate)
  // Example: 90% do CDI in LCI for 2 years (tax 15%) => 90 / (1 - 0.15) = 105.88% do CDI!
  static calculateEquivalentGrossRate(exemptRatePercent: number, termDays: number): number {
    const taxRate = this.getRegressiveTaxRate(termDays) / 100;
    if (taxRate >= 1) return exemptRatePercent;
    return Number((exemptRatePercent / (1 - taxRate)).toFixed(2));
  }

  // Baseline B3 Curva de Juros (ETTJ - Estrutura a Termo da Taxa de Juros)
  static getYieldCurvePoints(): YieldCurvePoint[] {
    return [
      { vertex: 'DI 1 Ano (2027)', maturityYear: 2027, ratePercent: 11.45, changeBps1D: -4 },
      { vertex: 'DI 2 Anos (2028)', maturityYear: 2028, ratePercent: 11.60, changeBps1D: -2 },
      { vertex: 'DI 3 Anos (2029)', maturityYear: 2029, ratePercent: 11.85, changeBps1D: +1 },
      { vertex: 'DI 5 Anos (2031)', maturityYear: 2031, ratePercent: 12.10, changeBps1D: +3 },
      { vertex: 'DI 10 Anos (2036)', maturityYear: 2036, ratePercent: 12.35, changeBps1D: +5 },
    ];
  }

  // Official Tesouro Direto securities catalogue (B3 Reference October 2026)
  static getTesouroSecurities(): TesouroDirectSecurity[] {
    return [
      {
        id: 'tesouro_selic_2029',
        name: 'Tesouro Selic 2029',
        type: 'selic',
        maturityDate: '2029-03-01',
        annualRateDescription: 'Selic + 0,085%',
        baseRatePercent: 0.085,
        currentUnitPriceCents: 1485000, // R$ 14.850,00
        minInvestmentCents: 14850, // R$ 148,50 (1%)
        modifiedDurationYears: 0.15,
        convexity: 0.02,
        hasSemiannualCoupon: false,
        benchmark: 'SELIC',
        description: 'Pós-fixado indexado à Taxa Selic com liquidez D+1. Ideal para reserva de emergência e caixa sem oscilação negativa de marcação a mercado.',
      },
      {
        id: 'tesouro_prefixado_2029',
        name: 'Tesouro Prefixado 2029',
        type: 'prefixado',
        maturityDate: '2029-01-01',
        annualRateDescription: '11,85% a.a.',
        baseRatePercent: 11.85,
        currentUnitPriceCents: 78540, // R$ 785,40
        minInvestmentCents: 3141, // R$ 31,41
        modifiedDurationYears: 2.1,
        convexity: 6.8,
        hasSemiannualCoupon: false,
        benchmark: 'PREFIXADO',
        description: 'Rentabilidade prefixada garantida no vencimento (R$ 1.000 por título). Sujeito à marcação a mercado com oscilação moderada antes da data final.',
      },
      {
        id: 'tesouro_prefixado_2031',
        name: 'Tesouro Prefixado 2031',
        type: 'prefixado',
        maturityDate: '2031-01-01',
        annualRateDescription: '12,10% a.a.',
        baseRatePercent: 12.10,
        currentUnitPriceCents: 61520, // R$ 615,20
        minInvestmentCents: 3076, // R$ 30,76
        modifiedDurationYears: 3.8,
        convexity: 18.5,
        hasSemiannualCoupon: false,
        benchmark: 'PREFIXADO',
        description: 'Título prefixado de médio prazo. Se a curva de juros ceder, oferece excelente oportunidade de ganho antecipado via marcação a mercado.',
      },
      {
        id: 'tesouro_ipca_2029',
        name: 'Tesouro IPCA+ 2029',
        type: 'ipca',
        maturityDate: '2029-05-15',
        annualRateDescription: 'IPCA + 6,28% a.a.',
        baseRatePercent: 6.28,
        currentUnitPriceCents: 328000, // R$ 3.280,00
        minInvestmentCents: 3280, // R$ 32,80
        modifiedDurationYears: 2.4,
        convexity: 8.2,
        hasSemiannualCoupon: false,
        benchmark: 'IPCA',
        description: 'Proteção total contra a inflação medida pelo IPCA mais juro real garantido. Volatilidade contida pelo prazo intermediário.',
      },
      {
        id: 'tesouro_ipca_2035',
        name: 'Tesouro IPCA+ 2035',
        type: 'ipca',
        maturityDate: '2035-05-15',
        annualRateDescription: 'IPCA + 6,45% a.a.',
        baseRatePercent: 6.45,
        currentUnitPriceCents: 215000, // R$ 2.150,00
        minInvestmentCents: 4300, // R$ 43,00
        modifiedDurationYears: 7.2,
        convexity: 62.0,
        hasSemiannualCoupon: false,
        benchmark: 'IPCA',
        description: 'Equilíbrio ideal entre poder de compra de longo prazo e juro real robusto. Se mantido até 2035, garante ganho real sobre o IPCA sem risco de perda.',
      },
      {
        id: 'tesouro_ipca_2045',
        name: 'Tesouro IPCA+ 2045',
        type: 'ipca',
        maturityDate: '2045-05-15',
        annualRateDescription: 'IPCA + 6,55% a.a.',
        baseRatePercent: 6.55,
        currentUnitPriceCents: 112000, // R$ 1.120,00
        minInvestmentCents: 3360, // R$ 33,60
        modifiedDurationYears: 13.8,
        convexity: 220.0,
        hasSemiannualCoupon: false,
        benchmark: 'IPCA',
        description: 'Tricampeão de sensibilidade: duration longa de ~14 anos. Oscila expressivamente no curto prazo com a curva de juros, mas garante poder de compra multiplicado até 2045.',
      },
      {
        id: 'tesouro_renda_mais_2060',
        name: 'Tesouro RendA+ 2060',
        type: 'renda_mais',
        maturityDate: '2060-01-01',
        annualRateDescription: 'IPCA + 6,40% a.a.',
        baseRatePercent: 6.40,
        currentUnitPriceCents: 39500, // R$ 395,00
        minInvestmentCents: 3950, // R$ 39,50
        modifiedDurationYears: 18.0,
        convexity: 380.0,
        hasSemiannualCoupon: false,
        benchmark: 'IPCA',
        description: 'Previdência complementar pública: fase de acumulação até 2059 e conversão automática em 240 parcelas mensais (20 anos) com proteção anti-inflação.',
      },
    ];
  }

  // Private credit instruments catalogue (B3 & ANBIMA Reference)
  static getPrivateCreditShowcase(): PrivateCreditInstrument[] {
    return [
      {
        id: 'cdb_inter_115_cdi',
        issuer: 'Banco Inter S.A.',
        category: 'cdb',
        indexer: 'cdi',
        contractedRateDescription: '115% do CDI',
        ratePercent: 115,
        termDays: 730,
        maturityDate: '2028-10-20',
        isTaxExempt: false,
        hasFgcGuarantee: true,
        creditRating: 'AAA (br)',
        minInvestmentCents: 10000, // R$ 100,00
        description: 'CDB pós-fixado de banco digital de primeira linha com garantia integral do FGC até R$ 250 mil.',
      },
      {
        id: 'cdb_daycoval_118_cdi',
        issuer: 'Banco Daycoval S.A.',
        category: 'cdb',
        indexer: 'cdi',
        contractedRateDescription: '118% do CDI',
        ratePercent: 118,
        termDays: 1080,
        maturityDate: '2029-10-15',
        isTaxExempt: false,
        hasFgcGuarantee: true,
        creditRating: 'AAA (br)',
        minInvestmentCents: 100000, // R$ 1.000,00
        description: 'CDB com remuneração acima da média do mercado para prazos de 3 anos, coberto pelo FGC.',
      },
      {
        id: 'lci_bb_92_cdi',
        issuer: 'Banco do Brasil S.A.',
        category: 'lci',
        indexer: 'cdi',
        contractedRateDescription: '92% do CDI',
        ratePercent: 92,
        termDays: 730,
        maturityDate: '2028-10-20',
        isTaxExempt: true,
        hasFgcGuarantee: true,
        creditRating: 'AAA (br)',
        minInvestmentCents: 50000, // R$ 500,00
        description: 'Isenta de IRPF para Pessoa Física. 92% do CDI equivale a um CDB de 108,2% do CDI com alíquota de 15% de IR.',
      },
      {
        id: 'lca_itau_94_cdi',
        issuer: 'Itaú Unibanco S.A.',
        category: 'lca',
        indexer: 'cdi',
        contractedRateDescription: '94% do CDI',
        ratePercent: 94,
        termDays: 1080,
        maturityDate: '2029-10-15',
        isTaxExempt: true,
        hasFgcGuarantee: true,
        creditRating: 'AAA (br)',
        minInvestmentCents: 100000, // R$ 1.000,00
        description: 'LCA do maior banco privado do país com lastro no agronegócio e isenção tributária para PF.',
      },
      {
        id: 'deb_vale_ipca_710',
        issuer: 'Vale S.A. / Ferrovia Norte-Sul',
        category: 'debenture_incentivada',
        indexer: 'ipca',
        contractedRateDescription: 'IPCA + 7,10% a.a.',
        ratePercent: 7.10,
        termDays: 1825,
        maturityDate: '2031-10-15',
        isTaxExempt: true,
        hasFgcGuarantee: false,
        creditRating: 'AAA (br)',
        minInvestmentCents: 100000, // R$ 1.000,00
        description: 'Debênture incentivada (Lei 12.431/11) com isenção total de IR para PF. Sem cobertura do FGC (risco de crédito corporativo Vale).',
      },
      {
        id: 'cra_jbs_cdi_110',
        issuer: 'JBS S.A. (Securitizadora)',
        category: 'cra',
        indexer: 'cdi',
        contractedRateDescription: 'CDI + 1,25% a.a.',
        ratePercent: 110,
        termDays: 1460,
        maturityDate: '2030-10-15',
        isTaxExempt: true,
        hasFgcGuarantee: false,
        creditRating: 'AA+ (br)',
        minInvestmentCents: 100000, // R$ 1.000,00
        description: 'Certificado de Recebíveis do Agronegócio isento de IR. Lastreado em recebíveis de produtores rurais.',
      },
    ];
  }

  // Mark-to-Market (MtM) calculation engine
  // Calculates early exit price vs holding to maturity
  // Approximation using Modified Duration and Convexity:
  // dPU% = -D_mod * dY + 0.5 * Convexity * (dY)^2
  static calculateMarkToMarket(params: {
    security: TesouroDirectSecurity;
    investedCents: number;
    purchaseRatePercent: number; // e.g. 11.5
    currentSimulatedRatePercent: number; // e.g. 12.5 (aumento de 100 bps)
    daysElapsed: number; // dias corridos desde a compra
    daysTotal: number; // prazo total do papel em dias
  }): MarkToMarketSimulationResult {
    const {
      security,
      investedCents,
      purchaseRatePercent,
      currentSimulatedRatePercent,
      daysElapsed,
      daysTotal,
    } = params;

    const daysRemaining = Math.max(0, daysTotal - daysElapsed);
    const yearsElapsed = daysElapsed / 365.25;
    const yearsRemaining = daysRemaining / 365.25;
    const rateDeltaPercent = (currentSimulatedRatePercent - purchaseRatePercent);
    const rateDeltaBps = Math.round(rateDeltaPercent * 100);
    const dY = rateDeltaPercent / 100; // in decimals

    // 1. Accrual along original contracted curve (Curva do Papel)
    // Value if held to current date under contracted rate
    const purchaseRateDecimal = purchaseRatePercent / 100;
    const curveAccrualMultiplier = Math.pow(1 + purchaseRateDecimal, yearsElapsed);
    const curveAccrualGrossCents = Math.round(investedCents * curveAccrualMultiplier);

    // 2. Value at maturity if held all the way
    const totalYears = daysTotal / 365.25;
    const maturityMultiplier = Math.pow(1 + purchaseRateDecimal, totalYears);
    const valueAtMaturityGrossCents = Math.round(investedCents * maturityMultiplier);
    const profitAtMaturityGrossCents = valueAtMaturityGrossCents - investedCents;
    const annualizedReturnAtMaturityPercent = purchaseRatePercent;

    // 3. Mark to Market early exit calculation
    // dP/P approx = -D_mod * dY + 0.5 * Convexity * dY^2
    const duration = security.modifiedDurationYears;
    const convexity = security.convexity;
    
    // Scale duration proportionally to remaining life
    const effectiveDuration = Math.max(0.1, duration * (yearsRemaining / Math.max(0.1, totalYears)));
    const durationEffect = -effectiveDuration * dY;
    const convexityEffect = 0.5 * convexity * (dY * dY);
    const priceChangeRatio = durationEffect + convexityEffect;

    // Market exit gross cents: curve value adjusted by MtM ratio
    const marketExitGrossCents = Math.max(
      Math.round(investedCents * 0.5), // safety floor
      Math.round(curveAccrualGrossCents * (1 + priceChangeRatio))
    );

    const mtmGainLossCents = marketExitGrossCents - curveAccrualGrossCents;
    const mtmGainLossPercent = Number(
      (((marketExitGrossCents - curveAccrualGrossCents) / curveAccrualGrossCents) * 100).toFixed(2)
    );

    // 4. Regressive Income Tax on early exit
    const applicableTaxRatePercent = this.getRegressiveTaxRate(daysElapsed);
    const grossGainOverPrincipal = Math.max(0, marketExitGrossCents - investedCents);
    const taxAmountCents = Math.round(grossGainOverPrincipal * (applicableTaxRatePercent / 100));
    const marketExitNetCents = marketExitGrossCents - taxAmountCents;

    // 5. Sensitivity per 100 bps
    const priceSensitivityPer100Bps = Number((effectiveDuration * 1.0).toFixed(2));

    // Diagnosis & Pedagogical explanation
    let diagnosis: 'agio' | 'desagio' | 'neutro' = 'neutro';
    let verdictText = '';

    if (rateDeltaBps <= -25) {
      diagnosis = 'agio';
      verdictText = `Ganho de Marcação a Mercado (+${mtmGainLossPercent}%): Como as taxas de juros caíram (${rateDeltaBps} bps), seu título se valorizou expressivamente acima da curva contratada. Se optar por resgatar antecipadamente hoje, você embolsa esse ágio em dinheiro líquido (${marketExitNetCents > investedCents ? 'com lucro antecipado' : ''}).`;
    } else if (rateDeltaBps >= 25) {
      diagnosis = 'desagio';
      verdictText = `Deságio Temporário de Marcação a Mercado (${mtmGainLossPercent}%): A taxa do mercado subiu (${rateDeltaBps > 0 ? '+' : ''}${rateDeltaBps} bps). Resgatar HOJE geraria perda comparativa de marcação a mercado. Porém, se mantiver o título até o vencimento (${security.maturityDate}), sua rentabilidade de ${purchaseRatePercent.toFixed(2)}% a.a. é 100% GARANTIDA pelo Tesouro Nacional!`;
    } else {
      diagnosis = 'neutro';
      verdictText = `Taxa Alinhada: As taxas de juros se mantiveram próximas à data de compra. O valor de liquidação hoje reflete fielmente a curva de juros acumulada (${applicableTaxRatePercent}% de IR regressivo em caso de resgate).`;
    }

    return {
      securityId: security.id,
      securityName: security.name,
      investedCents,
      purchaseDate: '2024-01-15',
      maturityDate: security.maturityDate,
      purchaseRatePercent,
      currentSimulatedRatePercent,
      rateDeltaBps,
      daysElapsed,
      daysRemaining,
      valueAtMaturityGrossCents,
      profitAtMaturityGrossCents,
      annualizedReturnAtMaturityPercent,
      curveAccrualGrossCents,
      marketExitGrossCents,
      mtmGainLossCents,
      mtmGainLossPercent,
      applicableTaxRatePercent,
      marketExitNetCents,
      modifiedDurationYears: Number(effectiveDuration.toFixed(2)),
      priceSensitivityPer100Bps,
      diagnosis,
      verdictText,
    };
  }

  // Side-by-side simulator for multiple Brazilian fixed income instruments
  static compareInstruments(params: {
    amountCents: number;
    termMonths: number;
    currentCdiPercent?: number; // default 10.65%
    currentIpcaPercent?: number; // default 4.42%
  }): InvestmentComparisonItem[] {
    const {
      amountCents,
      termMonths,
      currentCdiPercent = 10.65,
      currentIpcaPercent = 4.42,
    } = params;

    const termDays = Math.round(termMonths * 30.416);
    const termYears = termMonths / 12;
    const taxRate = this.getRegressiveTaxRate(termDays);

    const results: InvestmentComparisonItem[] = [];

    // 1. Tesouro Selic (100% Selic ~ CDI)
    const selicAnnual = currentCdiPercent + 0.08;
    const selicGrossMultiplier = Math.pow(1 + selicAnnual / 100, termYears);
    const selicGrossAmount = Math.round(amountCents * selicGrossMultiplier);
    const selicGrossProfit = selicGrossAmount - amountCents;
    const selicTax = Math.round(selicGrossProfit * (taxRate / 100));
    const selicNet = selicGrossAmount - selicTax;
    const selicNetYield = ((selicNet - amountCents) / amountCents) * (1 / termYears) * 100;

    results.push({
      id: 'comp_tesouro_selic',
      title: 'Tesouro Selic 2029',
      issuerOrCategory: 'Tesouro Nacional (Risco Soberano)',
      isTaxExempt: false,
      hasFgc: false, // Sovereign risk is above FGC
      grossAmountCents: selicGrossAmount,
      grossProfitCents: selicGrossProfit,
      taxRatePercent: taxRate,
      taxAmountCents: selicTax,
      netAmountCents: selicNet,
      netProfitCents: selicNet - amountCents,
      netAnnualYieldPercent: Number(selicNetYield.toFixed(2)),
      equivalentGrossPercent: Number(selicAnnual.toFixed(2)),
      badge: 'Liquidez Diária D+1',
    });

    // 2. Tesouro IPCA+ (IPCA + 6.45% a.a.)
    const ipcaNominalAnnual = ((1 + currentIpcaPercent / 100) * (1 + 6.45 / 100) - 1) * 100;
    const ipcaGrossMultiplier = Math.pow(1 + ipcaNominalAnnual / 100, termYears);
    const ipcaGrossAmount = Math.round(amountCents * ipcaGrossMultiplier);
    const ipcaGrossProfit = ipcaGrossAmount - amountCents;
    const ipcaTax = Math.round(ipcaGrossProfit * (taxRate / 100));
    const ipcaNet = ipcaGrossAmount - ipcaTax;
    const ipcaNetYield = ((ipcaNet - amountCents) / amountCents) * (1 / termYears) * 100;

    results.push({
      id: 'comp_tesouro_ipca',
      title: 'Tesouro IPCA+ 2035',
      issuerOrCategory: 'Tesouro Nacional (Risco Soberano)',
      isTaxExempt: false,
      hasFgc: false,
      grossAmountCents: ipcaGrossAmount,
      grossProfitCents: ipcaGrossProfit,
      taxRatePercent: taxRate,
      taxAmountCents: ipcaTax,
      netAmountCents: ipcaNet,
      netProfitCents: ipcaNet - amountCents,
      netAnnualYieldPercent: Number(ipcaNetYield.toFixed(2)),
      equivalentGrossPercent: Number(ipcaNominalAnnual.toFixed(2)),
      badge: 'Proteção Anti-Inflação',
    });

    // 3. CDB Banco Inter (115% do CDI)
    const cdbAnnual = currentCdiPercent * 1.15;
    const cdbGrossMultiplier = Math.pow(1 + cdbAnnual / 100, termYears);
    const cdbGrossAmount = Math.round(amountCents * cdbGrossMultiplier);
    const cdbGrossProfit = cdbGrossAmount - amountCents;
    const cdbTax = Math.round(cdbGrossProfit * (taxRate / 100));
    const cdbNet = cdbGrossAmount - cdbTax;
    const cdbNetYield = ((cdbNet - amountCents) / amountCents) * (1 / termYears) * 100;

    results.push({
      id: 'comp_cdb_115',
      title: 'CDB Banco Inter (115% CDI)',
      issuerOrCategory: 'Banco Inter (Garantido pelo FGC)',
      isTaxExempt: false,
      hasFgc: true,
      grossAmountCents: cdbGrossAmount,
      grossProfitCents: cdbGrossProfit,
      taxRatePercent: taxRate,
      taxAmountCents: cdbTax,
      netAmountCents: cdbNet,
      netProfitCents: cdbNet - amountCents,
      netAnnualYieldPercent: Number(cdbNetYield.toFixed(2)),
      equivalentGrossPercent: Number(cdbAnnual.toFixed(2)),
      badge: 'Coberto pelo FGC',
    });

    // 4. LCI Banco do Brasil (92% do CDI - Isenta de IR)
    const lciNetAnnual = currentCdiPercent * 0.92;
    const lciGrossMultiplier = Math.pow(1 + lciNetAnnual / 100, termYears);
    const lciGrossAmount = Math.round(amountCents * lciGrossMultiplier);
    const lciNetProfit = lciGrossAmount - amountCents;
    const lciEquivalentGross = this.calculateEquivalentGrossRate(92, termDays);

    results.push({
      id: 'comp_lci_92',
      title: 'LCI Banco do Brasil (92% CDI)',
      issuerOrCategory: 'Banco do Brasil (FGC + Isento)',
      isTaxExempt: true,
      hasFgc: true,
      grossAmountCents: lciGrossAmount,
      grossProfitCents: lciNetProfit,
      taxRatePercent: 0,
      taxAmountCents: 0,
      netAmountCents: lciGrossAmount,
      netProfitCents: lciNetProfit,
      netAnnualYieldPercent: Number(lciNetAnnual.toFixed(2)),
      equivalentGrossPercent: lciEquivalentGross, // Gross CDI equivalent
      badge: '100% Isento de IR',
    });

    // 5. Debênture Incentivada de Infraestrutura (IPCA + 7,10% - Isenta de IR)
    const debNominalAnnual = ((1 + currentIpcaPercent / 100) * (1 + 7.10 / 100) - 1) * 100;
    const debMultiplier = Math.pow(1 + debNominalAnnual / 100, termYears);
    const debAmount = Math.round(amountCents * debMultiplier);
    const debProfit = debAmount - amountCents;
    const debEquivalentGross = Number((debNominalAnnual / (1 - taxRate / 100)).toFixed(2));

    results.push({
      id: 'comp_debenture_710',
      title: 'Debênture Incentivada (IPCA + 7,10%)',
      issuerOrCategory: 'Vale Infraestrutura (Isento Lei 12.431)',
      isTaxExempt: true,
      hasFgc: false,
      grossAmountCents: debAmount,
      grossProfitCents: debProfit,
      taxRatePercent: 0,
      taxAmountCents: 0,
      netAmountCents: debAmount,
      netProfitCents: debProfit,
      netAnnualYieldPercent: Number(debNominalAnnual.toFixed(2)),
      equivalentGrossPercent: debEquivalentGross,
      badge: 'Maior Retorno Líquido',
    });

    // Sort by Net Profit descending
    return results.sort((a, b) => b.netProfitCents - a.netProfitCents);
  }

  // FGC (Fundo Garantidor de Créditos) Coverage Thermometer
  // Checks compliance with:
  // - R$ 250.000 limit per financial conglomerate
  // - R$ 1.000.000 global ceiling per CPF/taxpayer
  static calculateFgcCoverage(positions: Array<{
    issuer: string;
    assetType: 'stock' | 'fii' | 'fiagro' | 'fiinfra' | 'etf_br' | 'fixed_income';
    category?: 'cdb' | 'lci' | 'lca' | 'cri' | 'cra' | 'debenture' | 'tesouro_direto' | 'outros';
    amountCents: number;
  }>): FgcAnalysisResult {
    const FGC_PER_ISSUER_LIMIT_CENTS = 25000000; // R$ 250.000,00
    const FGC_GLOBAL_CEILING_CENTS = 100000000; // R$ 1.000.000,00

    let totalPrivateCreditCents = 0;
    let totalSovereignTreasuryCents = 0;
    let totalExemptOrUncoveredCents = 0;
    let totalFgcEligibleCents = 0;

    const issuerMap = new Map<string, { count: number; totalCents: number }>();

    for (const pos of positions) {
      if (pos.assetType !== 'fixed_income') continue;

      const cat = pos.category || (pos.issuer.toUpperCase().includes('TESOURO') ? 'tesouro_direto' : 'cdb');

      if (cat === 'tesouro_direto' || pos.issuer.toUpperCase().includes('TESOURO')) {
        totalSovereignTreasuryCents += pos.amountCents;
        continue;
      }

      if (cat === 'cri' || cat === 'cra' || cat === 'debenture') {
        totalExemptOrUncoveredCents += pos.amountCents;
        totalPrivateCreditCents += pos.amountCents;
        continue;
      }

      // CDB, LCI, LCA (FGC eligible)
      totalPrivateCreditCents += pos.amountCents;
      totalFgcEligibleCents += pos.amountCents;

      const current = issuerMap.get(pos.issuer) || { count: 0, totalCents: 0 };
      issuerMap.set(pos.issuer, {
        count: current.count + 1,
        totalCents: current.totalCents + pos.amountCents,
      });
    }

    let totalCoveredByFgcCents = 0;
    let totalExcessAboveFgcCents = 0;
    const issuerGroups: FgcIssuerGroup[] = [];

    for (const [issuer, data] of issuerMap.entries()) {
      const covered = Math.min(data.totalCents, FGC_PER_ISSUER_LIMIT_CENTS);
      const excess = Math.max(0, data.totalCents - FGC_PER_ISSUER_LIMIT_CENTS);
      totalCoveredByFgcCents += covered;
      totalExcessAboveFgcCents += excess;

      const coverageRatio = Number(((data.totalCents / FGC_PER_ISSUER_LIMIT_CENTS) * 100).toFixed(1));
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (coverageRatio > 100) status = 'danger';
      else if (coverageRatio >= 80) status = 'warning';

      issuerGroups.push({
        issuer,
        instrumentsCount: data.count,
        totalInvestedCents: data.totalCents,
        coveredCents: covered,
        excessCents: excess,
        coverageRatioPercent: coverageRatio,
        status,
      });
    }

    // Sort by invested amount descending
    issuerGroups.sort((a, b) => b.totalInvestedCents - a.totalInvestedCents);

    const globalFgcUtilizationPercent = Number(
      ((totalCoveredByFgcCents / FGC_GLOBAL_CEILING_CENTS) * 100).toFixed(1)
    );

    const recommendations: string[] = [];

    if (totalExcessAboveFgcCents > 0) {
      recommendations.push(
        `Atenção: Você possui R$ ${(totalExcessAboveFgcCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em instrumentos bancários excedendo o teto de R$ 250.000 do FGC. Considere migrar o excedente para outra instituição financeira ou Tesouro Direto.`
      );
    }

    const warningIssuers = issuerGroups.filter((g) => g.status === 'warning');
    if (warningIssuers.length > 0) {
      recommendations.push(
        `Alerta de proximidade de teto: ${warningIssuers.map((i) => i.issuer).join(', ')} já comprometeu mais de 80% do limite de cobertura por CPF.`
      );
    }

    if (totalSovereignTreasuryCents > 0) {
      recommendations.push(
        `Excelente: Seus R$ ${(totalSovereignTreasuryCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em Tesouro Direto possuem Garantia Soberana 100% da União e não consomem sua cota do FGC.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Sua custódia de Renda Fixa está 100% protegida e dentro de todos os limites prudenciais do FGC.'
      );
    }

    return {
      totalPrivateCreditCents,
      totalSovereignTreasuryCents,
      totalExemptOrUncoveredCents,
      totalFgcEligibleCents,
      totalCoveredByFgcCents,
      totalExcessAboveFgcCents,
      globalFgcUtilizationPercent,
      issuers: issuerGroups,
      isFullyProtected: totalExcessAboveFgcCents === 0,
      recommendations,
    };
  }
}
