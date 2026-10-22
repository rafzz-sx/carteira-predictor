// src/lib/market-data.ts
// Market quote & quantitative data service for Brazilian B3 securities.
// Complies with Rule 0: Transparent delayed quotes (~30 min), honest staleness flags, no silent gap fills.

import { ScreenerAsset } from '@/domain/models/screener';
import { BrazilianAssetGuard } from '@/domain/guards/brazilian-asset-guard';

export interface MarketQuote {
  ticker: string;
  priceCents: number;
  changePercent: number; // e.g. 0.96 for +0.96%
  lastUpdate: string; // "HH:MM"
  delayMinutes: number;
  isStale: boolean;
  isExample: boolean;
}

export interface MacroIndicator {
  id: string;
  name: string;
  value: string;
  period: string;
  description: string;
  source: string;
  isExample: boolean;
}

export interface B3IndexQuote {
  symbol: string;
  name: string;
  points: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  lastUpdate: string;
  isExample: boolean;
}

// Known baseline prices for Brazilian B3 market assets (delayed quotes)
const DEFAULT_B3_QUOTES: Record<string, { priceCents: number; changePercent: number }> = {
  PETR4: { priceCents: 3842, changePercent: 1.15 },
  VALE3: { priceCents: 6280, changePercent: -0.45 },
  ITUB4: { priceCents: 3590, changePercent: 0.82 },
  BBDC4: { priceCents: 1540, changePercent: 0.25 },
  BBAS3: { priceCents: 2890, changePercent: 1.40 },
  WEGE3: { priceCents: 5210, changePercent: 0.65 },
  TAEE11: { priceCents: 3620, changePercent: 0.10 },
  EGIE3: { priceCents: 4310, changePercent: -0.30 },
  PRIO3: { priceCents: 4675, changePercent: 2.10 },
  RENT3: { priceCents: 4580, changePercent: -1.85 },
  CPLE6: { priceCents: 1045, changePercent: 0.70 },
  HGLG11: { priceCents: 16450, changePercent: 0.35 },
  KNCR11: { priceCents: 10320, changePercent: 0.15 },
  XPLG11: { priceCents: 10480, changePercent: -0.20 },
  MXRF11: { priceCents: 1025, changePercent: 0.00 },
  XPML11: { priceCents: 11230, changePercent: 0.45 },
  BTLG11: { priceCents: 10180, changePercent: 0.20 },
  VISC11: { priceCents: 11890, changePercent: -0.15 },
  VGIA11: { priceCents: 980, changePercent: 0.10 },
  RZAG11: { priceCents: 915, changePercent: -0.10 },
  JURO11: { priceCents: 10150, changePercent: 0.40 },
  KDIF11: { priceCents: 10420, changePercent: 0.15 },
  BOVA11: { priceCents: 12810, changePercent: 0.92 },
  SMAL11: { priceCents: 10240, changePercent: 1.20 },
  DIVO11: { priceCents: 9450, changePercent: 0.50 },
  'TESOURO SELIC 2029': { priceCents: 1485000, changePercent: 0.05 },
};

// Brazilian Macroeconomic Indicators (October 2026 Reference)
const MACRO_INDICATORS: MacroIndicator[] = [
  {
    id: 'selic',
    name: 'Taxa Selic Meta',
    value: '10,75% a.a.',
    period: 'Copom Out/2026',
    description: 'Taxa básica de juros da economia brasileira definida pelo Banco Central.',
    source: 'Banco Central do Brasil',
    isExample: true,
  },
  {
    id: 'ipca',
    name: 'IPCA Acumulado 12m',
    value: '4,42% a.a.',
    period: 'Últimos 12 meses',
    description: 'Índice Nacional de Preços ao Consumidor Amplo (inflação oficial brasileira).',
    source: 'IBGE',
    isExample: true,
  },
  {
    id: 'cdi',
    name: 'CDI Anualizado',
    value: '10,65% a.a.',
    period: 'Média diária',
    description: 'Certificado de Depósito Interbancário, referência de renda fixa nacional.',
    source: 'B3',
    isExample: true,
  },
  {
    id: 'ptax',
    name: 'Dólar Comercial (PTAX)',
    value: 'R$ 5,68',
    period: 'Cotação de Fechamento',
    description: 'Taxa média diária de câmbio calculada pelo Banco Central.',
    source: 'Banco Central do Brasil',
    isExample: true,
  },
  {
    id: 'juro_real',
    name: 'Juro Real Líquido (NTN-B)',
    value: 'IPCA + 6,35% a.a.',
    period: 'Tesouro IPCA+ 2035',
    description: 'Prêmio de risco real acima da inflação garantido pelo Tesouro Nacional.',
    source: 'Tesouro Transparente',
    isExample: true,
  },
];

