// src/lib/repositories/turso-repository.ts
// Primary Storage Adapter using Turso libSQL (SQLite-at-the-edge).

import { createClient, type Client, type InValue } from '@libsql/client';
import {
  IUserRepository,
  IPortfolioRepository,
  ITransactionRepository,
  IActionPlanRepository,
} from './interfaces';
import { UserProfile, InvestorRiskProfile } from '@/domain/models/user-profile';
import { Portfolio, PortfolioPosition } from '@/domain/models/portfolio';
import { Transaction, TransactionType } from '@/domain/models/transaction';
import { BrazilianAssetType } from '@/domain/guards/brazilian-asset-guard';
import {
  ActionPlanEntry,
  ActionMonthOverride,
  ActionActualRecord,
  AnnualAdjustmentType,
} from '@/domain/models/action-plan';

export class TursoClientProvider {
  private static clientInstance: Client | null = null;

  static getClient(): Client {
    if (!this.clientInstance) {
      const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
      const authToken = process.env.TURSO_AUTH_TOKEN;
      this.clientInstance = createClient({
        url,
        authToken,
      });
    }
    return this.clientInstance;
  }

  static setClient(client: Client) {
    this.clientInstance = client;
  }
}

export class TursoUserRepository implements IUserRepository {
  private client: Client;

