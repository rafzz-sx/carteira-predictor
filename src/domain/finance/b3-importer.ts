// src/domain/finance/b3-importer.ts
// Robust, tolerant CSV/text parser for Brazilian B3 investor statements (Área do Investidor / CEI).
// Automatically strips noise, handles pt-BR currency/numbers, and enforces BrazilianAssetGuard.

import { BrazilianAssetGuard, BrazilianAssetType } from '../guards/brazilian-asset-guard';
import { TransactionType } from '../models/transaction';
import { parseCurrencyToCents } from '@/lib/formatters';

export interface ParsedB3Transaction {
  tradeDate: string; // "YYYY-MM-DD"
  ticker: string;
  assetType: BrazilianAssetType;
  type: TransactionType;
  quantity: number;
  unitPriceCents: number;
  totalCostsCents: number;
  totalAmountCents: number;
  notes?: string;
  sourceRowNumber: number;
}

export interface IgnoredAssetRecord {
  ticker: string;
  reason: string;
  sourceRowNumber: number;
  rawLine: string;
}

export interface B3ImportResult {
  success: boolean;
  transactions: ParsedB3Transaction[];
  ignoredAssets: IgnoredAssetRecord[];
  totalParsedRows: number;
  uniqueTickers: string[];
  totalVolumeCents: number;
  errors: string[];
}

/**
 * Normalizes B3 date strings ("DD/MM/YYYY" or "YYYY-MM-DD") to ISO "YYYY-MM-DD".
 */
export function normalizeB3Date(rawDate: string): string | null {
  if (!rawDate) return null;
  const clean = rawDate.trim();

  // Format DD/MM/YYYY or DD-MM-YYYY
  const brMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Format YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Normalizes pt-BR quantity strings (e.g. "100", "1.000", "0,5")
 */
export function parseB3Quantity(rawQty: string): number {
  if (!rawQty) return 0;
  const clean = rawQty.replace(/\./g, '').replace(',', '.').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

/**
 * Detects whether line is a trade or statement header.
 */
function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    (lower.includes('data') && (lower.includes('negócio') || lower.includes('negocio') || lower.includes('pregão') || lower.includes('movimentação'))) ||
    (lower.includes('código') || lower.includes('codigo') || lower.includes('ticker') || lower.includes('ativo')) ||
    (lower.includes('compra') && lower.includes('venda'))
  );
}

/**
 * Parses raw CSV content exported from B3 Área do Investidor.
 */