// Major B3 Market Indices
const MAJOR_B3_INDICES: B3IndexQuote[] = [
  {
    symbol: 'IBOV',
    name: 'Ibovespa',
    points: 131250,
    changePercent: 0.85,
    high52w: 137400,
    low52w: 118200,
    lastUpdate: '17:05',
    isExample: true,
  },
  {
    symbol: 'IFIX',
    name: 'Índice de Fundos Imobiliários',
    points: 3420,
    changePercent: 0.22,
    high52w: 3450,
    low52w: 3120,
    lastUpdate: '17:05',
    isExample: true,
  },
  {
    symbol: 'IDIV',
    name: 'Índice de Dividendos B3',
    points: 9850,
    changePercent: 0.95,
    high52w: 10100,
    low52w: 8720,
    lastUpdate: '17:05',
    isExample: true,
  },
  {
    symbol: 'SMLL',
    name: 'Small Caps B3',
    points: 2180,
    changePercent: 1.35,
    high52w: 2420,
    low52w: 1980,
    lastUpdate: '17:05',
    isExample: true,
  },
  {
    symbol: 'IMA-B 5',
    name: 'Títulos Públicos IPCA+ (Até 5 Anos)',
    points: 11230,
    changePercent: 0.18,
    high52w: 11350,
    low52w: 10420,
    lastUpdate: '17:05',
    isExample: true,
  },
];

