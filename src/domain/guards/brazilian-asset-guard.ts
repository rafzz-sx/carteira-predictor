// src/domain/guards/brazilian-asset-guard.ts
// HARD CONSTRAINT: Exclusively Brazilian assets (B3 & Renda Fixa Nacional).
// Blocks BDRs, Foreign Exposure ETFs, Crypto, and Foreign Securities.

export type BrazilianAssetType =
  | 'stock'        // Ação ON (3), PN (4), PNA/PNB (5/6), Unit (11)
  | 'fii'          // Fundo de Investimento Imobiliário
  | 'fiagro'       // FIAGRO
  | 'fiinfra'      // FI-Infra
  | 'etf_br'       // ETF atrelado a índice 100% brasileiro (ex: BOVA11, SMAL11, DIVO11)
  | 'fixed_income';// Tesouro Direto, CDB, LCI, LCA, CRI, CRA, Debêntures

export interface AssetValidationResult {
  isAllowed: boolean;
  assetType?: BrazilianAssetType;
  normalizedTicker: string;
  rejectionReason?: string;
}

// Explicit Deny List for Foreign Exposure ETFs and Crypto ETFs traded on B3
const FOREIGN_AND_CRYPTO_ETF_DENY_LIST = new Set([
  'IVVB11', // S&P 500
  'SPXI11', // S&P 500
  'SPXB11', // S&P 500
  'NASD11', // Nasdaq 100
  'ACWI11', // MSCI ACWI World
  'WRLD11', // FTSE Global All Cap
  'EURP11', // MSCI Europe
  'ASIA11', // MSCI Asia
  'XINA11', // MSCI China
  'EMBR11', // Mercados Emergentes
  'USTK11', // US Technology
  'TEK311', // Big Techs
  'DNAI11', // Genomics
  'MILL11', // Millennials
  'HASH11', // NCI Crypto Index
  'QBTC11', // Bitcoin
  'QETH11', // Ethereum
  'BITH11', // Bitcoin
  'ETHE11', // Ethereum
  'CRPT11', // Crypto
  'WEB311', // Web3 Crypto
  'DEFI11', // DeFi Crypto
  'NFTS11', // NFTs Crypto
  'META11', // Metaverso
]);

// Explicit Allow List for Brazilian Index ETFs
const BRAZILIAN_ETF_ALLOW_LIST = new Set([
  'BOVA11', // Ibovespa
  'BOVV11', // Ibovespa
  'BOVS11', // Ibovespa
  'SMAL11', // Small Cap B3
  'SMLL11', // Small Cap B3
  'DIVO11', // IDIV (Dividendos B3)
  'BRAX11', // IBrX-100
  'IBXX11', // IBrX-100
  'PIBB11', // IBrX-50
  'ECOO11', // ICO2 (Carbono Eficiente B3)
  'ISUS11', // ISE (Sustentabilidade Empresarial B3)
  'FIND11', // IFNC (Financeiro B3)
  'MATB11', // IMAT (Materiais Básicos B3)
  'GOVE11', // IGCT (Governança Corporativa B3)
]);

// Known B3 Stock Units (Ending in 11) to distinguish from FIIs/ETFs
const KNOWN_STOCK_UNITS = new Set([
  'TAEE11', 'BPAC11', 'KLBN11', 'SAPR11', 'SANB11',
  'ALUP11', 'ENGI11', 'TIET11', 'SULA11', 'CPLE11',
]);

// Known FI-Infra tickers (Ending in 11)
const KNOWN_FI_INFRA = new Set([
  'JURO11', 'BDIF11', 'IFRA11', 'KDIF11', 'XPID11', 'CPTI11', 'SNID11',
]);

// Known FIAGRO tickers (Ending in 11)
const KNOWN_FIAGRO = new Set([
  'VGIA11', 'KNCA11', 'RZAG11', 'SNAG11', 'FGAA11', 'RURA11', 'EGAF11', 'AGRX11',
]);

