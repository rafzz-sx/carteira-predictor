// src/lib/repositories/supabase-repository.ts
// Primary Cloud Storage Adapter using Supabase (PostgreSQL).
// Enables instant real-time synchronization between Desktop (PC) and Mobile devices.

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../supabase/client';
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

export class SupabaseUserRepository implements IUserRepository {
  private getClient(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured.');
    return client;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: String(data.id),
      email: String(data.email || ''),
      name: data.name ? String(data.name) : undefined,
      riskProfile: data.risk_profile as InvestorRiskProfile,
      riskScore: Number(data.risk_score),
      horizonYears: Number(data.horizon_years),
      emergencyFundMonths: Number(data.emergency_fund_months),
      emergencyFundCents: Number(data.emergency_fund_cents || 0),
      monthlyExpensesCents: data.monthly_expenses_cents ? Number(data.monthly_expenses_cents) : undefined,
      monthlyNetIncomeCents: data.monthly_net_income_cents ? Number(data.monthly_net_income_cents) : undefined,
      privacyMode: Boolean(data.privacy_mode),
      createdAt: String(data.created_at),
      updatedAt: String(data.updated_at),
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const client = this.getClient();
    const { error } = await client.from('user_profiles').upsert({
      id: profile.id,
      email: profile.email || '',
      name: profile.name ?? null,
      risk_profile: profile.riskProfile,
      risk_score: profile.riskScore,
      horizon_years: profile.horizonYears,
      emergency_fund_months: profile.emergencyFundMonths,
      emergency_fund_cents: profile.emergencyFundCents,
      monthly_expenses_cents: profile.monthlyExpensesCents ?? null,
      monthly_net_income_cents: profile.monthlyNetIncomeCents ?? null,
      privacy_mode: profile.privacyMode,
      created_at: profile.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving user profile in Supabase:', error);
      throw error;
    }
  }
}

export class SupabasePortfolioRepository implements IPortfolioRepository {
  private getClient(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured.');
    return client;
  }

  async getPortfolio(userId: string, portfolioId: string): Promise<Portfolio | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: String(data.id),
      userId: String(data.user_id),
      name: String(data.name),
      isDefault: Boolean(data.is_default),
      targetAllocations: {
        stocksPct: Number(data.stocks_pct),
        fiisPct: Number(data.fiis_pct),
        fixedIncomePct: Number(data.fixed_income_pct),
        cashReservePct: Number(data.cash_reserve_pct),
      },
      createdAt: String(data.created_at),
      updatedAt: String(data.updated_at),
    };
  }

  async listPortfolios(userId: string): Promise<Portfolio[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
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
    const client = this.getClient();

    // Ensure user profile exists to satisfy foreign key
    await client.from('user_profiles').upsert(
      {
        id: portfolio.userId,
        email: '',
        name: 'Usuário ' + portfolio.userId.slice(0, 8),
        risk_profile: 'moderado',
        risk_score: 50,
        horizon_years: 10,
        emergency_fund_months: 6,
        emergency_fund_cents: 0,
        privacy_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: true }
    );

    const { error } = await client.from('portfolios').upsert({
      id: portfolio.id,
      user_id: portfolio.userId,
      name: portfolio.name,
      is_default: portfolio.isDefault,
      stocks_pct: portfolio.targetAllocations.stocksPct,
      fiis_pct: portfolio.targetAllocations.fiisPct,
      fixed_income_pct: portfolio.targetAllocations.fixedIncomePct,
      cash_reserve_pct: portfolio.targetAllocations.cashReservePct,
      created_at: portfolio.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving portfolio in Supabase:', error);
      throw error;
    }
  }

  async listPositions(portfolioId: string): Promise<PortfolioPosition[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('portfolio_positions')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('ticker', { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
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
    const client = this.getClient();
    const { error } = await client.from('portfolio_positions').upsert({
      id: position.id,
      portfolio_id: position.portfolioId,
      ticker: position.ticker,
      asset_type: position.assetType,
      quantity: position.quantity,
      average_price_cents: position.averagePriceCents,
      total_invested_cents: position.totalInvestedCents,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving position in Supabase:', error);
      throw error;
    }
  }

  async deletePosition(positionId: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client
      .from('portfolio_positions')
      .delete()
      .eq('id', positionId);

    if (error) {
      console.error('Error deleting position in Supabase:', error);
      throw error;
    }
  }
}

export class SupabaseTransactionRepository implements ITransactionRepository {
  private getClient(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured.');
    return client;
  }

  async listTransactions(
    portfolioId: string,
    filter?: { ticker?: string; type?: string; fromDate?: string; toDate?: string }
  ): Promise<Transaction[]> {
    const client = this.getClient();
    let query = client
      .from('transactions')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('trade_date', { ascending: false });

    if (filter?.ticker) {
      query = query.eq('ticker', filter.ticker.toUpperCase());
    }
    if (filter?.type) {
      query = query.eq('type', filter.type);
    }
    if (filter?.fromDate) {
      query = query.gte('trade_date', filter.fromDate);
    }
    if (filter?.toDate) {
      query = query.lte('trade_date', filter.toDate);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      portfolioId: String(row.portfolio_id),
      userId: String(row.user_id),
      ticker: String(row.ticker),
      assetType: row.asset_type as BrazilianAssetType,
      type: row.type as TransactionType,
      tradeDate: String(row.trade_date),
      quantity: Number(row.quantity),
      unitPriceCents: Number(row.unit_price_cents),
      totalCostsCents: Number(row.total_costs_cents || 0),
      totalAmountCents: Number(row.total_amount_cents),
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at),
    }));
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const client = this.getClient();
    const { error } = await client.from('transactions').insert({
      id: transaction.id,
      portfolio_id: transaction.portfolioId,
      user_id: transaction.userId,
      ticker: transaction.ticker,
      asset_type: transaction.assetType,
      type: transaction.type,
      trade_date: transaction.tradeDate,
      quantity: transaction.quantity,
      unit_price_cents: transaction.unitPriceCents,
      total_costs_cents: transaction.totalCostsCents,
      total_amount_cents: transaction.totalAmountCents,
      notes: transaction.notes ?? null,
      created_at: transaction.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error('Error adding transaction in Supabase:', error);
      throw error;
    }
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting transaction in Supabase:', error);
      throw error;
    }
  }
}

