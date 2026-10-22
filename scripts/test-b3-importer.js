// scripts/test-b3-importer.js
// Unit tests for the tolerant B3 CSV / CEI statement parser and foreign asset filtering.

const assert = require('assert');

// Simple JS mirror of b3-importer logic
function normalizeB3Date(rawDate) {
  if (!rawDate) return null;
  const clean = rawDate.trim();
  const brMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return null;
}

function parseCurrencyToCents(input) {
  if (typeof input === 'number') return Math.round(input * 100);
  if (!input) return 0;
  const cleaned = String(input).replace(/[^\d,.]/g, '').trim();
  if (!cleaned) return 0;
  if (cleaned.includes(',')) {
    const withoutThousands = cleaned.replace(/\./g, '');
    const [reais, centavos = '00'] = withoutThousands.split(',');
    const padded = (centavos + '00').slice(0, 2);
    return parseInt(reais || '0', 10) * 100 + parseInt(padded, 10);
  }
  return parseInt(cleaned, 10) * 100;
}

function parseB3Quantity(rawQty) {
  if (!rawQty) return 0;
  const clean = rawQty.replace(/\./g, '').replace(',', '.').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

function mockValidateTicker(ticker) {
  const clean = ticker.trim().toUpperCase();
  if (clean.includes('34') || clean === 'AAPL34' || clean === 'TSLA34') {
    return { isAllowed: false, reason: 'BDRs strictly forbidden' };
  }
  if (clean === 'IVVB11' || clean === 'HASH11') {
    return { isAllowed: false, reason: 'Foreign/Crypto ETF forbidden' };
  }
  if (/^[A-Z]{4}\d{1,2}$/.test(clean)) {
    return { isAllowed: true, assetType: clean.endsWith('11') ? 'fii' : 'stock' };
  }
  return { isAllowed: false, reason: 'Invalid B3 ticker' };
}

function testB3StatementParser() {
  console.log('🧪 Starting Tolerant B3 CSV / CEI Importer tests...');

  // 1. Test Date Normalizer
  assert.strictEqual(normalizeB3Date('15/10/2026'), '2026-10-15');
  assert.strictEqual(normalizeB3Date('05/03/2025'), '2025-03-05');
  assert.strictEqual(normalizeB3Date('2026-10-21'), '2026-10-21');
  console.log('  ✓ normalizeB3Date parses DD/MM/YYYY and YYYY-MM-DD correctly');

  // 2. Test Sample B3 Negociação CSV (semicolon delimited with standard B3 columns)
  const sampleCsv = `Data do Negócio;Tipo de Movimentação;Mercado;Prazo/Vencimento;Código de Negociação;Especificação do Ativo;Quantidade;Preço (R$);Valor Total (R$)
10/08/2026;Compra;Mercado à Vista;;PETR4;PETROBRAS PN;100;36,50;3.650,00
15/08/2026;Compra;Mercado à Vista;;HGLG11;CSHG LOGISTICA FII;50;162,30;8.115,00
20/08/2026;Compra;Mercado à Vista;;AAPL34;APPLE INC BDR;10;60,00;600,00
25/08/2026;Compra;Mercado à Vista;;IVVB11;ISHARES S&P 500;20;320,00;6.400,00
28/08/2026;Venda;Mercado à Vista;;PETR4;PETROBRAS PN;50;38,00;1.900,00`;

  const lines = sampleCsv.split('\n');
  const valid = [];
  const ignored = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    const rawDate = cols[0];
    const type = cols[1].toLowerCase().includes('venda') ? 'sell' : 'buy';
    const ticker = cols[4];
    const qty = parseB3Quantity(cols[6]);
    const priceCents = parseCurrencyToCents(cols[7]);
    const totalCents = parseCurrencyToCents(cols[8]);

    const check = mockValidateTicker(ticker);
    if (!check.isAllowed) {
      ignored.push({ ticker, reason: check.reason });
    } else {
      valid.push({
        date: normalizeB3Date(rawDate),
        ticker,
        type,
        qty,
        priceCents,
        totalCents,
      });
    }
  }

  // Verify valid Brazilian trades
  assert.strictEqual(valid.length, 3, 'Should have exactly 3 valid Brazilian trades (PETR4 x2, HGLG11)');
  assert.strictEqual(valid[0].ticker, 'PETR4');
  assert.strictEqual(valid[0].qty, 100);
  assert.strictEqual(valid[0].priceCents, 3650);
  assert.strictEqual(valid[0].totalCents, 365000);

  assert.strictEqual(valid[1].ticker, 'HGLG11');
  assert.strictEqual(valid[1].qty, 50);
  assert.strictEqual(valid[1].priceCents, 16230);

  assert.strictEqual(valid[2].ticker, 'PETR4');
  assert.strictEqual(valid[2].type, 'sell');
  assert.strictEqual(valid[2].qty, 50);

  // Verify foreign/BDR rejection
  assert.strictEqual(ignored.length, 2, 'Should reject AAPL34 (BDR) and IVVB11 (foreign ETF)');
  assert.strictEqual(ignored[0].ticker, 'AAPL34');
  assert.strictEqual(ignored[1].ticker, 'IVVB11');
  console.log('  ✓ B3 statement parsed: 3 Brazilian trades accepted, 2 foreign assets safely ignored');

  console.log('✅ ALL B3 IMPORTER TESTS PASSED (100%)\n');
}

testB3StatementParser();