export class BrazilianAssetGuard {
  /**
   * Validates whether a ticker is an allowed Brazilian asset.
   * Enforces strict rejection of BDRs, Crypto, foreign ETFs, and foreign tickers.
   */
  static validate(tickerInput: string): AssetValidationResult {
    if (!tickerInput || typeof tickerInput !== 'string') {
      return {
        isAllowed: false,
        normalizedTicker: '',
        rejectionReason: 'Ticker vazio ou inválido',
      };
    }

    const clean = tickerInput.trim().toUpperCase();

    // Check fixed income instruments
    if (
      clean.startsWith('TESOURO') ||
      clean.startsWith('CDB') ||
      clean.startsWith('LCI') ||
      clean.startsWith('LCA') ||
      clean.startsWith('CRI') ||
      clean.startsWith('CRA') ||
      clean.startsWith('DEBENTURE')
    ) {
      return {
        isAllowed: true,
        assetType: 'fixed_income',
        normalizedTicker: clean,
      };
    }

    // Strip fractional market 'F' suffix if present (e.g. "PETR4F" -> "PETR4")
    let baseTicker = clean;
    if (baseTicker.length === 6 && baseTicker.endsWith('F')) {
      baseTicker = baseTicker.slice(0, 5);
    }

    // Strict regex check for standard B3 tickers: 4 letters followed by 1 to 2 digits
    const b3Regex = /^[A-Z]{4}(\d{1,2})$/;
    const match = baseTicker.match(b3Regex);

    if (!match) {
      return {
        isAllowed: false,
        normalizedTicker: clean,
        rejectionReason: `Formato de código inválido para o mercado brasileiro B3: '${clean}'. Ativos internacionais e criptoativos não são permitidos.`,
      };
    }

    const digit = match[1];

    // Check BDR numbers: 31, 32, 33, 34, 35, 39, 41, 42, 43, 44, 45, etc.
    const bdrDigits = new Set(['31', '32', '33', '34', '35', '39', '41', '42', '43', '44', '45', '50']);
    if (bdrDigits.has(digit)) {
      return {
        isAllowed: false,
        normalizedTicker: clean,
        rejectionReason: `BDRs (Certificados de Depósito de Valores Mobiliários Estrangeiros) são terminantemente proibidos no Carteira Predictor.`,
      };
    }

    // Check foreign/crypto ETF deny list
    if (FOREIGN_AND_CRYPTO_ETF_DENY_LIST.has(baseTicker)) {
      return {
        isAllowed: false,
        normalizedTicker: clean,
        rejectionReason: `O ETF '${baseTicker}' possui exposição internacional ou a criptoativos, sendo proibido pelo regulamento do Carteira Predictor.`,
      };
    }

    // Classify Stock by standard B3 digits:
    // 3: Ordinária (ON)
    // 4: Preferencial (PN)
    // 5, 6: Preferencial Classe A / B
    if (digit === '3' || digit === '4' || digit === '5' || digit === '6') {
      return {
        isAllowed: true,
        assetType: 'stock',
        normalizedTicker: clean,
      };
    }

    // Tickers ending in 11: Can be Stock Unit, Brazilian ETF, FII, FIAGRO, FI-Infra, or Denied Foreign ETF
    if (digit === '11') {
      if (BRAZILIAN_ETF_ALLOW_LIST.has(baseTicker)) {
        return {
          isAllowed: true,
          assetType: 'etf_br',
          normalizedTicker: clean,
        };
      }

      if (KNOWN_STOCK_UNITS.has(baseTicker)) {
        return {
          isAllowed: true,
          assetType: 'stock',
          normalizedTicker: clean,
        };
      }

      if (KNOWN_FI_INFRA.has(baseTicker)) {
        return {
          isAllowed: true,
          assetType: 'fiinfra',
          normalizedTicker: clean,
        };
      }

      if (KNOWN_FIAGRO.has(baseTicker)) {
        return {
          isAllowed: true,
          assetType: 'fiagro',
          normalizedTicker: clean,
        };
      }

      // Default 11 ticker in Brazil is FII (Fundo de Investimento Imobiliário)
      return {
        isAllowed: true,
        assetType: 'fii',
        normalizedTicker: clean,
      };
    }

    // Unrecognized suffix
    return {
      isAllowed: false,
      normalizedTicker: clean,
      rejectionReason: `Dígito '${digit}' não corresponde a uma classe autorizada de ativos brasileiros.`,
    };
  }

  /**
   * Helper that throws if the ticker is not strictly allowed.
   */
  static assertAllowed(ticker: string): BrazilianAssetType {
    const result = this.validate(ticker);
    if (!result.isAllowed || !result.assetType) {
      throw new Error(`[Guarda de Ativos Brasileiros] ${result.rejectionReason}`);
    }
    return result.assetType;
  }
}