  constructor(client?: Client) {
    this.client = client || TursoClientProvider.getClient();
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM user_profiles WHERE id = ?',
      args: [userId],
    });

    if (rs.rows.length === 0) return null;
    const row = rs.rows[0];

    return {
      id: String(row.id),
      email: String(row.email),
      name: row.name ? String(row.name) : undefined,
      riskProfile: row.risk_profile as InvestorRiskProfile,
      riskScore: Number(row.risk_score),
      horizonYears: Number(row.horizon_years),
      emergencyFundMonths: Number(row.emergency_fund_months),
      emergencyFundCents: Number(row.emergency_fund_cents),
      monthlyExpensesCents: row.monthly_expenses_cents ? Number(row.monthly_expenses_cents) : undefined,
      monthlyNetIncomeCents: row.monthly_net_income_cents ? Number(row.monthly_net_income_cents) : undefined,
      privacyMode: Boolean(row.privacy_mode),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO user_profiles (
          id, email, name, risk_profile, risk_score, horizon_years,
          emergency_fund_months, emergency_fund_cents, monthly_expenses_cents,
          monthly_net_income_cents, privacy_mode, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          risk_profile = excluded.risk_profile,
          risk_score = excluded.risk_score,
          horizon_years = excluded.horizon_years,
          emergency_fund_months = excluded.emergency_fund_months,
          emergency_fund_cents = excluded.emergency_fund_cents,
          monthly_expenses_cents = excluded.monthly_expenses_cents,
          monthly_net_income_cents = excluded.monthly_net_income_cents,
          privacy_mode = excluded.privacy_mode,
          updated_at = excluded.updated_at
      `,
      args: [
        profile.id,
        profile.email,
        profile.name ?? null,
        profile.riskProfile,
        profile.riskScore,
        profile.horizonYears,
        profile.emergencyFundMonths,
        profile.emergencyFundCents,
        profile.monthlyExpensesCents ?? null,
        profile.monthlyNetIncomeCents ?? null,
        profile.privacyMode ? 1 : 0,
        profile.createdAt,
        new Date().toISOString(),
      ],
    });
  }
}

export class TursoPortfolioRepository implements IPortfolioRepository {
  private client: Client;

  constructor(client?: Client) {
    this.client = client || TursoClientProvider.getClient();
  }

  async getPortfolio(userId: string, portfolioId: string): Promise<Portfolio | null> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM portfolios WHERE id = ? AND user_id = ?',
      args: [portfolioId, userId],
    });

    if (rs.rows.length === 0) return null;
    const row = rs.rows[0];

    return {
      id: String(row.id),
      userId: String(row.user_id),
      name: String(row.name),
      isDefault: Boolean(row.is_default),
      targetAllocations: {
        stocksPct: Number(row.stocks_pct),
        fiisPct: Number(row.fiis_pct),
        fixedIncomePct: Number(row.fixed_income_pct),
        cashReservePct: Number(row.cash_reserve_pct),
      },
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  async listPortfolios(userId: string): Promise<Portfolio[]> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM portfolios WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
      args: [userId],
    });

    return rs.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      name: String(row.name),
      isDefault: Boolean(row.is_default),
      targetAllocations: {
        stocksPct: Number(row.stocks_pct),
        fiisPct: Number(row.fiis_pct),
        fixedIncomePct: Number(row.fixed_income_pct),
        cashReservePct: Number(row.cash_reserve_pct),
      },
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

  async savePortfolio(portfolio: Portfolio): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO portfolios (
          id, user_id, name, is_default, stocks_pct, fiis_pct,
          fixed_income_pct, cash_reserve_pct, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          is_default = excluded.is_default,
          stocks_pct = excluded.stocks_pct,
          fiis_pct = excluded.fiis_pct,
          fixed_income_pct = excluded.fixed_income_pct,
          cash_reserve_pct = excluded.cash_reserve_pct,
          updated_at = excluded.updated_at
      `,
      args: [
        portfolio.id,
        portfolio.userId,
        portfolio.name,
        portfolio.isDefault ? 1 : 0,
        portfolio.targetAllocations.stocksPct,
        portfolio.targetAllocations.fiisPct,
        portfolio.targetAllocations.fixedIncomePct,
        portfolio.targetAllocations.cashReservePct,
        portfolio.createdAt,
        new Date().toISOString(),
      ],
    });
  }

  async listPositions(portfolioId: string): Promise<PortfolioPosition[]> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM portfolio_positions WHERE portfolio_id = ? ORDER BY ticker ASC',
      args: [portfolioId],
    });

    return rs.rows.map((row) => ({
      id: String(row.id),
      portfolioId: String(row.portfolio_id),
      ticker: String(row.ticker),
      assetType: row.asset_type as BrazilianAssetType,
      quantity: Number(row.quantity),
      averagePriceCents: Number(row.average_price_cents),
      totalInvestedCents: Number(row.total_invested_cents),
      updatedAt: String(row.updated_at),
    }));
  }

  async savePosition(position: PortfolioPosition): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO portfolio_positions (
          id, portfolio_id, ticker, asset_type, quantity,
          average_price_cents, total_invested_cents, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(portfolio_id, ticker) DO UPDATE SET
          quantity = excluded.quantity,
          average_price_cents = excluded.average_price_cents,
          total_invested_cents = excluded.total_invested_cents,
          updated_at = excluded.updated_at
      `,
      args: [
        position.id,
        position.portfolioId,
        position.ticker,
        position.assetType,
        position.quantity,
        position.averagePriceCents,
        position.totalInvestedCents,
        new Date().toISOString(),
      ],
    });
  }

  async deletePosition(positionId: string): Promise<void> {
    await this.client.execute({
      sql: 'DELETE FROM portfolio_positions WHERE id = ?',
      args: [positionId],
    });
  }
}

export class TursoTransactionRepository implements ITransactionRepository {
  private client: Client;

  constructor(client?: Client) {
    this.client = client || TursoClientProvider.getClient();
  }

  async listTransactions(
    portfolioId: string,
    filter?: { ticker?: string; type?: string; fromDate?: string; toDate?: string }
  ): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE portfolio_id = ?';
    const params: InValue[] = [portfolioId];

    if (filter?.ticker) {
      query += ' AND ticker = ?';
      params.push(filter.ticker.toUpperCase());
    }
    if (filter?.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }
    if (filter?.fromDate) {
      query += ' AND trade_date >= ?';
      params.push(filter.fromDate);
    }
    if (filter?.toDate) {
      query += ' AND trade_date <= ?';
      params.push(filter.toDate);
    }

    query += ' ORDER BY trade_date DESC, created_at DESC';

    const rs = await this.client.execute({ sql: query, args: params });

    return rs.rows.map((row) => ({
      id: String(row.id),
      portfolioId: String(row.portfolio_id),
      userId: String(row.user_id),
      ticker: String(row.ticker),
      assetType: row.asset_type as BrazilianAssetType,
      type: row.type as TransactionType,
      tradeDate: String(row.trade_date),
      quantity: Number(row.quantity),
      unitPriceCents: Number(row.unit_price_cents),
      totalCostsCents: Number(row.total_costs_cents),
      totalAmountCents: Number(row.total_amount_cents),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at),
    }));
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO transactions (
          id, portfolio_id, user_id, ticker, asset_type, type,
          trade_date, quantity, unit_price_cents, total_costs_cents,
          total_amount_cents, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        transaction.id,
        transaction.portfolioId,
        transaction.userId,
        transaction.ticker,
        transaction.assetType,
        transaction.type,
        transaction.tradeDate,
        transaction.quantity,
        transaction.unitPriceCents,
        transaction.totalCostsCents,
        transaction.totalAmountCents,
        transaction.notes ?? null,
        transaction.createdAt,
      ],
    });
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.client.execute({
      sql: 'DELETE FROM transactions WHERE id = ?',
      args: [transactionId],
    });
  }
}

export class TursoActionPlanRepository implements IActionPlanRepository {
  private client: Client;

  constructor(client?: Client) {
    this.client = client || TursoClientProvider.getClient();
  }

  async listPlanEntries(userId: string): Promise<ActionPlanEntry[]> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM action_plan_entries WHERE user_id = ? ORDER BY effective_from DESC',
      args: [userId],
    });

    return rs.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      effectiveFrom: String(row.effective_from),
      baseAmountCents: Number(row.base_amount_cents),
      annualAdjustmentType: row.annual_adjustment_type as AnnualAdjustmentType,
      annualAdjustmentPct: row.annual_adjustment_pct ? Number(row.annual_adjustment_pct) : undefined,
      endDate: row.end_date ? String(row.end_date) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at),
    }));
  }

  async savePlanEntry(entry: ActionPlanEntry): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO action_plan_entries (
          id, user_id, effective_from, base_amount_cents,
          annual_adjustment_type, annual_adjustment_pct, end_date, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          effective_from = excluded.effective_from,
          base_amount_cents = excluded.base_amount_cents,
          annual_adjustment_type = excluded.annual_adjustment_type,
          annual_adjustment_pct = excluded.annual_adjustment_pct,
          end_date = excluded.end_date,
          notes = excluded.notes
      `,
      args: [
        entry.id,
        entry.userId,
        entry.effectiveFrom,
        entry.baseAmountCents,
        entry.annualAdjustmentType,
        entry.annualAdjustmentPct ?? null,
        entry.endDate ?? null,
        entry.notes ?? null,
        entry.createdAt,
      ],
    });
  }

  async deletePlanEntry(entryId: string): Promise<void> {
    await this.client.execute({
      sql: 'DELETE FROM action_plan_entries WHERE id = ?',
      args: [entryId],
    });
  }

  async listOverrides(userId: string): Promise<ActionMonthOverride[]> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM action_month_overrides WHERE user_id = ? ORDER BY year_month ASC',
      args: [userId],
    });

    return rs.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      yearMonth: String(row.year_month),
      overrideAmountCents: Number(row.override_amount_cents),
      isOneOffDeposit: Boolean(row.is_one_off_deposit),
      description: String(row.description),
    }));
  }

  async saveOverride(override: ActionMonthOverride): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO action_month_overrides (
          id, user_id, year_month, override_amount_cents, is_one_off_deposit, description
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, year_month) DO UPDATE SET
          override_amount_cents = excluded.override_amount_cents,
          is_one_off_deposit = excluded.is_one_off_deposit,
          description = excluded.description
      `,
      args: [
        override.id,
        override.userId,
        override.yearMonth,
        override.overrideAmountCents,
        override.isOneOffDeposit ? 1 : 0,
        override.description,
      ],
    });
  }

  async deleteOverride(overrideId: string): Promise<void> {
    await this.client.execute({
      sql: 'DELETE FROM action_month_overrides WHERE id = ?',
      args: [overrideId],
    });
  }

  async getActualRecord(userId: string, yearMonth: string): Promise<ActionActualRecord | null> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM action_actual_records WHERE user_id = ? AND year_month = ?',
      args: [userId, yearMonth],
    });

    if (rs.rows.length === 0) return null;
    const row = rs.rows[0];

    return {
      id: String(row.id),
      userId: String(row.user_id),
      yearMonth: String(row.year_month),
      plannedAmountCents: Number(row.planned_amount_cents),
      actualAmountCents: Number(row.actual_amount_cents),
      status: row.status as 'pending' | 'partial' | 'completed',
      cumulativeGapCents: Number(row.cumulative_gap_cents),
      updatedAt: String(row.updated_at),
    };
  }

  async saveActualRecord(record: ActionActualRecord): Promise<void> {
    await this.client.execute({
      sql: `
        INSERT INTO action_actual_records (
          id, user_id, year_month, planned_amount_cents,
          actual_amount_cents, status, cumulative_gap_cents, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, year_month) DO UPDATE SET
          planned_amount_cents = excluded.planned_amount_cents,
          actual_amount_cents = excluded.actual_amount_cents,
          status = excluded.status,
          cumulative_gap_cents = excluded.cumulative_gap_cents,
          updated_at = excluded.updated_at
      `,
      args: [
        record.id,
        record.userId,
        record.yearMonth,
        record.plannedAmountCents,
        record.actualAmountCents,
        record.status,
        record.cumulativeGapCents,
        new Date().toISOString(),
      ],
    });
  }

  async listActualRecords(userId: string, limit = 12): Promise<ActionActualRecord[]> {
    const rs = await this.client.execute({
      sql: 'SELECT * FROM action_actual_records WHERE user_id = ? ORDER BY year_month DESC LIMIT ?',
      args: [userId, limit],
    });

    return rs.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      yearMonth: String(row.year_month),
      plannedAmountCents: Number(row.planned_amount_cents),
      actualAmountCents: Number(row.actual_amount_cents),
      status: row.status as 'pending' | 'partial' | 'completed',
      cumulativeGapCents: Number(row.cumulative_gap_cents),
      updatedAt: String(row.updated_at),
    }));
  }
}
