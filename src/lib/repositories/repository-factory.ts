// src/lib/repositories/repository-factory.ts
// Factory pattern for persistence abstraction.
// Allows swapping between Supabase (Primary), Turso (Alternative), and Mock.

import {
  IUserRepository,
  IPortfolioRepository,
  ITransactionRepository,
  IActionPlanRepository,
} from './interfaces';
import {
  MockUserRepository,
  MockPortfolioRepository,
  MockTransactionRepository,
  MockActionPlanRepository,
} from './mock-repository';
import {
  TursoUserRepository,
  TursoPortfolioRepository,
  TursoTransactionRepository,
  TursoActionPlanRepository,
} from './turso-repository';
import {
  SupabaseUserRepository,
  SupabasePortfolioRepository,
  SupabaseTransactionRepository,
  SupabaseActionPlanRepository,
} from './supabase-repository';

export class RepositoryFactory {
  private static userRepoInstance: IUserRepository | null = null;
  private static portfolioRepoInstance: IPortfolioRepository | null = null;
  private static transactionRepoInstance: ITransactionRepository | null = null;
  private static actionPlanRepoInstance: IActionPlanRepository | null = null;

  private static getProvider(): 'supabase' | 'turso' | 'mock' {
    const provider = process.env.PERSISTENCE_PROVIDER?.toLowerCase();

    // 1. Supabase check
    if (
      provider === 'supabase' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL
    ) {
      return 'supabase';
    }

    // 2. Turso check
    if (
      provider === 'turso' ||
      process.env.TURSO_DATABASE_URL
    ) {
      return 'turso';
    }

    // 3. Fallback to In-Memory Mock
    return 'mock';
  }

  static getUserRepository(): IUserRepository {
    if (!this.userRepoInstance) {
      const provider = this.getProvider();
      if (provider === 'supabase') {
        this.userRepoInstance = new SupabaseUserRepository();
      } else if (provider === 'turso') {
        this.userRepoInstance = new TursoUserRepository();
      } else {
        this.userRepoInstance = new MockUserRepository();
      }
    }
    return this.userRepoInstance;
  }

  static getPortfolioRepository(): IPortfolioRepository {
    if (!this.portfolioRepoInstance) {
      const provider = this.getProvider();
      if (provider === 'supabase') {
        this.portfolioRepoInstance = new SupabasePortfolioRepository();
      } else if (provider === 'turso') {
        this.portfolioRepoInstance = new TursoPortfolioRepository();
      } else {
        this.portfolioRepoInstance = new MockPortfolioRepository();
      }
    }
    return this.portfolioRepoInstance;
  }

  static getTransactionRepository(): ITransactionRepository {
    if (!this.transactionRepoInstance) {
      const provider = this.getProvider();
      if (provider === 'supabase') {
        this.transactionRepoInstance = new SupabaseTransactionRepository();
      } else if (provider === 'turso') {
        this.transactionRepoInstance = new TursoTransactionRepository();
      } else {
        this.transactionRepoInstance = new MockTransactionRepository();
      }
    }
    return this.transactionRepoInstance;
  }

  static getActionPlanRepository(): IActionPlanRepository {
    if (!this.actionPlanRepoInstance) {
      const provider = this.getProvider();
      if (provider === 'supabase') {
        this.actionPlanRepoInstance = new SupabaseActionPlanRepository();
      } else if (provider === 'turso') {
        this.actionPlanRepoInstance = new TursoActionPlanRepository();
      } else {
        this.actionPlanRepoInstance = new MockActionPlanRepository();
      }
    }
    return this.actionPlanRepoInstance;
  }

  // Testing helper to inject mock repositories
  static setInstances(repos: {
    user?: IUserRepository;
    portfolio?: IPortfolioRepository;
    transaction?: ITransactionRepository;
    actionPlan?: IActionPlanRepository;
  }) {
    if (repos.user) this.userRepoInstance = repos.user;
    if (repos.portfolio) this.portfolioRepoInstance = repos.portfolio;
    if (repos.transaction) this.transactionRepoInstance = repos.transaction;
    if (repos.actionPlan) this.actionPlanRepoInstance = repos.actionPlan;
  }

  static reset() {
    this.userRepoInstance = null;
    this.portfolioRepoInstance = null;
    this.transactionRepoInstance = null;
    this.actionPlanRepoInstance = null;
  }
}
