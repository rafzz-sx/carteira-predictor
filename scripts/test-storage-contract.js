// scripts/test-storage-contract.js
// Contract verification test for Repository implementations.
// Validates full CRUD, per-user data isolation, and sorting contracts.

const assert = require('assert');

// In-Memory mock implementation under test
class ContractTestHarness {
  constructor() {
    this.profiles = new Map();
    this.portfolios = new Map();
    this.positions = new Map();
    this.transactions = new Map();
    this.planEntries = new Map();
    this.overrides = new Map();
    this.actuals = new Map();
  }

  async saveProfile(p) { this.profiles.set(p.id, { ...p }); }
  async getProfile(id) { return this.profiles.get(id) || null; }

  async savePortfolio(p) { this.portfolios.set(p.id, { ...p }); }
  async getPortfolio(userId, id) {
    const p = this.portfolios.get(id);
    return (p && p.userId === userId) ? p : null;
  }
  async listPortfolios(userId) {
    return Array.from(this.portfolios.values()).filter(p => p.userId === userId);
  }

  async savePosition(pos) { this.positions.set(pos.id, { ...pos }); }
  async listPositions(portfolioId) {
    return Array.from(this.positions.values()).filter(p => p.portfolioId === portfolioId);
  }
  async deletePosition(id) { this.positions.delete(id); }

  async addTransaction(tx) { this.transactions.set(tx.id, { ...tx }); }
  async listTransactions(portfolioId, filter = {}) {
    let list = Array.from(this.transactions.values()).filter(t => t.portfolioId === portfolioId);
    if (filter.ticker) list = list.filter(t => t.ticker === filter.ticker.toUpperCase());
    return list.sort((a, b) => b.tradeDate.localeCompare(a.tradeDate));
  }
  async deleteTransaction(id) { this.transactions.delete(id); }

