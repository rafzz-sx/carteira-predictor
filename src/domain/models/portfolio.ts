// src/domain/models/portfolio.ts

export interface TargetAllocations {
  stocksPct: number;      // e.g. 4000 = 40.00%
  fiisPct: number;        // e.g. 3500 = 35.00%
  fixedIncomePct: number; // e.g. 2000 = 20.00%
  cashReservePct: number; // e.g. 500 = 5.00%
}

export interface PortfolioPosition {
  id: string;
  portfolioId: string;
  ticker: string;
  assetType: 'stock' | 'fii' | 'fiagro' | 'fiinfra' | 'etf_br' | 'fixed_income';
  quantity: number;
  averagePriceCents: number; // Preço Médio em centavos
  totalInvestedCents: number; // quantity * averagePriceCents
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  targetAllocations: TargetAllocations;
  createdAt: string;
  updatedAt: string;
}