export class SupabaseActionPlanRepository implements IActionPlanRepository {
  private getClient(): SupabaseClient {
    const client = getSupabaseClient();
    if (!client) throw new Error('Supabase client is not configured.');
    return client;
  }

  async listPlanEntries(userId: string): Promise<ActionPlanEntry[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('action_plan_entries')
      .select('*')
      .eq('user_id', userId)
      .order('effective_from', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
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
    const client = this.getClient();
    const { error } = await client.from('action_plan_entries').upsert({
      id: entry.id,
      user_id: entry.userId,
      effective_from: entry.effectiveFrom,
      base_amount_cents: entry.baseAmountCents,
      annual_adjustment_type: entry.annualAdjustmentType,
      annual_adjustment_pct: entry.annualAdjustmentPct ?? null,
      end_date: entry.endDate ?? null,
      notes: entry.notes ?? null,
      created_at: entry.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving action plan entry in Supabase:', error);
      throw error;
    }
  }

  async deletePlanEntry(entryId: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client
      .from('action_plan_entries')
      .delete()
      .eq('id', entryId);

    if (error) {
      console.error('Error deleting plan entry in Supabase:', error);
      throw error;
    }
  }

  async listOverrides(userId: string): Promise<ActionMonthOverride[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('action_month_overrides')
      .select('*')
      .eq('user_id', userId)
      .order('year_month', { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      yearMonth: String(row.year_month),
      overrideAmountCents: Number(row.override_amount_cents),
      isOneOffDeposit: Boolean(row.is_one_off_deposit),
      description: String(row.description),
    }));
  }

  async saveOverride(override: ActionMonthOverride): Promise<void> {
    const client = this.getClient();
    const { error } = await client.from('action_month_overrides').upsert({
      id: override.id,
      user_id: override.userId,
      year_month: override.yearMonth,
      override_amount_cents: override.overrideAmountCents,
      is_one_off_deposit: override.isOneOffDeposit,
      description: override.description,
    });

    if (error) {
      console.error('Error saving month override in Supabase:', error);
      throw error;
    }
  }

  async deleteOverride(overrideId: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client
      .from('action_month_overrides')
      .delete()
      .eq('id', overrideId);

    if (error) {
      console.error('Error deleting override in Supabase:', error);
      throw error;
    }
  }

  async getActualRecord(userId: string, yearMonth: string): Promise<ActionActualRecord | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from('action_actual_records')
      .select('*')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: String(data.id),
      userId: String(data.user_id),
      yearMonth: String(data.year_month),
      plannedAmountCents: Number(data.planned_amount_cents),
      actualAmountCents: Number(data.actual_amount_cents),
      status: data.status as 'pending' | 'partial' | 'completed',
      cumulativeGapCents: Number(data.cumulative_gap_cents),
      updatedAt: String(data.updated_at),
    };
  }

  async saveActualRecord(record: ActionActualRecord): Promise<void> {
    const client = this.getClient();
    const { error } = await client.from('action_actual_records').upsert({
      id: record.id,
      user_id: record.userId,
      year_month: record.yearMonth,
      planned_amount_cents: record.plannedAmountCents,
      actual_amount_cents: record.actualAmountCents,
      status: record.status,
      cumulative_gap_cents: record.cumulativeGapCents,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving actual record in Supabase:', error);
      throw error;
    }
  }

  async listActualRecords(userId: string, limit = 12): Promise<ActionActualRecord[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('action_actual_records')
      .select('*')
      .eq('user_id', userId)
      .order('year_month', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      yearMonth: String(row.year_month),
      plannedAmountCents: Number(row.planned_amount_cents),
      actualAmountCents: Number(row.actual_amount_cents),
      status: row.status as 'pending' | 'partial' | 'completed',
      cumulativeGapCents: Number(row.cumulative_gap_cents),
      notes: row.notes ? String(row.notes) : undefined,
      updatedAt: String(row.updated_at),
    }));
  }
}