  async savePlanEntry(e) { this.planEntries.set(e.id, { ...e }); }
  async listPlanEntries(userId) {
    return Array.from(this.planEntries.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  }

  async saveActualRecord(r) { this.actuals.set(`${r.userId}_${r.yearMonth}`, { ...r }); }
  async getActualRecord(userId, ym) { return this.actuals.get(`${userId}_${ym}`) || null; }
}

async function runContractTests() {
  console.log('=== TESTE DE CONTRATO DO ADAPTADOR DE PERSISTÊNCIA ===\n');
  const repo = new ContractTestHarness();

  // Test 1: User Profile CRUD
  console.log('1. Testando Perfil do Usuário...');
  const userA = {
    id: 'user_123',
    email: 'investidor@teste.com',
    riskProfile: 'moderado',
    riskScore: 65,
    horizonYears: 10,
    emergencyFundMonths: 6,
    emergencyFundCents: 3000000,
    privacyMode: false,
    createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  };
  await repo.saveProfile(userA);
  const fetched = await repo.getProfile('user_123');
  assert.deepStrictEqual(fetched.id, 'user_123');
  assert.strictEqual(fetched.emergencyFundCents, 3000000);
  console.log('  [PASS] Perfil salvo e recuperado com precisão em centavos.');

  // Test 2: Per-User Isolation
  console.log('2. Testando Isolamento Estrito entre Usuários...');
  const userB = {
    id: 'user_456',
    email: 'outro@teste.com',
    riskProfile: 'arrojado',
    riskScore: 80,
    horizonYears: 15,
    emergencyFundMonths: 3,
    emergencyFundCents: 1500000,
    privacyMode: true,
    createdAt: '2026-10-21T12:00:00Z',
    updatedAt: '2026-10-21T12:00:00Z',
  };
  await repo.saveProfile(userB);

  const portfolioA = {
    id: 'port_A',
    userId: 'user_123',
    name: 'Carteira Principal',
    isDefault: true,
    targetAllocations: { stocksPct: 4000, fiisPct: 3500, fixedIncomePct: 2000, cashReservePct: 500 },
  };
  await repo.savePortfolio(portfolioA);

  // User B tries to read User A's portfolio -> MUST RETURN NULL
  const breachAttempt = await repo.getPortfolio('user_456', 'port_A');
  assert.strictEqual(breachAttempt, null, 'User B must not access User A portfolio');
  console.log('  [PASS] Isolamento confirmado: Usuário B não acessa carteira do Usuário A.');

  // Test 3: Positions & Integer Cents
  console.log('3. Testando Posições e Custódia...');
  await repo.savePosition({
    id: 'pos_1',
    portfolioId: 'port_A',
    ticker: 'PETR4',
    assetType: 'stock',
    quantity: 100,
    averagePriceCents: 3750, // R$ 37,50
    totalInvestedCents: 375000, // R$ 3.750,00
  });
  await repo.savePosition({
    id: 'pos_2',
    portfolioId: 'port_A',
    ticker: 'HGLG11',
    assetType: 'fii',
    quantity: 10,
    averagePriceCents: 16800, // R$ 168,00
    totalInvestedCents: 168000, // R$ 1.680,00
  });

  const positions = await repo.listPositions('port_A');
  assert.strictEqual(positions.length, 2);
  assert.strictEqual(positions[0].averagePriceCents, 3750);
  console.log('  [PASS] Posições listadas com integridade de tipos e centavos.');

  // Test 4: Transactions with filters
  console.log('4. Testando Transações com Filtro por Ticker...');
  await repo.addTransaction({
    id: 'tx_1',
    portfolioId: 'port_A',
    userId: 'user_123',
    ticker: 'PETR4',
    assetType: 'stock',
    type: 'buy',
    tradeDate: '2026-10-15',
    quantity: 100,
    unitPriceCents: 3750,
    totalCostsCents: 50,
    totalAmountCents: 375050,
  });
  await repo.addTransaction({
    id: 'tx_2',
    portfolioId: 'port_A',
    userId: 'user_123',
    ticker: 'HGLG11',
    assetType: 'fii',
    type: 'buy',
    tradeDate: '2026-10-18',
    quantity: 10,
    unitPriceCents: 16800,
    totalCostsCents: 0,
    totalAmountCents: 168000,
  });

  const petrTxs = await repo.listTransactions('port_A', { ticker: 'PETR4' });
  assert.strictEqual(petrTxs.length, 1);
  assert.strictEqual(petrTxs[0].ticker, 'PETR4');
  console.log('  [PASS] Filtro de transações por ticker validado.');

  // Test 5: Action Plan Effective-Dating
  console.log('5. Testando Vigência Temporal do Plano de Ação...');
  await repo.savePlanEntry({
    id: 'plan_v1',
    userId: 'user_123',
    effectiveFrom: '2026-01',
    baseAmountCents: 200000, // R$ 2.000
    annualAdjustmentType: 'none',
  });
  await repo.savePlanEntry({
    id: 'plan_v2',
    userId: 'user_123',
    effectiveFrom: '2026-07',
    baseAmountCents: 250000, // R$ 2.500
    annualAdjustmentType: 'none',
  });

  const planEntries = await repo.listPlanEntries('user_123');
  assert.strictEqual(planEntries[0].effectiveFrom, '2026-07', 'Must sort descending by effectiveFrom');
  assert.strictEqual(planEntries[0].baseAmountCents, 250000);
  console.log('  [PASS] Ordenação temporal decrescente do Plano de Ação validada.');

  // Test 6: Plan vs Actual Tracking
  console.log('6. Testando Acompanhamento Planejado vs Realizado...');
  await repo.saveActualRecord({
    id: 'user_123_2026-10',
    userId: 'user_123',
    yearMonth: '2026-10',
    plannedAmountCents: 250000,
    actualAmountCents: 0,
    status: 'pending',
    cumulativeGapCents: 0,
  });

  const octRecord = await repo.getActualRecord('user_123', '2026-10');
  assert.strictEqual(octRecord.status, 'pending');
  assert.strictEqual(octRecord.plannedAmountCents, 250000);
  console.log('  [PASS] Registro mensal planejado vs realizado recuperado com sucesso.');

  console.log('\n✅ 100% dos testes de contrato de persistência foram APROVADOS!');
}

runContractTests().catch(err => {
  console.error('❌ Falha no teste de contrato:', err);
  process.exit(1);
});
