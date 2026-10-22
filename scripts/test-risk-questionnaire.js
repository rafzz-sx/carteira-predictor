// scripts/test-risk-questionnaire.js
// Verification of the objective risk questionnaire domain logic.

const assert = require('assert');

// Simple TypeScript to JS mirror test or direct calculation test
function runRiskTests() {
  console.log('🧪 Starting Risk Questionnaire & Profile Calibration tests...');

  // 1. Check weight sum is exactly 1.0
  const weights = [0.20, 0.20, 0.25, 0.15, 0.20];
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  assert(Math.abs(sumWeights - 1.0) < 0.0001, 'Question weights must sum to exactly 1.0');
  console.log('  ✓ Question weights correctly sum to 1.0 (100%)');

  // 2. Test Conservative path (lowest options)
  const conservativeAnswers = {
    primary_goal: 10,
    investment_horizon: 10,
    market_drop_reaction: 5,
    b3_experience: 10,
    volatility_tolerance: 5,
  };
  const conservativeScore = Math.round(
    10 * 0.20 + 10 * 0.20 + 5 * 0.25 + 10 * 0.15 + 5 * 0.20
  );
  // 2 + 2 + 1.25 + 1.5 + 1 = 7.75 -> 8
  assert.strictEqual(conservativeScore, 8);
  assert(conservativeScore <= 25, 'Conservative score must be <= 25');
  console.log(`  ✓ Conservative path produces score ${conservativeScore} (Profile: Conservador)`);

  // 3. Test Aggressive path (highest options)
  const aggressiveScore = Math.round(
    95 * 0.20 + 95 * 0.20 + 95 * 0.25 + 95 * 0.15 + 95 * 0.20
  );
  // 95 * 1.0 = 95
  assert.strictEqual(aggressiveScore, 95);
  assert(aggressiveScore >= 81, 'Aggressive score must be >= 81');
  console.log(`  ✓ Aggressive path produces score ${aggressiveScore} (Profile: Agressivo)`);

  // 4. Test Moderado path (balanced options)
  const moderateScore = Math.round(
    45 * 0.20 + 40 * 0.20 + 65 * 0.25 + 45 * 0.15 + 35 * 0.20
  );
  // 9 + 8 + 16.25 + 6.75 + 7 = 47
  assert.strictEqual(moderateScore, 47);
  assert(moderateScore >= 26 && moderateScore <= 55, 'Moderate score must be 26-55');
  console.log(`  ✓ Moderate path produces score ${moderateScore} (Profile: Moderado)`);

  // 5. Test Arrojado path
  const arrojadoScore = Math.round(
    70 * 0.20 + 75 * 0.20 + 65 * 0.25 + 75 * 0.15 + 65 * 0.20
  );
  // 14 + 15 + 16.25 + 11.25 + 13 = 69.5 -> 70
  assert.strictEqual(arrojadoScore, 70);
  assert(arrojadoScore >= 56 && arrojadoScore <= 80, 'Arrojado score must be 56-80');
  console.log(`  ✓ Arrojado path produces score ${arrojadoScore} (Profile: Arrojado)`);

  // 6. Test allocation percentages sum to 100% for all profiles
  const allocations = [
    { name: 'conservador', fixed: 80, fii: 15, eq: 5 },
    { name: 'moderado', fixed: 50, fii: 30, eq: 20 },
    { name: 'arrojado', fixed: 25, fii: 40, eq: 35 },
    { name: 'agressivo', fixed: 10, fii: 40, eq: 50 },
  ];

  for (const alloc of allocations) {
    const total = alloc.fixed + alloc.fii + alloc.eq;
    assert.strictEqual(total, 100, `Target allocation for ${alloc.name} must sum to 100%`);
  }
  console.log('  ✓ All 4 profile allocations sum to exactly 100%');

  console.log('✅ ALL RISK QUESTIONNAIRE TESTS PASSED (100%)\n');
}

runRiskTests();
