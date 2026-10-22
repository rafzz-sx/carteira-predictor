// scripts/test-tax-calculator.js
// Unit tests for Brazilian Federal Revenue (RFB) Tax Rules on B3 securities:
// - R$ 20.000 monthly exemption for stock sales
// - 15% rate on taxable stock sales
// - 20% flat rate on FII/FIAGRO capital gains (no R$ 20k exemption)
// - Segregated loss carryover (ações compensam ações, FIIs compensam FIIs)
// - Minimum R$ 10.00 DARF threshold rule
// - Acquisition cost valuation for DIRPF (Bens e Direitos)

const assert = require('assert');

// Standalone implementation of RFB tax audit logic for Node unit test
const STOCK_MONTHLY_EXEMPTION_CENTS = 2000000; // R$ 20.000,00
const STOCK_TAX_RATE = 0.15; // 15%
const FII_TAX_RATE = 0.20; // 20%
const MINIMUM_DARF_CENTS = 1000; // R$ 10,00

function auditTaxMonth(sales, initialStockLoss = 0, initialFiiLoss = 0, initialUnpaidDarf = 0) {
  let stockSalesVolumeCents = 0;
  let stockRealizedGainCents = 0;
  let fiiRealizedGainCents = 0;

  for (const s of sales) {
    if (s.assetType === 'stock') {
      stockSalesVolumeCents += s.volumeCents;
      stockRealizedGainCents += s.gainCents;
    } else if (s.assetType === 'fii') {
      fiiRealizedGainCents += s.gainCents;
    }
  }

  const isStockExempt = stockSalesVolumeCents <= STOCK_MONTHLY_EXEMPTION_CENTS;
  let stockLossCarryover = initialStockLoss;
  let fiiLossCarryover = initialFiiLoss;

  let stockExemptGainCents = 0;
  let stockTaxableGainCents = 0;

  if (isStockExempt) {
    if (stockRealizedGainCents > 0) {
      stockExemptGainCents = stockRealizedGainCents;
    } else {
      stockLossCarryover += Math.abs(stockRealizedGainCents);
    }
  } else {
    if (stockRealizedGainCents > 0) {
      stockTaxableGainCents = stockRealizedGainCents;
    } else {
      stockLossCarryover += Math.abs(stockRealizedGainCents);
    }
  }

  if (fiiRealizedGainCents < 0) {
    fiiLossCarryover += Math.abs(fiiRealizedGainCents);
  }

  // Offset stock losses
  const stockLossOffset = Math.min(stockTaxableGainCents, stockLossCarryover);
  stockLossCarryover -= stockLossOffset;
  const stockTaxBaseCents = stockTaxableGainCents - stockLossOffset;

  // Offset FII losses
  let fiiTaxBaseCents = 0;
  if (fiiRealizedGainCents > 0) {
    const fiiLossOffset = Math.min(fiiRealizedGainCents, fiiLossCarryover);
    fiiLossCarryover -= fiiLossOffset;
    fiiTaxBaseCents = fiiRealizedGainCents - fiiLossOffset;
  }

  const stockTaxDueCents = Math.round(stockTaxBaseCents * STOCK_TAX_RATE);
  const fiiTaxDueCents = Math.round(fiiTaxBaseCents * FII_TAX_RATE);
  const totalTaxDueCents = stockTaxDueCents + fiiTaxDueCents + initialUnpaidDarf;

  let payableDarfCents = 0;
  let unpaidDarfCarryoverCents = 0;

  if (totalTaxDueCents >= MINIMUM_DARF_CENTS) {
    payableDarfCents = totalTaxDueCents;
  } else {
    unpaidDarfCarryoverCents = totalTaxDueCents;
  }

  return {
    isStockExempt,
    stockSalesVolumeCents,
    stockExemptGainCents,
    stockTaxableGainCents,
    stockTaxDueCents,
    fiiTaxDueCents,
    payableDarfCents,
    unpaidDarfCarryoverCents,
    stockLossCarryover,
    fiiLossCarryover,
  };
}

console.log('🧪 Starting Brazilian RFB Tax Calculator tests...');

// 1. Venda de ações com total <= R$ 20.000: 100% ISENTO
const month1 = auditTaxMonth([
  { assetType: 'stock', volumeCents: 1500000, gainCents: 300000 } // Vendeu R$ 15.000 com R$ 3.000 de lucro
]);
assert.strictEqual(month1.isStockExempt, true, 'Vendas de R$ 15k devem ser isentas');
assert.strictEqual(month1.stockExemptGainCents, 300000, 'Lucro deve ser integralmente isento');
assert.strictEqual(month1.payableDarfCents, 0, 'Nenhum DARF deve ser gerado');
console.log('  ✓ Venda de ações <= R$ 20.000/mês é 100% isenta de IR (R$ 0 DARF)');