export function parseB3Statement(fileContent: string): B3ImportResult {
  const result: B3ImportResult = {
    success: true,
    transactions: [],
    ignoredAssets: [],
    totalParsedRows: 0,
    uniqueTickers: [],
    totalVolumeCents: 0,
    errors: [],
  };

  if (!fileContent || typeof fileContent !== 'string') {
    result.success = false;
    result.errors.push('O arquivo fornecido está vazio.');
    return result;
  }

  // Normalize line endings and strip BOM
  const cleanContent = fileContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    result.success = false;
    result.errors.push('Nenhum dado encontrado no arquivo.');
    return result;
  }

  // Determine delimiter: semicolon (most common in pt-BR Excel), comma, or tab
  const sample = lines.slice(0, 5).join('\n');
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;

  let delimiter = ';';
  if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
  else if (commaCount > semicolonCount) delimiter = ',';

  // Process rows
  let headerIndex = -1;
  let headerColumns: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (isHeaderLine(lines[i])) {
      headerIndex = i;
      headerColumns = lines[i].split(delimiter).map((c) => c.toLowerCase().trim().replace(/["']/g, ''));
      break;
    }
  }

  // Column index resolvers
  let dateCol = -1;
  let typeCol = -1;
  let tickerCol = -1;
  let qtyCol = -1;
  let priceCol = -1;
  let totalCol = -1;

  if (headerIndex !== -1) {
    headerColumns.forEach((col, idx) => {
      if (col.includes('data') && !col.includes('liquidação') && dateCol === -1) dateCol = idx;
      else if ((col.includes('compra') || col.includes('tipo') || col.includes('movimentação')) && typeCol === -1) typeCol = idx;
      else if ((col.includes('código') || col.includes('codigo') || col.includes('negociação') || col.includes('ticker') || col.includes('ativo')) && tickerCol === -1) tickerCol = idx;
      else if ((col.includes('quantidade') || col.includes('qtd')) && qtyCol === -1) qtyCol = idx;
      else if ((col.includes('preço') || col.includes('preco') || col.includes('valor unitário')) && priceCol === -1) priceCol = idx;
      else if ((col.includes('valor total') || col.includes('total da operação')) && totalCol === -1) totalCol = idx;
    });
  }

  // Fallbacks if header wasn't found or columns couldn't be resolved:
  // Typical B3 Área do Investidor trade report without custom headers:
  // Col 0: Data do Negócio | Col 1: Tipo de Movimentação (Compra/Venda) | Col 2: Mercado | Col 3: Prazo | Col 4: Código de Negociação | Col 5: Especificação | Col 6: Quantidade | Col 7: Preço | Col 8: Valor Total
  if (dateCol === -1) dateCol = 0;
  if (typeCol === -1) typeCol = 1;
  if (tickerCol === -1) tickerCol = 4;
  if (qtyCol === -1) qtyCol = 6;
  if (priceCol === -1) priceCol = 7;
  if (totalCol === -1) totalCol = 8;

  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;
  const uniqueTickerSet = new Set<string>();

  for (let rowIndex = startRow; rowIndex < lines.length; rowIndex++) {
    const rawLine = lines[rowIndex];
    if (!rawLine || rawLine.startsWith('#') || rawLine.toLowerCase().startsWith('total')) continue;

    const cells = rawLine.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.length < 3) continue;

    const rawDate = cells[dateCol] || cells[0];
    const isoDate = normalizeB3Date(rawDate);
    if (!isoDate) {
      // Not a valid transaction line
      continue;
    }

    // Extract ticker: can be in tickerCol or search for 4 letters + 1-2 digits
    let rawTicker = cells[tickerCol] || '';
    if (!rawTicker || rawTicker.length < 4) {
      // Scan cells for a ticker pattern
      for (const cell of cells) {
        const potentialTicker = cell.toUpperCase();
        if (/^[A-Z]{4}\d{1,2}F?$/.test(potentialTicker)) {
          rawTicker = potentialTicker;
          break;
        }
      }
    }

    // Clean ticker: extract the ticker part if contains company name (e.g. "PETR4 - PETROLEO BRASILEIRO")
    const tickerMatch = rawTicker.match(/([A-Z]{4}\d{1,2}F?)/i);
    const cleanTicker = tickerMatch ? tickerMatch[1].toUpperCase() : rawTicker.toUpperCase();

    // Validate ticker against BrazilianAssetGuard
    const validation = BrazilianAssetGuard.validate(cleanTicker);
    if (!validation.isAllowed || !validation.assetType) {
      result.ignoredAssets.push({
        ticker: cleanTicker || rawTicker || 'N/A',
        reason: validation.rejectionReason || 'Ativo não permitido no mercado nacional brasileiro',
        sourceRowNumber: rowIndex + 1,
        rawLine,
      });
      continue;
    }

    // Determine transaction type
    const rawType = (cells[typeCol] || '').toLowerCase();
    let transType: TransactionType = 'buy';
    if (rawType.includes('venda') || rawType === 'v' || rawType.includes('sell')) {
      transType = 'sell';
    } else if (rawType.includes('dividendo') || rawType.includes('rendimento')) {
      transType = 'dividend';
    } else if (rawType.includes('jcp') || rawType.includes('juros')) {
      transType = 'jcp';
    } else if (rawType.includes('desdobramento') || rawType.includes('split')) {
      transType = 'split';
    }

    // Quantity and Price
    const quantity = parseB3Quantity(cells[qtyCol] || '1');
    if (quantity <= 0) continue;

    const unitPriceCents = parseCurrencyToCents(cells[priceCol] || '0');
    let totalAmountCents = parseCurrencyToCents(cells[totalCol] || '0');

    if (totalAmountCents === 0 && unitPriceCents > 0) {
      totalAmountCents = Math.round(quantity * unitPriceCents);
    }

    const tradeCostsCents = Math.max(0, totalAmountCents - Math.round(quantity * unitPriceCents));

    result.transactions.push({
      tradeDate: isoDate,
      ticker: cleanTicker,
      assetType: validation.assetType,
      type: transType,
      quantity,
      unitPriceCents: unitPriceCents || Math.round(totalAmountCents / quantity),
      totalCostsCents: tradeCostsCents,
      totalAmountCents,
      notes: `Importado via extrato B3 (${rawDate})`,
      sourceRowNumber: rowIndex + 1,
    });

    uniqueTickerSet.add(cleanTicker);
    result.totalVolumeCents += totalAmountCents;
    result.totalParsedRows++;
  }

  result.uniqueTickers = Array.from(uniqueTickerSet).sort();

  // Sort transactions chronologically
  result.transactions.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));

  return result;
}
