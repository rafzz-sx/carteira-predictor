// scripts/test-screener.js
// Unit tests for B3 Screener domain, presets, and sorting engine.

const assert = require('assert');

// Mock data replicating domain ScreenerAsset
const TEST_ASSETS = [
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    assetClass: 'stock',
    sector: 'Financeiro',
    priceCents: 2890,
    changePercent: 1.4,
    pl: 4.8,
    pvp: 0.92,
    dividendYieldPct: 9.6,
    roePct: 21.5,
    netDebtEbitda: 0.0,
    dailyLiquidityCents: 45000000000,
  },
  {
    ticker: 'PETR4',
    name: 'Petrobras PN',
    assetClass: 'stock',
    sector: 'Petróleo e Gás',
    priceCents: 3842,
    changePercent: 1.15,
    pl: 4.1,
    pvp: 1.08,
    dividendYieldPct: 14.8,
    roePct: 26.8,
    netDebtEbitda: 0.85,
    dailyLiquidityCents: 120000000000,
  },
  {
    ticker: 'WEGE3',
    name: 'WEG ON',
    assetClass: 'stock',
    sector: 'Bens Industriais',
    priceCents: 5210,
    changePercent: 0.65,
    pl: 32.4,
    pvp: 10.2,
    dividendYieldPct: 1.8,
    roePct: 31.4,
    netDebtEbitda: -0.45,
    dailyLiquidityCents: 32000000000,
  },
  {
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    priceCents: 16450,
    changePercent: 0.35,
    pvp: 0.98,
    dividendYieldPct: 8.4,
    physicalVacancyPct: 5.8,
    dailyLiquidityCents: 9500000000,
  },
  {
    ticker: 'KNCR11',
    name: 'Kinea Rendimentos Imobiliários FII',
    assetClass: 'fii',
    sector: 'Imobiliário',
    priceCents: 10320,
    changePercent: 0.15,
    pvp: 1.01,
    dividendYieldPct: 11.2,
    physicalVacancyPct: 0.0,
    dailyLiquidityCents: 11000000000,
  },
  {
    ticker: 'VGIA11',
    name: 'Valora CRA FIAGRO',
    assetClass: 'fiagro',
    sector: 'Agronegócio',
    priceCents: 980,
    changePercent: 0.10,
    pvp: 0.99,
    dividendYieldPct: 13.5,
    dailyLiquidityCents: 5200000000,
  },
];

function filterScreenerAssets(assets, filters) {
  return assets.filter((asset) => {
    if (filters.searchQuery) {
      const q = filters.searchQuery.trim().toLowerCase();
      const match =
        asset.ticker.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        asset.sector.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filters.assetClass && filters.assetClass !== 'all') {
      if (asset.assetClass !== filters.assetClass) return false;
    }

    if (filters.minDy !== undefined && asset.dividendYieldPct < filters.minDy) return false;
    if (filters.maxDy !== undefined && asset.dividendYieldPct > filters.maxDy) return false;
    if (filters.minPvp !== undefined && asset.pvp < filters.minPvp) return false;
    if (filters.maxPvp !== undefined && asset.pvp > filters.maxPvp) return false;

    if (filters.minPl !== undefined) {
      if (asset.pl === undefined || asset.pl < filters.minPl) return false;
    }
    if (filters.maxPl !== undefined) {
      if (asset.pl === undefined || asset.pl > filters.maxPl) return false;
    }

    if (filters.minRoe !== undefined) {
      if (asset.roePct === undefined || asset.roePct < filters.minRoe) return false;
    }

    if (filters.maxNetDebtEbitda !== undefined) {
      if (asset.netDebtEbitda !== undefined && asset.netDebtEbitda > filters.maxNetDebtEbitda) {
        return false;
      }
    }

    if (filters.maxPhysicalVacancy !== undefined) {
      if (
        asset.physicalVacancyPct !== undefined &&
        asset.physicalVacancyPct > filters.maxPhysicalVacancy
      ) {
        return false;
      }
    }

    return true;
  });
}

