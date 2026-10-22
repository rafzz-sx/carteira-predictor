// src/lib/repositories/mock-repository.ts
// In-Memory mock implementation of the repository interfaces.
// Used for unit tests, contract testing, and offline degraded mode.

import {
  IUserRepository,
  IPortfolioRepository,
  ITransactionRepository,
  IActionPlanRepository,
} from './interfaces';
import { UserProfile } from '@/domain/models/user-profile';
import { Portfolio, PortfolioPosition } from '@/domain/models/portfolio';
import { Transaction } from '@/domain/models/transaction';
import {
  ActionPlanEntry,
  ActionMonthOverride,
  ActionActualRecord,
} from '@/domain/models/action-plan';

export class MockUserRepository implements IUserRepository {
  private profiles = new Map<string, UserProfile>();

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    this.profiles.set(profile.id, { ...profile, updatedAt: new Date().toISOString() });
  }

  clear() {
    this.profiles.clear();
  }
}

export class MockPortfolioRepository implements IPortfolioRepository {
  private portfolios = new Map<string, Portfolio>();
  private positions = new Map<string, PortfolioPosition>();

  async getPortfolio(userId: string, portfolioId: string): Promise<Portfolio | null> {
    const p = this.portfolios.get(portfolioId);
    if (!p || p.userId !== userId) return null;
    return p;
  }

  async listPortfolios(userId: string): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values()).filter((p) => p.userId === userId);
  }

  async savePortfolio(portfolio: Portfolio): Promise<void> {
    this.portfolios.set(portfolio.id, { ...portfolio });
  }

  async listPositions(portfolioId: string): Promise<PortfolioPosition[]> {
    return Array.from(this.positions.values()).filter((pos) => pos.portfolioId === portfolioId);
  }

  async savePosition(position: PortfolioPosition): Promise<void> {
    this.positions.set(position.id, { ...position });
  }

  async deletePosition(positionId: string): Promise<void> {
    this.positions.delete(positionId);
  }

  clear() {
    this.portfolios.clear();
    this.positions.clear();
  }
}

export class MockTransactionRepository implements ITransactionRepository {
  private transactions = new Map<string, Transaction>();

  async listTransactions(
    portfolioId: string,
    filter?: { ticker?: string; type?: string; fromDate?: string; toDate?: string }
  ): Promise<Transaction[]> {
    let list = Array.from(this.transactions.values()).filter(
      (tx) => tx.portfolioId === portfolioId
    );

    if (filter?.ticker) {
      list = list.filter((tx) => tx.ticker === filter.ticker?.toUpperCase());
    }
    if (filter?.type) {
      list = list.filter((tx) => tx.type === filter.type);
    }
    if (filter?.fromDate) {
      list = list.filter((tx) => tx.tradeDate >= filter.fromDate!);
    }
    if (filter?.toDate) {
      list = list.filter((tx) => tx.tradeDate <= filter.toDate!);
    }

    return list.sort((a, b) => b.tradeDate.localeCompare(a.tradeDate));
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    this.transactions.set(transaction.id, { ...transaction });
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    this.transactions.delete(transactionId);
  }

  clear() {
    this.transactions.clear();
  }
}

export class MockActionPlanRepository implements IActionPlanRepository {
  private planEntries = new Map<string, ActionPlanEntry>();
  private overrides = new Map<string, ActionMonthOverride>();
  private actuals = new Map<string, ActionActualRecord>();

  async listPlanEntries(userId: string): Promise<ActionPlanEntry[]> {
    return Array.from(this.planEntries.values())
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  }

  async savePlanEntry(entry: ActionPlanEntry): Promise<void> {
    this.planEntries.set(entry.id, { ...entry });
  }

  async deletePlanEntry(entryId: string): Promise<void> {
    this.planEntries.delete(entryId);
  }

  async listOverrides(userId: string): Promise<ActionMonthOverride[]> {
    return Array.from(this.overrides.values()).filter((o) => o.userId === userId);
  }

  async saveOverride(override: ActionMonthOverride): Promise<void> {
    this.overrides.set(override.id, { ...override });
  }

  async deleteOverride(overrideId: string): Promise<void> {
    this.overrides.delete(overrideId);
  }

  async getActualRecord(userId: string, yearMonth: string): Promise<ActionActualRecord | null> {
    const key = `${userId}_${yearMonth}`;
    return this.actuals.get(key) || null;
  }

  async saveActualRecord(record: ActionActualRecord): Promise<void> {
    const key = `${record.userId}_${record.yearMonth}`;
    this.actuals.set(key, { ...record });
  }

  async listActualRecords(userId: string, limit = 12): Promise<ActionActualRecord[]> {
    return Array.from(this.actuals.values())
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
      .slice(0, limit);
  }

  clear() {
    this.planEntries.clear();
    this.overrides.clear();
    this.actuals.clear();
  }
}
