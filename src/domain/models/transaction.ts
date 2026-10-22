// src/domain/models/transaction.ts
import { BrazilianAssetGuard } from '../guards/brazilian-asset-guard';

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'jcp' | 'split' | 'bonus';

export interface Transaction {
  id: string;
  portfolioId: string;
  userId: string;
  ticker: string; // Strictly validated by BrazilianAssetGuard
  assetType: 'stock' | 'fii' | 'fiagro' | 'fiinfra' | 'etf_br' | 'fixed_income';
  type: TransactionType;
  tradeDate: string; // "YYYY-MM-DD"
  quantity: number;
  unitPriceCents: number; // in integer cents
  totalCostsCents: number; // brokerage, B3 emoluments in cents
  totalAmountCents: number; // (quantity * unitPrice) +/- totalCosts
  notes?: string;
  createdAt: string;
}

export function createValidatedTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'assetType'>
): Omit<Transaction, 'id' | 'createdAt'> {
  // Enforce Brazilian Asset Guard
  const assetType = BrazilianAssetGuard.assertAllowed(data.ticker);

  return {
    ...data,
    ticker: data.ticker.trim().toUpperCase(),
    assetType,
  };
}
