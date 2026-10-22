// scripts/test-portfolio-math.js
// Known-answer fixtures test for PortfolioMath domain logic
const assert = require('assert');

// Direct port of PortfolioMath logic for test script
class PortfolioMath {
  static applyBuy(current, buyQuantity, unitPriceCents, feesCents = 0) {
    const previousTotalCents = current.quantity * current.averagePriceCents;
    const addedTotalCents = buyQuantity * unitPriceCents + feesCents;
    const newQuantity = current.quantity + buyQuantity;
    const newAveragePriceCents = Math.round((previousTotalCents + addedTotalCents) / newQuantity);
    return {
      ticker: current.ticker,
      quantity: newQuantity,
      averagePriceCents: newAveragePriceCents,
      totalInvestedCents: newQuantity * newAveragePriceCents,
    };
  }

  static applySell(current, sellQuantity, unitPriceCents, feesCents = 0) {
    if (sellQuantity > current.quantity) {
      throw new Error('Short selling forbidden');
    }
    const grossRevenueCents = sellQuantity * unitPriceCents;
    const costBasisCents = sellQuantity * current.averagePriceCents;
    const realizedGainLossCents = grossRevenueCents - costBasisCents - feesCents;
    const remainingQuantity = current.quantity - sellQuantity;
    return {
      updatedPosition: {
        ticker: current.ticker,
        quantity: remainingQuantity,
        averagePriceCents: remainingQuantity > 0 ? current.averagePriceCents : 0,
        totalInvestedCents: remainingQuantity * (remainingQuantity > 0 ? current.averagePriceCents : 0),
      },
      realizedGainLossCents,
      tradeCostCents: grossRevenueCents,
    };
  }

  static calculateUnrealized(current, currentQuoteCents) {
    const currentTotalCents = current.quantity * currentQuoteCents;
    const costBasisCents = current.quantity * current.averagePriceCents;
    const unrealizedGainLossCents = currentTotalCents - costBasisCents;
    const unrealizedPercent =
      costBasisCents > 0
        ? ((currentTotalCents - costBasisCents) / costBasisCents) * 100
        : 0;
    return {
      currentTotalCents,
      unrealizedGainLossCents,
      unrealizedPercent: Number(unrealizedPercent.toFixed(2)),
    };
  }

  static applySplit(current, ratio) {
    const newQuantity = Math.round(current.quantity * ratio);
    const newAveragePriceCents = Math.round(current.averagePriceCents / ratio);
    return {
      ticker: current.ticker,
      quantity: newQuantity,
      averagePriceCents: newAveragePriceCents,
      totalInvestedCents: newQuantity * newAveragePriceCents,
    };
  }
}

console.log('=== TESTES DE MATEMÁTICA FINANCEIRA E PREÇO MÉDIO (RECEITA FEDERAL) ===\n');

// Fixture 1: Initial Buy of 100 shares of PETR4 at R$ 30,00 (fees: R$ 5,00)
console.log('1. Primeira compra com taxas...');
let pos = { ticker: 'PETR4', quantity: 0, averagePriceCents: 0, totalInvestedCents: 0 };
pos = PortfolioMath.applyBuy(pos, 100, 3000, 500); // 100 * 3000 + 500 = 300500 -> PM = 3005 cents = R$ 30,05
assert.strictEqual(pos.quantity, 100);
assert.strictEqual(pos.averagePriceCents, 3005);
console.log(`  [PASS] Compra 1: 100 cotas a R$ 30,00 (+R$ 5 taxa) -> PM = R$ 30,05`);

// Fixture 2: Second Buy of 100 shares at R$ 40,00 (no fees)
console.log('2. Segunda compra com preço diferente (média ponderada)...');
pos = PortfolioMath.applyBuy(pos, 100, 4000, 0); // (300500 + 400000) / 200 = 700500 / 200 = 3503 (R$ 35,03)
assert.strictEqual(pos.quantity, 200);
assert.strictEqual(pos.averagePriceCents, 3503);
console.log(`  [PASS] Compra 2: 100 cotas a R$ 40,00 -> Nova custódia: 200 cotas, PM = R$ 35,03`);

// Fixture 3: Sell 50 shares at R$ 50,00 (Realized Gain)
console.log('3. Venda parcial com lucro (PM não muda)...');
const sellResult = PortfolioMath.applySell(pos, 50, 5000, 200); // Venda a R$ 50,00 com taxa R$ 2,00
// Lucro bruto: 50 * (5000 - 3503) = 50 * 1497 = 74850 cents = R$ 748,50. Menos taxa R$ 2,00 = R$ 746,50 (74650 cents)
assert.strictEqual(sellResult.updatedPosition.quantity, 150);
assert.strictEqual(sellResult.updatedPosition.averagePriceCents, 3503, 'PM must remain unchanged after sell');
assert.strictEqual(sellResult.realizedGainLossCents, 74650);
pos = sellResult.updatedPosition;
console.log(`  [PASS] Venda 50 cotas a R$ 50,00 -> Lucro líquido: R$ 746,50. PM mantido em R$ 35,03.`);

// Fixture 4: Unrealized P&L when market quote is R$ 42,00
console.log('4. Cálculo de Lucro/Prejuízo Não Realizado (Marcação a Mercado)...');
const unrealized = PortfolioMath.calculateUnrealized(pos, 4200); // 150 cotas a R$ 42,00 (PM 35,03)
// Valor atual: 150 * 4200 = 630000 (R$ 6.300,00). Custo: 150 * 3503 = 525450 (R$ 5.254,50). Ganho: 104550 (R$ 1.045,50)
assert.strictEqual(unrealized.currentTotalCents, 630000);
assert.strictEqual(unrealized.unrealizedGainLossCents, 104550);
assert.strictEqual(unrealized.unrealizedPercent, 19.90);
console.log(`  [PASS] Cotação R$ 42,00 -> Ganho não realizado: +R$ 1.045,50 (+19,90%).`);

// Fixture 5: Desdobramento 1 para 2
console.log('5. Desdobramento (Split 1:2)...');
const splitPos = PortfolioMath.applySplit(pos, 2);
assert.strictEqual(splitPos.quantity, 300);
assert.strictEqual(splitPos.averagePriceCents, 1752); // Math.round(3503 / 2)
console.log(`  [PASS] Desdobramento 1:2 -> Quantidade: 300 cotas, PM: R$ 17,52.`);

console.log('\n✅ 100% dos testes de matemática financeira foram APROVADOS!');
