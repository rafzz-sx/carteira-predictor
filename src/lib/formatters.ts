// src/lib/formatters.ts
// Single source of truth for pt-BR financial formatting in Carteira Predictor.
// Adheres strictly to Section 8.5 of specifications.

const TRUE_MINUS = '\u2212';

/**
 * Format integer cents into BRL currency string (e.g., 123456 -> "R$ 1.234,56")
 * Negative values use true minus sign: -123456 -> "−R$ 1.234,56"
 */
export function formatCurrency(
  cents: number,
  options: {
    privacyMode?: boolean;
    showSign?: boolean;
    compact?: boolean;
  } = {}
): string {
  if (options.privacyMode) {
    return '••••••';
  }

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

  if (isNegative) {
    return `${TRUE_MINUS}R$ ${formattedValue}`;
  }

  if (options.showSign && cents > 0) {
    return `+R$ ${formattedValue}`;
  }

  return `R$ ${formattedValue}`;
}

/**
 * Format basis points or decimal percent into pt-BR percent string (e.g. 12.34 -> "+12,34%" or "-0,45%")
 */
export function formatPercent(
  percent: number,
  options: {
    showSign?: boolean;
    decimals?: number;
  } = {}
): string {
  const decimals = options.decimals ?? 2;
  const isNegative = percent < 0;
  const absValue = Math.abs(percent);
  
  const formatted = absValue.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (isNegative) {
    return `${TRUE_MINUS}${formatted}%`;
  }

  if (options.showSign && percent > 0) {
    return `+${formatted}%`;
  }

  return `${formatted}%`;
}

/**
 * Format quantities (shares/quotas)
 */
export function formatQuantity(quantity: number, isFractional = false): string {
  return quantity.toLocaleString('pt-BR', {
    minimumFractionDigits: isFractional ? 2 : 0,
    maximumFractionDigits: isFractional ? 4 : 0,
  });
}

/**
 * Format ISO date string to pt-BR standard (e.g. "2026-10-21" -> "21 out 2026")
 */
export function formatDateB3(
  isoDateStr: string,
  style: 'short' | 'monthYear' | 'full' = 'short'
): string {
  const [year, month, day] = isoDateStr.split('-').map(Number);
  const monthsShort = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez',
  ];

  if (style === 'monthYear') {
    return `${monthsShort[month - 1]}/${year}`;
  }

  if (style === 'full') {
    const monthsFull = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
    ];
    return `${String(day).padStart(2, '0')} de ${monthsFull[month - 1]} de ${year}`;
  }

  return `${String(day).padStart(2, '0')} ${monthsShort[month - 1]} ${year}`;
}

/**
 * Format ISO time to 24h with optional America/Sao_Paulo label
 */
export function formatTimeB3(date: Date, showTz = true): string {
  const timeStr = date.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return showTz ? `${timeStr} (Horário de Brasília)` : timeStr;
}

/**
 * Robust pt-BR currency parser converting text inputs to integer cents without floating point errors.
 * Handles "1.500,50", "1500,50", "1.500", "1500.50", "R$ 2.500,00"
 */
export function parseCurrencyToCents(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }
  if (!input) return 0;
  const cleaned = input.replace(/[^\d,.]/g, '').trim();
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

