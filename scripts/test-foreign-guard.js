// scripts/test-foreign-guard.js
// Automated validation for the Brazilian Asset Guard (Hard Constraint from Section 2)

const assert = require('assert');

// Port of guard logic for direct script execution
const FOREIGN_AND_CRYPTO_ETF_DENY_LIST = new Set([
  'IVVB11', 'SPXI11', 'SPXB11', 'NASD11', 'ACWI11', 'WRLD11',
  'EURP11', 'ASIA11', 'XINA11', 'EMBR11', 'USTK11', 'TEK311',
  'DNAI11', 'MILL11', 'HASH11', 'QBTC11', 'QETH11', 'BITH11',
  'ETHE11', 'CRPT11', 'WEB311', 'DEFI11', 'NFTS11', 'META11',
]);

const BRAZILIAN_ETF_ALLOW_LIST = new Set([
  'BOVA11', 'BOVV11', 'BOVS11', 'SMAL11', 'SMLL11', 'DIVO11',
  'BRAX11', 'IBXX11', 'PIBB11', 'ECOO11', 'ISUS11', 'FIND11',
  'MATB11', 'GOVE11',
]);

const KNOWN_STOCK_UNITS = new Set([
  'TAEE11', 'BPAC11', 'KLBN11', 'SAPR11', 'SANB11',
  'ALUP11', 'ENGI11', 'TIET11', 'SULA11', 'CPLE11',
]);

const KNOWN_FI_INFRA = new Set([
  'JURO11', 'BDIF11', 'IFRA11', 'KDIF11', 'XPID11', 'CPTI11', 'SNID11',
]);

const KNOWN_FIAGRO = new Set([
  'VGIA11', 'KNCA11', 'RZAG11', 'SNAG11', 'FGAA11', 'RURA11', 'EGAF11', 'AGRX11',
]);

function validateTicker(tickerInput) {
  if (!tickerInput || typeof tickerInput !== 'string') {
    return { isAllowed: false, reason: 'Invalid or empty' };
  }
  const clean = tickerInput.trim().toUpperCase();

  if (
    clean.startsWith('TESOURO') || clean.startsWith('CDB') ||
    clean.startsWith('LCI') || clean.startsWith('LCA') ||
    clean.startsWith('CRI') || clean.startsWith('CRA') ||
    clean.startsWith('DEBENTURE')
  ) {
    return { isAllowed: true, assetType: 'fixed_income', normalizedTicker: clean };
  }

  let baseTicker = clean;
  if (baseTicker.length === 6 && baseTicker.endsWith('F')) {
    baseTicker = baseTicker.slice(0, 5);
  }

  const b3Regex = /^[A-Z]{4}(\d{1,2})$/;
  const match = baseTicker.match(b3Regex);
  if (!match) {
    return { isAllowed: false, reason: 'Does not match B3 pattern' };
  }

  const digit = match[1];
  const bdrDigits = new Set(['31', '32', '33', '34', '35', '39', '41', '42', '43', '44', '45', '50']);
  if (bdrDigits.has(digit)) {
    return { isAllowed: false, reason: 'BDRs strictly forbidden' };
  }

  if (FOREIGN_AND_CRYPTO_ETF_DENY_LIST.has(baseTicker)) {
    return { isAllowed: false, reason: 'Foreign/crypto ETF forbidden' };
  }

  if (digit === '3' || digit === '4' || digit === '5' || digit === '6') {
    return { isAllowed: true, assetType: 'stock', normalizedTicker: clean };
  }

  if (digit === '11') {
    if (BRAZILIAN_ETF_ALLOW_LIST.has(baseTicker)) {
      return { isAllowed: true, assetType: 'etf_br', normalizedTicker: clean };
    }
    if (KNOWN_STOCK_UNITS.has(baseTicker)) {
      return { isAllowed: true, assetType: 'stock', normalizedTicker: clean };
    }
    if (KNOWN_FI_INFRA.has(baseTicker)) {
      return { isAllowed: true, assetType: 'fiinfra', normalizedTicker: clean };
    }
    if (KNOWN_FIAGRO.has(baseTicker)) {
      return { isAllowed: true, assetType: 'fiagro', normalizedTicker: clean };
    }
    return { isAllowed: true, assetType: 'fii', normalizedTicker: clean };
  }

  return { isAllowed: false, reason: 'Unrecognized B3 suffix' };
}

console.log('=== TESTE DA GUARDA ESTRITA DE ATIVOS BRASILEIROS ===\n');

// 1. Valid Brazilian Assets (MUST PASS)
const allowedCases = [
  { ticker: 'PETR4', expectedType: 'stock' },
  { ticker: 'VALE3', expectedType: 'stock' },
  { ticker: 'ITUB4', expectedType: 'stock' },
  { ticker: 'USIM5', expectedType: 'stock' },
  { ticker: 'ELET6', expectedType: 'stock' },
  { ticker: 'PETR4F', expectedType: 'stock' },
  { ticker: 'TAEE11', expectedType: 'stock' },
  { ticker: 'HGLG11', expectedType: 'fii' },
  { ticker: 'KNCR11', expectedType: 'fii' },
  { ticker: 'VGIA11', expectedType: 'fiagro' },
  { ticker: 'JURO11', expectedType: 'fiinfra' },
  { ticker: 'BOVA11', expectedType: 'etf_br' },
  { ticker: 'SMAL11', expectedType: 'etf_br' },
  { ticker: 'DIVO11', expectedType: 'etf_br' },
  { ticker: 'TESOURO SELIC 2029', expectedType: 'fixed_income' },
  { ticker: 'CDB BANCO DO BRASIL', expectedType: 'fixed_income' },
];

for (const tc of allowedCases) {
  const res = validateTicker(tc.ticker);
  assert.strictEqual(res.isAllowed, true, `Should allow ${tc.ticker}`);
  assert.strictEqual(res.assetType, tc.expectedType, `Asset type mismatch for ${tc.ticker}`);
  console.log(`[PASS] Permitido: ${tc.ticker} -> Tipo: ${res.assetType}`);
}

console.log('\n--- Testando Rejeição Estrita de Ativos Estrangeiros / Proibidos ---');

// 2. Prohibited Foreign Assets / BDRs / Crypto (MUST BE BLOCKED)
const blockedCases = [
  // BDRs
  'AAPL34', 'TSLA34', 'MSFT34', 'NVDA34', 'AMZO34', 'GOGL34', 'DISB34',
  // Foreign ETFs
  'IVVB11', 'SPXI11', 'NASD11', 'ACWI11', 'WRLD11', 'EURP11', 'ASIA11', 'XINA11',
  // Crypto ETFs
  'HASH11', 'QBTC11', 'QETH11', 'BITH11', 'CRPT11', 'WEB311',
  // Foreign Tickers
  'AAPL', 'MSFT', 'TSLA', 'BTC', 'ETH', 'SOL', 'SPY', 'QQQ',
  // Invalid formats
  '', '   ', '12345', 'PETR99'
];

for (const ticker of blockedCases) {
  const res = validateTicker(ticker);
  assert.strictEqual(res.isAllowed, false, `Should strictly block ${ticker}`);
  console.log(`[BLOCKED] Rejeitado com sucesso: '${ticker}' -> Motivo: ${res.reason}`);
}

console.log('\n✅ 100% dos testes da Guarda de Ativos Brasileiros foram APROVADOS!');
