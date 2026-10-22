// src/lib/repositories/interfaces.ts
// Abstract Repository Pattern interfaces for persistence.
// Implementations exist for Turso (Primary) and Firestore (Fallback),
// plus an In-Memory mock for tests and offline/degraded mode.

import { UserProfile } from '@/domain/models/user-profile';
import { Portfolio, PortfolioPosition } from '@/domain/models/portfolio';
import { Transaction } from '@/domain/models/transaction';
import {
  ActionPlanEntry,
  ActionMonthOverride,
  ActionActualRecord,
} from '@/domain/models/action-plan';

export interface IUserRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
}

export interface IPortfolioRepository {
  getPortfolio(userId: string, portfolioId: string): Promise<Portfolio | null>;
  listPortfolios(userId: string): Promise<Portfolio[]>;
  savePortfolio(portfolio: Portfolio): Promise<void>;
  listPositions(portfolioId: string): Promise<PortfolioPosition[]>;
  savePosition(position: PortfolioPosition): Promise<void>;
  deletePosition(positionId: string): Promise<void>;
}

export interface ITransactionRepository {
  listTransactions(
    portfolioId: string,
    filter?: { ticker?: string; type?: string; fromDate?: string; toDate?: string }
  ): Promise<Transaction[]>;
  addTransaction(transaction: Transaction): Promise<void>;
  deleteTransaction(transactionId: string): Promise<void>;
}

export interface IActionPlanRepository {
  listPlanEntries(userId: string): Promise<ActionPlanEntry[]>;
  savePlanEntry(entry: ActionPlanEntry): Promise<void>;
  deletePlanEntry(entryId: string): Promise<void>;

  listOverrides(userId: string): Promise<ActionMonthOverride[]>;
  saveOverride(override: ActionMonthOverride): Promise<void>;
  deleteOverride(overrideId: string): Promise<void>;

  getActualRecord(userId: string, yearMonth: string): Promise<ActionActualRecord | null>;
  saveActualRecord(record: ActionActualRecord): Promise<void>;
  listActualRecords(userId: string, limit?: number): Promise<ActionActualRecord[]>;
}
