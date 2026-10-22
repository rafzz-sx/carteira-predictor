// src/domain/finance/portfolio-math.ts
// Financial arithmetic for Brazilian tax rules and portfolio tracking.
// All monetary values are strictly represented and calculated in integer cents.

export interface PositionState {
  ticker: string;
  quantity: number;
  averagePriceCents: number; // Preço Médio (PM) em centavos
  totalInvestedCents: number; // quantity * averagePriceCents
}

export interface TradeCalculationResult {
  updatedPosition: PositionState;
  realizedGainLossCents: number; // Ganho/Prejuízo realizado (em centavos)
  tradeCostCents: number; // Custo total da transação
}

export class PortfolioMath {
  /**
   * Applies a BUY trade to a position according to Receita Federal rules.
   * PM = (Quantidade Anterior * PM Anterior + Nova Quantidade * Novo Preço + Custos) / Quantidade Total
   */
  static applyBuy(
    current: PositionState,
    buyQuantity: number,
    unitPriceCents: number,
    feesCents = 0
  ): PositionState {
    if (buyQuantity <= 0 || unitPriceCents <= 0) {
      throw new Error('Quantidade e preço de compra devem ser maiores que zero.');
    }

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

  /**
   * Applies a SELL trade.
   * Preço Médio (PM) does NOT change on sales.
   * Realized Gain/Loss = Quantidade Vendida * (Preço Venda - PM) - Custos
   */
  static applySell(
    current: PositionState,
    sellQuantity: number,
    unitPriceCents: number,
    feesCents = 0
  ): TradeCalculationResult {
    if (sellQuantity <= 0 || unitPriceCents <= 0) {
      throw new Error('Quantidade e preço de venda devem ser maiores que zero.');
    }

    if (sellQuantity > current.quantity) {
      throw new Error(
        `Quantidade vendida (${sellQuantity}) não pode ser maior que a custódia atual (${current.quantity}). Venda a descoberto não é permitida.`
      );
    }

    const grossRevenueCents = sellQuantity * unitPriceCents;
    const costBasisCents = sellQuantity * current.averagePriceCents;
    const realizedGainLossCents = grossRevenueCents - costBasisCents - feesCents;

    const remainingQuantity = current.quantity - sellQuantity;
    const updatedPosition: PositionState = {
      ticker: current.ticker,
      quantity: remainingQuantity,
      averagePriceCents: remainingQuantity > 0 ? current.averagePriceCents : 0,
      totalInvestedCents: remainingQuantity * (remainingQuantity > 0 ? current.averagePriceCents : 0),
    };

    return {
      updatedPosition,
      realizedGainLossCents,
      tradeCostCents: grossRevenueCents,
    };
  }

  /**
   * Calculates unrealized gain or loss based on current market quote.
   */
  static calculateUnrealized(
    current: PositionState,
    currentQuoteCents: number
  ): {
    currentTotalCents: number;
    unrealizedGainLossCents: number;
    unrealizedPercent: number;
  } {
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

  /**
   * Applies a stock split (desdobramento) ratio (e.g., 1 into 2 -> ratio = 2).
   */
  static applySplit(current: PositionState, ratio: number): PositionState {
    if (ratio <= 0) throw new Error('Razão de desdobramento deve ser positiva.');
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
