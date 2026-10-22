// scripts/test-formatters.js
// Unit tests for pt-BR formatting library
const assert = require('assert');

// Transpiled/direct test of formatters logic
const TRUE_MINUS = '\u2212';

function formatCurrency(cents, options = {}) {
  if (options.privacyMode) return '••••••';
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const value = absCents / 100;

  if (options.compact && absCents >= 100_000_000) {
    if (absCents >= 100_000_000_000) {
      const billions = (value / 1_000_000_000).toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      const prefix = isNegative ? `${TRUE_MINUS}R$ ` : options.showSign ? '+R$ ' : 'R$ ';
      return `${prefix}${billions} bi`;
    }
    const millions = (value / 1_000_000).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
    const prefix = isNegative ? `${TRUE_MINUS}R$ ` : options.showSign ? '+R$ ' : 'R$ ';
    return `${prefix}${millions} mi`;
  }

  const formattedValue = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (isNegative) return `${TRUE_MINUS}R$ ${formattedValue}`;
  if (options.showSign && cents > 0) return `+R$ ${formattedValue}`;
  return `R$ ${formattedValue}`;
}

function formatPercent(percent, options = {}) {
  const decimals = options.decimals ?? 2;
  const isNegative = percent < 0;
  const absValue = Math.abs(percent);
  const formatted = absValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (isNegative) return `${TRUE_MINUS}${formatted}%`;
  if (options.showSign && percent > 0) return `+${formatted}%`;
  return `${formatted}%`;
}

console.log('--- Testing formatCurrency ---');
assert.strictEqual(formatCurrency(123456), 'R$ 1.234,56');
assert.strictEqual(formatCurrency(-123456), '−R$ 1.234,56');
assert.strictEqual(formatCurrency(123456, { showSign: true }), '+R$ 1.234,56');
assert.strictEqual(formatCurrency(123456, { privacyMode: true }), '••••••');
assert.strictEqual(formatCurrency(250000000, { compact: true }), 'R$ 2,5 mi');
assert.strictEqual(formatCurrency(340000000000, { compact: true }), 'R$ 3,4 bi');
console.log('✅ formatCurrency tests passed.');

console.log('--- Testing formatPercent ---');
assert.strictEqual(formatPercent(12.34), '12,34%');
assert.strictEqual(formatPercent(12.34, { showSign: true }), '+12,34%');
assert.strictEqual(formatPercent(-0.45), '−0,45%');
console.log('✅ formatPercent tests passed.');

function parseCurrencyToCents(input) {
  if (typeof input === 'number') return Math.round(input * 100);
  if (!input) return 0;
  const cleaned = String(input).replace(/[^\d,.]/g, '').trim();
  if (!cleaned) return 0;

  if (cleaned.includes(',')) {
    const withoutThousands = cleaned.replace(/\./g, '');
    const [reais, centavos = '00'] = withoutThousands.split(',');
    const paddedCentavos = (centavos + '00').slice(0, 2);
    const parsedReais = parseInt(reais || '0', 10);
    const parsedCentavos = parseInt(paddedCentavos, 10);
    return isNaN(parsedReais) ? 0 : parsedReais * 100 + parsedCentavos;
  }

  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length === 2 && parts[1].length <= 2) {
      const padded = (parts[1] + '00').slice(0, 2);
      const parsedReais = parseInt(parts[0] || '0', 10);
      const parsedCentavos = parseInt(padded, 10);
      return isNaN(parsedReais) ? 0 : parsedReais * 100 + parsedCentavos;
    }
    const withoutDots = cleaned.replace(/\./g, '');
    const parsedReais = parseInt(withoutDots || '0', 10);
    return isNaN(parsedReais) ? 0 : parsedReais * 100;
  }

  const parsedReais = parseInt(cleaned, 10);
  return isNaN(parsedReais) ? 0 : parsedReais * 100;
}

console.log('--- Testing parseCurrencyToCents ---');
assert.strictEqual(parseCurrencyToCents('2500'), 250000);
assert.strictEqual(parseCurrencyToCents('2.500,00'), 250000);
assert.strictEqual(parseCurrencyToCents('2500,50'), 250050);
assert.strictEqual(parseCurrencyToCents('R$ 10.450,75'), 1045075);
assert.strictEqual(parseCurrencyToCents('1500.50'), 150050);
assert.strictEqual(parseCurrencyToCents(500), 50000);
console.log('✅ parseCurrencyToCents tests passed.');

