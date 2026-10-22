// src/domain/models/screener.ts
// Domain models and pure quantitative filtering engine for B3 securities screener.

import { BrazilianAssetType } from '../guards/brazilian-asset-guard';

export interface ScreenerAsset {
  ticker: string;
  name: string;
  assetClass: BrazilianAssetType;
  sector: string;
  segment?: string;
  priceCents: number;
  changePercent: number; // e.g. 1.15 for +1.15%
  pl?: number; // Preço / Lucro (stocks)
  pvp: number; // Preço / Valor Patrimonial
  dividendYieldPct: number; // e.g. 8.4 for 8.40%
  netMarginPct?: number; // Margem Líquida (stocks)
  roePct?: number; // Retorno sobre Patrimônio Líquido (stocks)
  netDebtEbitda?: number; // Dívida Líquida / EBITDA (stocks)
  physicalVacancyPct?: number; // Vacância Física (FIIs de tijolo)
  financialVacancyPct?: number; // Vacância Financeira (FIIs)
  managementType?: 'Ativa' | 'Passiva';
  dailyLiquidityCents: number;
  isExample: boolean;
}

export interface ScreenerFilters {
  assetClass?: 'all' | BrazilianAssetType;
  searchQuery?: string;
  minDy?: number;
  maxDy?: number;
  minPl?: number;
  maxPl?: number;
  minPvp?: number;
  maxPvp?: number;
  minRoe?: number;
  maxNetDebtEbitda?: number;
  maxPhysicalVacancy?: number;
  presetId?: ScreenerPresetId;
  sortBy?: 'dy' | 'pl' | 'pvp' | 'roe' | 'liquidity' | 'ticker';
  sortOrder?: 'asc' | 'desc';
}

export type ScreenerPresetId =
  | 'all'
  | 'dividend_kings'
  | 'fii_brick_discount'
  | 'graham_deep_value'
  | 'exempt_credit';

export interface ScreenerPreset {
  id: ScreenerPresetId;
  name: string;
  badge: string;
  description: string;
  filters: Partial<ScreenerFilters>;
}

export const SCREENER_PRESETS: ScreenerPreset[] = [
  {
    id: 'all',
    name: 'Todos os Ativos',
    badge: 'B3 GERAL',
    description: 'Universo completo de ativos brasileiros elegíveis sem filtros prévios.',
    filters: {},
  },
  {
    id: 'dividend_kings',
    name: 'Reis dos Dividendos B3',
    badge: 'DIVIDENDOS & QUALIDADE',
    description: 'Ações com Dividend Yield 12m acima de 6,0%, ROE acima de 12% e endividamento controlado.',
    filters: {
      assetClass: 'stock',
      minDy: 6.0,
      minRoe: 12.0,
      maxNetDebtEbitda: 3.0,
    },
  },
  {
    id: 'fii_brick_discount',
    name: 'FIIs de Tijolo com Desconto',
    badge: 'IMOBILIÁRIO COM DESCONTO',
    description: 'FIIs de tijolo negociando abaixo do valor patrimonial (P/VP < 1,00) com vacância física < 10% e DY > 7%.',
    filters: {
      assetClass: 'fii',
      maxPvp: 1.0,
      minDy: 7.0,
      maxPhysicalVacancy: 10.0,
    },
  },
  {
    id: 'graham_deep_value',
    name: 'Fórmula de Valor (Graham & Greenblatt)',
    badge: 'VALOR PROFUNDO',
    description: 'Ações com baixo múltiplo P/L (< 10x), P/VP moderado (< 1,5x) e alta rentabilidade (ROE > 15%).',
    filters: {
      assetClass: 'stock',
      maxPl: 10.0,
      maxPvp: 1.5,
      minRoe: 15.0,
    },
  },
  {
    id: 'exempt_credit',
    name: 'FIAGRO & FI-Infra Isentos',
    badge: 'RENDA ISENTA',
    description: 'Fundos com distribuição de rendimentos isenta de IRPF para pessoas físicas e DY > 10% a.a.',
    filters: {
      assetClass: 'fiagro',
      minDy: 10.0,
    },
  },
];

/**
 * Pure, deterministic quantitative filtering engine for B3 assets.
 */
export function filterScreenerAssets(
  assets: ScreenerAsset[],
  filters: ScreenerFilters
): ScreenerAsset[] {
  return assets.filter((asset) => {
    // 1. Text Search (Ticker, Name, Sector)
    if (filters.searchQuery) {
      const q = filters.searchQuery.trim().toLowerCase();
      const match =
        asset.ticker.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.sector.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Asset Class filter
    if (filters.assetClass && filters.assetClass !== 'all') {
      if (asset.assetClass !== filters.assetClass) return false;
    }

    // 3. Dividend Yield filter
    if (filters.minDy !== undefined && asset.dividendYieldPct < filters.minDy) return false;
    if (filters.maxDy !== undefined && asset.dividendYieldPct > filters.maxDy) return false;

    // 4. P/VP filter
    if (filters.minPvp !== undefined && asset.pvp < filters.minPvp) return false;
    if (filters.maxPvp !== undefined && asset.pvp > filters.maxPvp) return false;

    // 5. P/L filter (stocks only)
    if (filters.minPl !== undefined) {
      if (asset.pl === undefined || asset.pl < filters.minPl) return false;
    }
    if (filters.maxPl !== undefined) {
      if (asset.pl === undefined || asset.pl > filters.maxPl) return false;
    }

    // 6. ROE filter (stocks only)
    if (filters.minRoe !== undefined) {
      if (asset.roePct === undefined || asset.roePct < filters.minRoe) return false;
    }

    // 7. Net Debt / EBITDA filter (stocks only)
    if (filters.maxNetDebtEbitda !== undefined) {
      if (asset.netDebtEbitda !== undefined && asset.netDebtEbitda > filters.maxNetDebtEbitda) {
        return false;
      }
    }

    // 8. Physical Vacancy filter (FIIs only)
    if (filters.maxPhysicalVacancy !== undefined) {
      if (
        asset.physicalVacancyPct !== undefined &&
        asset.physicalVacancyPct > filters.maxPhysicalVacancy
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Pure sorting function for screener results.
 */
export function sortScreenerAssets(
  assets: ScreenerAsset[],
  sortBy: ScreenerFilters['sortBy'] = 'liquidity',
  sortOrder: ScreenerFilters['sortOrder'] = 'desc'
): ScreenerAsset[] {
  const sorted = [...assets];
  const mult = sortOrder === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'dy':
        return (a.dividendYieldPct - b.dividendYieldPct) * mult;
      case 'pl':
        return ((a.pl ?? 9999) - (b.pl ?? 9999)) * mult;
      case 'pvp':
        return (a.pvp - b.pvp) * mult;
      case 'roe':
        return ((a.roePct ?? -999) - (b.roePct ?? -999)) * mult;
      case 'ticker':
        return a.ticker.localeCompare(b.ticker) * mult;
      case 'liquidity':
      default:
        return (a.dailyLiquidityCents - b.dailyLiquidityCents) * mult;
    }
  });

  return sorted;
}