function sortScreenerAssets(assets, sortBy = 'liquidity', sortOrder = 'desc') {
  const sorted = [...assets];
  const mult = sortOrder === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'dy':
        return (a.dividendYieldPct - b.dividendYieldPct) * mult;
      case 'pl':
        return ((a.pl ?? 9999) - (b.pl ?? 9999)) * mult;
      case 'pvp':
        return (a.pvp - b.pvp) * mult;
      case 'roe':
        return ((a.roePct ?? -999) - (b.roePct ?? -999)) * mult;
      case 'ticker':
        return a.ticker.localeCompare(b.ticker) * mult;
      case 'liquidity':
      default:
        return (a.dailyLiquidityCents - b.dailyLiquidityCents) * mult;
    }
  });

  return sorted;
}

function runScreenerTests() {
  console.log('🧪 Starting B3 Screener & Opportunities tests...');

  // 1. Test Dividend Kings Preset (DY >= 6%, ROE >= 12%, stock)
  const divKings = filterScreenerAssets(TEST_ASSETS, {
    assetClass: 'stock',
    minDy: 6.0,
    minRoe: 12.0,
    maxNetDebtEbitda: 3.0,
  });
  assert(divKings.length >= 2, 'Should find at least BBAS3 and PETR4');
  assert(divKings.some((a) => a.ticker === 'BBAS3'), 'BBAS3 must be in Dividend Kings');
  assert(divKings.some((a) => a.ticker === 'PETR4'), 'PETR4 must be in Dividend Kings');
  assert(!divKings.some((a) => a.ticker === 'WEGE3'), 'WEGE3 should not match (low DY)');
  console.log('  ✓ Preset "Reis dos Dividendos B3" correctly filters high DY + high ROE stocks');

  // 2. Test FII Brick with Discount (assetClass: fii, maxPvp: 1.0, minDy: 7.0, maxPhysicalVacancy: 10.0)
  const fiiDiscount = filterScreenerAssets(TEST_ASSETS, {
    assetClass: 'fii',
    maxPvp: 1.0,
    minDy: 7.0,
    maxPhysicalVacancy: 10.0,
  });
  assert(fiiDiscount.length === 1, 'Only HGLG11 matches (P/VP 0.98, DY 8.4%)');
  assert.strictEqual(fiiDiscount[0].ticker, 'HGLG11');
  console.log('  ✓ Preset "FIIs de Tijolo com Desconto" selects discounted real estate funds');

  // 3. Test Text Search
  const searchPetr = filterScreenerAssets(TEST_ASSETS, { searchQuery: 'petro' });
  assert.strictEqual(searchPetr.length, 1);
  assert.strictEqual(searchPetr[0].ticker, 'PETR4');
  console.log('  ✓ Instant search by company name ("petro") returns PETR4');

  // 4. Test Sorting by DY descending
  const sortedByDy = sortScreenerAssets(TEST_ASSETS, 'dy', 'desc');
  assert.strictEqual(sortedByDy[0].ticker, 'PETR4', 'PETR4 has highest DY (14.8%)');
  assert.strictEqual(sortedByDy[sortedByDy.length - 1].ticker, 'WEGE3', 'WEGE3 has lowest DY (1.8%)');
  console.log('  ✓ Sorting by Dividend Yield descending orders accurately');

  // 5. Test Sorting by P/L ascending (Value investing)
  const stocks = TEST_ASSETS.filter((a) => a.pl !== undefined);
  const sortedByPl = sortScreenerAssets(stocks, 'pl', 'asc');
  assert.strictEqual(sortedByPl[0].ticker, 'PETR4', 'PETR4 has lowest P/L (4.1x)');
  console.log('  ✓ Sorting by P/L ascending orders cheapest valuation first');

  console.log('✅ ALL SCREENER TESTS PASSED (100%)\n');
}

runScreenerTests();