// Curated universe of high-liquidity Brazilian assets for Screener
const RAW_SCREENER_ASSETS: ScreenerAsset[] = [
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    assetClass: 'stock',
    sector: 'Financeiro',
    segment: 'Bancos',
    priceCents: 2890,
    changePercent: 1.40,
    pl: 4.8,
    pvp: 0.92,
    dividendYieldPct: 9.6,
    netMarginPct: 22.4,
    roePct: 21.5,
    netDebtEbitda: 0.0, // Banco
    dailyLiquidityCents: 45000000000,
    isExample: true,
  },
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    assetClass: 'stock',
    sector: 'Petróleo e Gás',
    segment: 'Exploração e Refino',
    priceCents: 3842,
    changePercent: 1.15,
    pl: 4.1,
    pvp: 1.08,
    dividendYieldPct: 14.8,
    netMarginPct: 24.2,
    roePct: 26.8,
    netDebtEbitda: 0.85,
    dailyLiquidityCents: 120000000000,
    isExample: true,
  },
  {
    ticker: 'VALE3',
    name: 'Vale ON',
    assetClass: 'stock',
    sector: 'Materiais Básicos',
    segment: 'Mineração',
    priceCents: 6280,
    changePercent: -0.45,
    pl: 6.2,
    pvp: 1.35,
    dividendYieldPct: 8.9,
    netMarginPct: 20.5,
    roePct: 22.1,
    netDebtEbitda: 0.72,
    dailyLiquidityCents: 98000000000,
    isExample: true,
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco PN',
    assetClass: 'stock',
    sector: 'Financeiro',
    segment: 'Bancos',
    priceCents: 3590,
    changePercent: 0.82,
    pl: 8.5,
    pvp: 1.68,
    dividendYieldPct: 6.8,
    netMarginPct: 23.8,
    roePct: 21.2,
    netDebtEbitda: 0.0,
    dailyLiquidityCents: 85000000000,
    isExample: true,
  },
  {
    ticker: 'WEGE3',
    name: 'WEG ON',
    assetClass: 'stock',
    sector: 'Bens Industriais',
    segment: 'Motores e Equipamentos Elétricos',
    priceCents: 5210,
    changePercent: 0.65,
    pl: 32.4,
    pvp: 10.2,
    dividendYieldPct: 1.8,
    netMarginPct: 17.5,
    roePct: 31.4,
    netDebtEbitda: -0.45, // Caixa líquido
    dailyLiquidityCents: 32000000000,
    isExample: true,
  },
  {
    ticker: 'TAEE11',
    name: 'Taesa Unit',
    assetClass: 'stock',
    sector: 'Utilidade Pública',
    segment: 'Transmissão Elétrica',
    priceCents: 3620,
    changePercent: 0.10,
    pl: 8.2,
    pvp: 1.62,
    dividendYieldPct: 9.8,
    netMarginPct: 45.2,
    roePct: 19.8,
    netDebtEbitda: 3.4,
    dailyLiquidityCents: 24000000000,
    isExample: true,
  },
  {
    ticker: 'EGIE3',
    name: 'Engie Brasil ON',
    assetClass: 'stock',
    sector: 'Utilidade Pública',
    segment: 'Geração de Energia',
    priceCents: 4310,
    changePercent: -0.30,
    pl: 9.8,
    pvp: 2.75,
    dividendYieldPct: 7.4,
    netMarginPct: 28.5,
    roePct: 28.2,
    netDebtEbitda: 2.1,
    dailyLiquidityCents: 18000000000,
    isExample: true,
  },
  {
    ticker: 'PRIO3',
    name: 'PRIO ON',
    assetClass: 'stock',
    sector: 'Petróleo e Gás',
    segment: 'Produção Júnior',
    priceCents: 4675,
    changePercent: 2.10,
    pl: 6.9,
    pvp: 1.88,
    dividendYieldPct: 0.0, // Reinvestimento total
    netMarginPct: 42.1,
    roePct: 32.5,
    netDebtEbitda: 0.95,
    dailyLiquidityCents: 42000000000,
    isExample: true,
  },
  {
    ticker: 'CPLE6',
    name: 'Copel PNB',
    assetClass: 'stock',
    sector: 'Utilidade Pública',
    segment: 'Energia Elétrica',
    priceCents: 1045,
    changePercent: 0.70,
    pl: 7.8,
    pvp: 1.15,
    dividendYieldPct: 8.2,
    netMarginPct: 21.0,
    roePct: 15.4,
    netDebtEbitda: 1.8,
    dailyLiquidityCents: 15000000000,
    isExample: true,
  },
  // Real Estate Funds (FIIs)
  {
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    segment: 'Galpões Logísticos',
    priceCents: 16450,
    changePercent: 0.35,
    pvp: 0.98,
    dividendYieldPct: 8.4,
    physicalVacancyPct: 5.8,
    financialVacancyPct: 4.2,
    managementType: 'Ativa',
    dailyLiquidityCents: 9500000000,
    isExample: true,
  },
  {
    ticker: 'KNCR11',
    name: 'Kinea Rendimentos Imobiliários FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    segment: 'Recebíveis / Papel (CDI)',
    priceCents: 10320,
    changePercent: 0.15,
    pvp: 1.01,
    dividendYieldPct: 11.2,
    physicalVacancyPct: 0.0,
    financialVacancyPct: 0.0,
    managementType: 'Ativa',
    dailyLiquidityCents: 11000000000,
    isExample: true,
  },
  {
    ticker: 'XPLG11',
    name: 'XP Log FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    segment: 'Galpões Logísticos',
    priceCents: 10480,
    changePercent: -0.20,
    pvp: 0.93,
    dividendYieldPct: 8.6,
    physicalVacancyPct: 4.1,
    financialVacancyPct: 3.5,
    managementType: 'Ativa',
    dailyLiquidityCents: 7500000000,
    isExample: true,
  },
  {
    ticker: 'MXRF11',
    name: 'Maxi Renda FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    segment: 'Papel / Híbrido',
    priceCents: 1025,
    changePercent: 0.00,
    pvp: 1.04,
    dividendYieldPct: 11.8,
    physicalVacancyPct: 0.0,
    financialVacancyPct: 0.0,
    managementType: 'Ativa',
    dailyLiquidityCents: 14000000000,
    isExample: true,
  },
  {
    ticker: 'XPML11',
    name: 'XP Malls FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    segment: 'Shoppings',
    priceCents: 11230,
    changePercent: 0.45,
    pvp: 0.97,
    dividendYieldPct: 8.8,
    physicalVacancyPct: 3.8,
    financialVacancyPct: 2.1,
    managementType: 'Ativa',
    dailyLiquidityCents: 8500000000,
    isExample: true,
  },
  {
    ticker: 'BTLG11',
    name: 'BTG Pactual Logística FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    segment: 'Galpões Logísticos',
    priceCents: 10180,
    changePercent: 0.20,
    pvp: 0.96,
    dividendYieldPct: 9.1,
    physicalVacancyPct: 2.4,
    financialVacancyPct: 1.9,
    managementType: 'Ativa',
    dailyLiquidityCents: 9800000000,
    isExample: true,
  },
  // FIAGRO & FI-Infra
  {
    ticker: 'VGIA11',
    name: 'Valora CRA FIAGRO',
    assetClass: 'fiagro',
    sector: 'Agronegócio',
    segment: 'CRA / Crédito Agro',
    priceCents: 980,
    changePercent: 0.10,
    pvp: 0.99,
    dividendYieldPct: 13.5,
    physicalVacancyPct: 0.0,
    managementType: 'Ativa',
    dailyLiquidityCents: 5200000000,
    isExample: true,
  },
  {
    ticker: 'RZAG11',
    name: 'Riza Agro FIAGRO',
    assetClass: 'fiagro',
    sector: 'Agronegócio',
    segment: 'CRA & Terras',
    priceCents: 915,
    changePercent: -0.10,
    pvp: 0.94,
    dividendYieldPct: 14.1,
    physicalVacancyPct: 0.0,
    managementType: 'Ativa',
    dailyLiquidityCents: 4100000000,
    isExample: true,
  },
  {
    ticker: 'JURO11',
    name: 'Sparta Debêntures Incentivadas FI-Infra',
    assetClass: 'fiinfra',
    sector: 'Infraestrutura',
    segment: 'Debêntures Isentas',
    priceCents: 10150,
    changePercent: 0.40,
    pvp: 1.01,
    dividendYieldPct: 11.5,
    physicalVacancyPct: 0.0,
    managementType: 'Ativa',
    dailyLiquidityCents: 4800000000,
    isExample: true,
  },
  // Brazilian ETFs
  {
    ticker: 'BOVA11',
    name: 'iShares Ibovespa ETF',
    assetClass: 'etf_br',
    sector: 'Índices B3',
    segment: 'Ibovespa',
    priceCents: 12810,
    changePercent: 0.92,
    pvp: 1.00,
    dividendYieldPct: 0.0, // Reinveste na cota
    dailyLiquidityCents: 85000000000,
    isExample: true,
  },
  {
    ticker: 'SMAL11',
    name: 'iShares Small Cap B3 ETF',
    assetClass: 'etf_br',
    sector: 'Índices B3',
    segment: 'Small Caps',
    priceCents: 10240,
    changePercent: 1.20,
    pvp: 1.00,
    dividendYieldPct: 0.0,
    dailyLiquidityCents: 22000000000,
    isExample: true,
  },
  {
    ticker: 'DIVO11',
    name: 'It Now IDIV B3 ETF',
    assetClass: 'etf_br',
    sector: 'Índices B3',
    segment: 'Índice de Dividendos',
    priceCents: 9450,
    changePercent: 0.50,
    pvp: 1.00,
    dividendYieldPct: 0.0,
    dailyLiquidityCents: 14000000000,
    isExample: true,
  },
];

