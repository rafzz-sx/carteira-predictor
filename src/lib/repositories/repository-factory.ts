// src/lib/repositories/repository-factory.ts
// Factory pattern for persistence abstraction.
// Allows swapping between Turso (Primary), Firestore (Fallback), and Mock in < 1 hour.

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

export class RepositoryFactory {
  private static userRepoInstance: IUserRepository | null = null;
  private static portfolioRepoInstance: IPortfolioRepository | null = null;
  private static transactionRepoInstance: ITransactionRepository | null = null;
  private static actionPlanRepoInstance: IActionPlanRepository | null = null;

  private static getProvider(): 'turso' | 'firestore' | 'mock' {
    const provider = process.env.PERSISTENCE_PROVIDER?.toLowerCase();
    if (provider === 'turso' && process.env.TURSO_DATABASE_URL) {
      return 'turso';
    }
    // If Turso URL is explicitly configured, default to Turso
    if (process.env.TURSO_DATABASE_URL) {
      return 'turso';
    }
    return 'mock';
  }

  static getUserRepository(): IUserRepository {
    if (!this.userRepoInstance) {
      const provider = this.getProvider();
      this.userRepoInstance =
        provider === 'turso' ? new TursoUserRepository() : new MockUserRepository();
    }
    return this.userRepoInstance;
  }

  static getPortfolioRepository(): IPortfolioRepository {
    if (!this.portfolioRepoInstance) {
      const provider = this.getProvider();
      this.portfolioRepoInstance =
        provider === 'turso' ? new TursoPortfolioRepository() : new MockPortfolioRepository();
    }
    return this.portfolioRepoInstance;
  }

  static getTransactionRepository(): ITransactionRepository {
    if (!this.transactionRepoInstance) {
      const provider = this.getProvider();
      this.transactionRepoInstance =
        provider === 'turso' ? new TursoTransactionRepository() : new MockTransactionRepository();
    }
    return this.transactionRepoInstance;
  }

  static getActionPlanRepository(): IActionPlanRepository {
    if (!this.actionPlanRepoInstance) {
      const provider = this.getProvider();
      this.actionPlanRepoInstance =
        provider === 'turso' ? new TursoActionPlanRepository() : new MockActionPlanRepository();
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