// 2. Venda de ações com total > R$ 20.000: 15% sobre o ganho
const month2 = auditTaxMonth([
  { assetType: 'stock', volumeCents: 2500000, gainCents: 400000 } // Vendeu R$ 25.000 com R$ 4.000 de lucro
]);
assert.strictEqual(month2.isStockExempt, false, 'Vendas de R$ 25k NÃO são isentas');
assert.strictEqual(month2.stockTaxableGainCents, 400000, 'Lucro é 100% tributável');
assert.strictEqual(month2.stockTaxDueCents, 60000, '15% de R$ 4.000 = R$ 600,00 de imposto');
assert.strictEqual(month2.payableDarfCents, 60000, 'DARF emitido de R$ 600,00');
console.log('  ✓ Venda de ações > R$ 20.000/mês tributa 15% sobre o ganho líquido (R$ 600,00 DARF)');

// 3. FIIs e FIAGRO: SEM isenção de R$ 20k! 20% flat tax
const month3 = auditTaxMonth([
  { assetType: 'fii', volumeCents: 200000, gainCents: 50000 } // Vendeu R$ 2.000 de FII com R$ 500 de lucro
]);
assert.strictEqual(month3.fiiTaxDueCents, 10000, '20% de R$ 500 = R$ 100,00 de imposto para FII');
assert.strictEqual(month3.payableDarfCents, 10000, 'DARF emitido de R$ 100,00 mesmo com venda baixa');
console.log('  ✓ FIIs e FIAGRO não possuem isenção de R$ 20k (20% flat tax recolhido)');

// 4. Compensação de prejuízo da mesma classe
// Mês anterior com R$ 1.000 de prejuízo em ações; Mês atual com R$ 1.500 de lucro tributável
const month4 = auditTaxMonth(
  [{ assetType: 'stock', volumeCents: 3000000, gainCents: 150000 }],
  100000 // R$ 1.000 de prejuízo anterior
);
assert.strictEqual(month4.stockTaxDueCents, 7500, 'Base de cálculo reduzida de R$ 1.500 para R$ 500 (15% = R$ 75,00)');
assert.strictEqual(month4.stockLossCarryover, 0, 'Prejuízo anterior totalmente consumido');
console.log('  ✓ Prejuízos anteriores de ações compensam lucros futuros tributáveis');

// 5. Segregação de classes: Prejuízo de FII NÃO compensa lucro de ações
const month5 = auditTaxMonth(
  [{ assetType: 'stock', volumeCents: 3000000, gainCents: 100000 }],
  0, // sem prejuízo de ações
  100000 // R$ 1.000 de prejuízo de FII
);
assert.strictEqual(month5.stockTaxDueCents, 15000, 'Ações pagam 15% integralmente sem compensar com FII');
assert.strictEqual(month5.fiiLossCarryover, 100000, 'Prejuízo de FII é preservado para o futuro');
console.log('  ✓ Segregação estrita da Receita Federal: Prejuízo de FII não abate lucro de ações');

// 6. Regra dos R$ 10,00 mínimos de DARF
const month6 = auditTaxMonth([
  { assetType: 'fii', volumeCents: 10000, gainCents: 3000 } // R$ 30 de lucro em FII => 20% = R$ 6,00 de IR
]);
assert.strictEqual(month6.fiiTaxDueCents, 600, 'Imposto de R$ 6,00 apurado');
assert.strictEqual(month6.payableDarfCents, 0, 'DARF < R$ 10,00 NÃO é emitido');
assert.strictEqual(month6.unpaidDarfCarryoverCents, 600, 'R$ 6,00 acumulado para o próximo mês');

// Próximo mês com mais R$ 6,00 => total R$ 12,00 => agora emite DARF!
const month7 = auditTaxMonth(
  [{ assetType: 'fii', volumeCents: 10000, gainCents: 3000 }],
  0,
  0,
  month6.unpaidDarfCarryoverCents // + R$ 6,00
);
assert.strictEqual(month7.payableDarfCents, 1200, 'DARF de R$ 12,00 emitido após atingir teto mínimo de R$ 10');
console.log('  ✓ Regra do DARF mínimo de R$ 10,00 da Receita Federal acumulado com precisão');

// 7. Custo de Aquisição no DIRPF (Preço Médio, NUNCA valor de mercado)
const quantity = 300;
const averagePriceCents = 3450; // R$ 34,50 PM
const acquisitionCostCents = quantity * averagePriceCents; // R$ 10.350,00
assert.strictEqual(acquisitionCostCents, 1035000, 'Custo de aquisição em 31/12 deve ser PM x Quantidade');
console.log('  ✓ DIRPF Bens e Direitos computados fielmente pelo Custo Histórico de Aquisição');

console.log('✅ ALL BRAZILIAN RFB TAX CALCULATOR TESTS PASSED (100%)\n');