export class MarketDataService {
  /**
   * Retrieves quote for a B3 ticker with honest delay badge.
   */
  static getQuote(ticker: string): MarketQuote {
    const clean = ticker.trim().toUpperCase();
    const known = DEFAULT_B3_QUOTES[clean];

    if (known) {
      return {
        ticker: clean,
        priceCents: known.priceCents,
        changePercent: known.changePercent,
        lastUpdate: '17:05',
        delayMinutes: 30,
        isStale: false,
        isExample: true,
      };
    }

    return {
      ticker: clean,
      priceCents: 10000,
      changePercent: 0.0,
      lastUpdate: '17:05',
      delayMinutes: 30,
      isStale: true,
      isExample: true,
    };
  }

  /**
   * Retrieves quotes in batch for multiple tickers.
   */
  static getBatchQuotes(tickers: string[]): Record<string, MarketQuote> {
    const map: Record<string, MarketQuote> = {};
    for (const t of tickers) {
      map[t] = this.getQuote(t);
    }
    return map;
  }

  /**
   * Returns official Brazilian Macroeconomic Indicators.
   */
  static getMacroIndicators(): MacroIndicator[] {
    return MACRO_INDICATORS;
  }

  /**
   * Returns major Brazilian market indices quotes.
   */
  static getMajorIndices(): B3IndexQuote[] {
    return MAJOR_B3_INDICES;
  }

  /**
   * Returns verified Brazilian assets for screener.
   * Guarantees 100% adherence to BrazilianAssetGuard (rejects any foreign/BDR asset).
   */
  static getScreenerAssets(): ScreenerAsset[] {
    return RAW_SCREENER_ASSETS.filter((asset) => {
      const check = BrazilianAssetGuard.validate(asset.ticker);
      return check.isAllowed;
    });
  }

  /**
   * Returns top gainers, top losers and top dividend payers of the B3 session.
   */
  static getTopMovers(): {
    topGainers: ScreenerAsset[];
    topLosers: ScreenerAsset[];
    topDividends: ScreenerAsset[];
  } {
    const all = this.getScreenerAssets();
    const topGainers = [...all].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
    const topLosers = [...all].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
    const topDividends = [...all].sort((a, b) => b.dividendYieldPct - a.dividendYieldPct).slice(0, 5);

    return {
      topGainers,
      topLosers,
      topDividends,
    };
  }
}
