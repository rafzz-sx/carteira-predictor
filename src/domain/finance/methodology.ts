// src/domain/finance/methodology.ts
// Mathematical models, formal formulas, and pedagogical calculators
// for the CARTEIRA PREDICTOR transparency engine (/como-calculamos).

import { PortfolioMath, PositionState } from './portfolio-math';
import { BrazilianAssetGuard, AssetValidationResult } from '../guards/brazilian-asset-guard';
import { FixedIncomeService } from './fixed-income';

export interface AveragePriceStepInput {
  type: 'buy' | 'sell' | 'split' | 'reverse_split';
  quantity: number;
  unitPriceCents?: number;
  feesCents?: number;
  ratio?: number; // for split or reverse split
  date: string;
}

export interface AveragePriceStepResult {
  stepIndex: number;
  operation: AveragePriceStepInput;
  formulaDescription: string;
  mathExplanation: string;
  previousState: PositionState;
  newState: PositionState;
  realizedGainLossCents: number;
  feesPaidCents: number;
}

export interface MethodologyDocSection {
  id: string;
  title: string;
  shortTitle: string;
  lawReference?: string;
  summary: string;
  latexFormula: string;
  variables: Array<{ name: string; description: string; unit: string }>;
  keyRules: string[];
}

export class MethodologyDomain {
  /**
   * Explains step-by-step how Preço Médio is calculated according to IN RFB nº 1.585/2015.
   */
  static traceAveragePriceSteps(
    ticker: string,
    initialPosition: PositionState,
    steps: AveragePriceStepInput[]
  ): AveragePriceStepResult[] {
    let currentState: PositionState = { ...initialPosition, ticker };
    const results: AveragePriceStepResult[] = [];

    steps.forEach((step, index) => {
      const prevState = { ...currentState };
      let realizedGainLossCents = 0;
      const feesPaidCents = step.feesCents || 0;
      let formulaDescription = '';
      let mathExplanation = '';

      if (step.type === 'buy') {
        const unitPrice = step.unitPriceCents ?? 0;
        const totalTradeCents = step.quantity * unitPrice + feesPaidCents;
        currentState = PortfolioMath.applyBuy(currentState, step.quantity, unitPrice, feesPaidCents);

        formulaDescription = 'PM = (Qtd_Antiga × PM_Antigo + Qtd_Nova × Preço_Compra + Taxas) ÷ Qtd_Total';
        mathExplanation = `Compra de ${step.quantity} cotas a R$ ${(unitPrice / 100).toFixed(2)} (+ R$ ${(feesPaidCents / 100).toFixed(2)} taxas = R$ ${(totalTradeCents / 100).toFixed(2)}). ` +
          `Custódia anterior de ${prevState.quantity} cotas a PM R$ ${(prevState.averagePriceCents / 100).toFixed(2)}. ` +
          `Novo PM ponderado: R$ ${(currentState.averagePriceCents / 100).toFixed(2)}.`;
      } else if (step.type === 'sell') {
        const unitPrice = step.unitPriceCents ?? 0;
        const tradeResult = PortfolioMath.applySell(currentState, step.quantity, unitPrice, feesPaidCents);
        currentState = tradeResult.updatedPosition;
        realizedGainLossCents = tradeResult.realizedGainLossCents;

        formulaDescription = 'PM_Venda = PM_Anterior (INALTERADO) | Ganho = Qtd × (Preço_Venda - PM) - Taxas';
        const gainLabel = realizedGainLossCents >= 0 ? 'Lucro' : 'Prejuízo';
        mathExplanation = `Venda parcial de ${step.quantity} cotas a R$ ${(unitPrice / 100).toFixed(2)}. ` +
          `O Preço Médio unitário NÃO muda na venda (mantém R$ ${(prevState.averagePriceCents / 100).toFixed(2)}). ` +
          `${gainLabel} realizado: R$ ${(Math.abs(realizedGainLossCents) / 100).toFixed(2)}. Restam ${currentState.quantity} cotas.`;
      } else if (step.type === 'split') {
        const ratio = step.ratio && step.ratio > 0 ? step.ratio : 2;
        currentState = PortfolioMath.applySplit(currentState, ratio);

        formulaDescription = 'Qtd_Nova = Qtd_Antiga × Razão | PM_Novo = PM_Antigo ÷ Razão';
        mathExplanation = `Desdobramento (split) na proporção 1:${ratio}. ` +
          `A quantidade subiu de ${prevState.quantity} para ${currentState.quantity} cotas. ` +
          `O Preço Médio reduziu proporcionalmente de R$ ${(prevState.averagePriceCents / 100).toFixed(2)} para R$ ${(currentState.averagePriceCents / 100).toFixed(2)}. ` +
          `O custo total investido permaneceu constante (R$ ${(currentState.totalInvestedCents / 100).toFixed(2)}).`;
      } else if (step.type === 'reverse_split') {
        const factor = step.ratio && step.ratio > 0 ? step.ratio : 2;
        const newQty = Math.max(1, Math.floor(currentState.quantity / factor));
        const newPM = Math.round(currentState.totalInvestedCents / newQty);
        currentState = {
          ticker,
          quantity: newQty,
          averagePriceCents: newPM,
          totalInvestedCents: newQty * newPM,
        };

        formulaDescription = 'Qtd_Nova = Qtd_Antiga ÷ Fator | PM_Novo = PM_Antigo × Fator';
        mathExplanation = `Grupamento na proporção ${factor}:1. ` +
          `A quantidade diminuiu de ${prevState.quantity} para ${currentState.quantity} cotas. ` +
          `O Preço Médio subiu proporcionalmente de R$ ${(prevState.averagePriceCents / 100).toFixed(2)} para R$ ${(currentState.averagePriceCents / 100).toFixed(2)}. ` +
          `O custo total investido permaneceu inalterado.`;
      }

      results.push({
        stepIndex: index + 1,
        operation: step,
        formulaDescription,
        mathExplanation,
        previousState: prevState,
        newState: currentState,
        realizedGainLossCents,
        feesPaidCents,
      });
    });

    return results;
  }

  /**
   * Gross-up calculation and tax comparison for fixed income.
   */
  static calculateTaxEquivalence(exemptRateAnnualPercent: number, holdingDays: number) {
    const irRatePercent = FixedIncomeService.getRegressiveTaxRate(holdingDays);
    const grossRate = FixedIncomeService.calculateEquivalentGrossRate(exemptRateAnnualPercent, holdingDays);
    return {
      exemptRateAnnualPercent,
      holdingDays,
      irRatePercent,
      grossRateEquivalentPercent: grossRate,
      taxDifferencePercent: Number((grossRate - exemptRateAnnualPercent).toFixed(2)),
    };
  }

  /**
   * Mark-to-market shock sensitivity decomposition.
   * dPU% = -D_mod * dY + 0.5 * C * (dY)^2
   */
  static calculateMtMSensitivity(priceCents: number, modifiedDuration: number, convexity: number, rateShockBps: number) {
    const deltaY = rateShockBps / 10000;
    const durationComponentPercent = -modifiedDuration * deltaY * 100;
    const convexityComponentPercent = 0.5 * convexity * Math.pow(deltaY, 2) * 100;
    const priceDeltaPercent = Number((durationComponentPercent + convexityComponentPercent).toFixed(2));
    const priceDeltaCents = Math.round(priceCents * (priceDeltaPercent / 100));
    const simulatedPriceCents = priceCents + priceDeltaCents;

    return {
      priceCents,
      modifiedDuration,
      convexity,
      rateShockBps,
      simulatedPriceCents,
      priceDeltaCents,
      priceDeltaPercent,
      durationComponentPercent: Number(durationComponentPercent.toFixed(2)),
      convexityComponentPercent: Number(convexityComponentPercent.toFixed(2)),
      isAgio: rateShockBps < 0,
      isDesagio: rateShockBps > 0,
    };
  }

  /**
   * Audits ticker legality against BrazilianAssetGuard with extended pedagogic reasons.
   */
  static auditTicker(ticker: string): AssetValidationResult & {
    regulatoryCategory: string;
    explanation: string;
  } {
    const validation = BrazilianAssetGuard.validate(ticker);
    const clean = ticker.trim().toUpperCase();

    let regulatoryCategory = 'Desconhecido';
    let explanation = '';

    if (validation.isAllowed) {
      switch (validation.assetType) {
        case 'stock':
          regulatoryCategory = 'Ação B3 (Mercado à Vista)';
          explanation = 'Ativo brasileiro elegível. Ações ordinárias (ON), preferenciais (PN) ou Units de companhias listadas na B3.';
          break;
        case 'fii':
          regulatoryCategory = 'Fundo Imobiliário (FII B3)';
          explanation = 'Ativo brasileiro elegível. Isenção de dividendos para pessoa física (Lei 11.033/04) e alíquota de 20% no ganho de capital.';
          break;
        case 'fiagro':
          regulatoryCategory = 'FIAGRO (Cadeias Agroindustriais B3)';
          explanation = 'Ativo brasileiro elegível. Regime análogo aos FIIs com proventos isentos e 20% no ganho de capital.';
          break;
        case 'fiinfra':
          regulatoryCategory = 'FI-Infra (Infraestrutura Nacional B3)';
          explanation = 'Ativo brasileiro elegível. 100% isento de IR tanto em rendimentos quanto no ganho de capital (Lei 12.431/11).';
          break;
        case 'etf_br':
          regulatoryCategory = 'ETF de Índice Nacional B3';
          explanation = 'Ativo brasileiro elegível. ETF composto exclusivamente por cestas de ativos brasileiros (ex: Ibovespa, Small Caps, IDIV).';
          break;
        case 'fixed_income':
          regulatoryCategory = 'Renda Fixa Nacional / Tesouro Direto';
          explanation = 'Título emitido pela Secretaria do Tesouro Nacional ou instrumento de crédito bancário/privado local registrado na B3/Cetip.';
          break;
      }
    } else {
      if (clean.endsWith('34') || clean.endsWith('35')) {
        regulatoryCategory = 'BDR Não Permitido';
        explanation = 'BDRs (Brazilian Depositary Receipts) lastreados em empresas estrangeiras são estritamente bloqueados. O foco da plataforma é 100% o mercado produtivo nacional.';
      } else if (
        ['IVVB11', 'SPXI11', 'NASD11', 'ACWI11', 'WRLD11', 'EURP11', 'ASIA11', 'XINA11'].includes(clean)
      ) {
        regulatoryCategory = 'ETF de Exposição Internacional Bloqueado';
        explanation = 'ETFs de índices globais (S&P 500, Nasdaq, MSCI World) são proibidos pela diretriz de foco estrito no ecossistema de capitais brasileiro.';
      } else if (
        ['HASH11', 'QBTC11', 'QETH11', 'BITH11', 'CRPT11', 'WEB311'].includes(clean) ||
        ['BTC', 'ETH', 'SOL', 'USDT'].includes(clean)
      ) {
        regulatoryCategory = 'Criptoativo / Crypto ETF Bloqueado';
        explanation = 'Criptomoedas e ETFs de criptoativos são rejeitados. A plataforma atende investimentos regulados no mercado de capitais brasileiro.';
      } else {
        regulatoryCategory = 'Ativo Estrangeiro ou Código Inválido';
        explanation = validation.rejectionReason || 'Código não reconhecido como ativo negociável na B3.';
      }
    }

    return {
      ...validation,
      regulatoryCategory,
      explanation,
    };
  }

  /**
   * Reference documentation sections for the transparency page.
   */
  static getDocumentationSections(): MethodologyDocSection[] {
    return [
      {
        id: 'preco-medio',
        title: 'Preço Médio Ponderado por Compras (IN RFB nº 1.585/2015)',
        shortTitle: 'Preço Médio RFB',
        lawReference: 'Instrução Normativa RFB nº 1.585/2015, arts. 56 a 60',
        summary: 'Metodologia oficial exigida pela Receita Federal para apuração do custo de aquisição de ativos no mercado de capitais brasileiro.',
        latexFormula: 'PM_{novo} = \\frac{(Q_{anterior} \\times PM_{anterior}) + (Q_{compra} \\times P_{compra}) + Custos}{Q_{anterior} + Q_{compra}}',
        variables: [
          { name: 'Q_anterior', description: 'Quantidade de ações em custódia antes da compra', unit: 'unidades' },
          { name: 'PM_anterior', description: 'Preço médio ponderado unitário até o pregão anterior', unit: 'R$/ação' },
          { name: 'Q_compra', description: 'Nova quantidade adquirida na ordem executada', unit: 'unidades' },
          { name: 'P_compra', description: 'Preço unitário de execução no pregão', unit: 'R$/ação' },
          { name: 'Custos', description: 'Taxa de liquidação, emolumentos B3 e corretagem da nota', unit: 'R$' },
        ],
        keyRules: [
          'Vendas parciais reduzem a quantidade em carteira, mas NUNCA alteram o Preço Médio unitário.',
          'Taxas de corretagem e emolumentos B3 aumentam o custo na compra (aumentando o PM) e diminuem a receita na venda (reduzindo o lucro tributável).',
          'Em desdobramentos (splits), a quantidade multiplica e o PM divide pela razão, mantendo o custo total idêntico.',
          'Na ficha Bens e Direitos da DIRPF, informa-se SEMPRE o Custo de Aquisição (Qtd × PM) em 31/12, e NUNCA o valor de cotação de mercado.',
        ],
      },
      {
        id: 'monte-carlo',
        title: 'Simulação Estocástica de Monte Carlo & Trajetórias Futuras',
        shortTitle: 'Monte Carlo & Risco',
        summary: 'Projeção probabilística de longo prazo com 1.000 trajetórias independentes geradas por amostragem Box-Muller e reinvestimento contínuo de proventos.',
        latexFormula: 'S_{t} = S_{t-1} \\times \\exp\\left(\\left(\\mu - \\frac{\\sigma^2}{2}\\right)\\Delta t + \\sigma \\sqrt{\\Delta t} \\cdot Z\\right) + Aporte_{t}',
        variables: [
          { name: 'S_t', description: 'Patrimônio acumulado no período t', unit: 'R$' },
          { name: 'mu', description: 'Deriva esperada do portfólio ponderada por classe e proventos', unit: '% ao ano' },
          { name: 'sigma', description: 'Volatilidade histórica anualizada calibrada na B3', unit: '% ao ano' },
          { name: 'Z', description: 'Variável normal padrão N(0,1) obtida pelo algoritmo Box-Muller', unit: 'adimensional' },
          { name: 'Aporte_t', description: 'Ação mensal aportada pelo investidor com correção periódica', unit: 'R$/mês' },
        ],
        keyRules: [
          'Execução de 1.000 cenários em menos de 30ms com motor WebAssembly/TypeScript otimizado.',
          'Geração pseudo-aleatória reproduzível via SeededRNG (garante auditoria e consistência entre sessões).',
          'Cones de incerteza organizados em percentis rigorosos: P10 (estresse adverso), P25, P50 (mediana / probabilidade máxima), P75 e P90 (otimista).',
          'Reinvestimento automático de proventos baseado no Dividend Yield ponderado de cada classe de ativo.',
        ],
      },
      {
        id: 'marcacao-mercado',
        title: 'Marcação a Mercado (MtM) & Duration em Títulos Públicos',
        shortTitle: 'Marcação a Mercado',
        lawReference: 'Portaria STN nº 1.040/2021 & Resolução Anbima nº 20',
        summary: 'Modelo de precificação de títulos públicos (Tesouro Prefixado e Tesouro IPCA+) no mercado secundário antes do vencimento.',
        latexFormula: '\\frac{\\Delta P}{P} \\approx -D_{mod} \\times \\Delta y + \\frac{1}{2} \\times C \\times (\\Delta y)^2',
        variables: [
          { name: 'D_mod', description: 'Duration Modificada (sensibilidade linear à variação da taxa)', unit: 'anos' },
          { name: 'Delta y', description: 'Choque na taxa de juros do mercado futuro (DI)', unit: 'pontos-base (bps)' },
          { name: 'C', description: 'Convexidade (curvatura positiva da relação preço-taxa)', unit: 'anos²' },
          { name: 'P', description: 'Preço Unitário (PU) contratado do título', unit: 'R$' },
        ],
        keyRules: [
          'Queda nas taxas de juros (Delta y < 0) eleva o PU do título, gerando Ágio e oportunidade de venda antecipada com rentabilidade superior à contratada.',
          'Alta nas taxas de juros (Delta y > 0) reduz o PU temporariamente no mercado secundário (deságio contábil).',
          'GARANTIA PÉTREA NO VENCIMENTO: Se o título for mantido até a data pactuada, o investidor recebe 100% da taxa contratada, independente das oscilações intermediárias.',
          'Equivalência tributária de Gross-up: Taxa_Bruta = Taxa_Isenta / (1 - Alíquota_IR). Permite comparar LCI/LCA com CDB e Tesouro Selic.',
        ],
      },
      {
        id: 'regras-fiscais',
        title: 'Regulamentação Fiscal da B3 & Instrução da Receita Federal',
        shortTitle: 'Tributação B3',
        lawReference: 'Lei nº 11.033/2004, Lei nº 9.430/1996 (art. 67) e Lei nº 12.431/2011',
        summary: 'Apuração e cálculo de DARF 6015, isenções por espécie de ativo e segregação estrita de prejuízos a compensar.',
        latexFormula: 'DARF_{devido} = \\max\\left(0, \\sum (Ganho_{tributavel} \\times Alíquota) - Prejuízo_{acum} - IRRF_{retido}\\right)',
        variables: [
          { name: 'Ganho_tributavel', description: 'Lucro líquido apurado no mês acima das faixas de isenção', unit: 'R$' },
          { name: 'Alíquota', description: '15% para ações e ETFs de renda variável; 20% para FIIs, FIAGRO e Day Trade', unit: '%' },
          { name: 'Prejuízo_acum', description: 'Prejuízos de meses anteriores da mesma classe de ativo', unit: 'R$' },
          { name: 'IRRF_retido', description: 'Imposto retido na fonte pela B3 ("dedo-duro", 0,005%)', unit: 'R$' },
        ],
        keyRules: [
          'Isenção de R$ 20.000,00 por mês: Válida EXCLUSIVAMENTE para vendas de ações ordinárias e preferenciais no mercado à vista (operações comuns).',
          'FIIs e FIAGRO NÃO possuem isenção de R$ 20.000: qualquer venda com lucro de cotas de FII é tributada em 20%.',
          'Segregação obrigatória de prejuízos: Prejuízo de ações só compensa ações. Prejuízo de FII só compensa FIIs. Prejuízo de Day Trade só compensa Day Trade.',
          'Regra dos R$ 10,00 do DARF: Conforme art. 67 da Lei 9.430/1996, não se emite DARF com valor inferior a R$ 10,00. O saldo acumula para os meses subsequentes.',
          'Prazo de recolhimento: Até o último dia útil do mês subsequente ao das operações.',
        ],
      },
      {
        id: 'guarda-ativos',
        title: 'Guarda Estrita de Ativos Brasileiros (BrazilianAssetGuard)',
        shortTitle: 'Guarda de Ativos',
        summary: 'Regra de conformidade do Carteira Predictor que assegura foco absoluto e irrestrito no mercado financeiro brasileiro.',
        latexFormula: 'Ativo \\in \\{Ações_{B3}, FII, FIAGRO, FI-Infra, ETF_{BR}, Tesouro, CréditoPrivado_{BR}\\}',
        variables: [
          { name: 'Ações_B3', description: 'Empresas listadas na B3 com tickers finais 3, 4, 5, 6 ou 11 (Units locais)', unit: 'B3' },
          { name: 'FII / FIAGRO', description: 'Fundos imobiliários e do agronegócio registrados na CVM e negociados na B3', unit: 'B3' },
          { name: 'FI-Infra', description: 'Fundos incentivados de infraestrutura com isenção total de IR (Lei 12.431/11)', unit: 'B3' },
          { name: 'ETF_BR', description: 'ETFs lastreados em índices domésticos de ações ou renda fixa local', unit: 'B3' },
        ],
        keyRules: [
          'BLOQUEIO ABSOLUTO DE BDRs: Tickers com terminação 34 ou 35 são rigorosamente barrados na entrada de dados e na importação.',
          'BLOQUEIO DE ETFS INTERNACIONAIS: ETFs que replicam índices estrangeiros (ex: IVVB11, SPXI11, NASD11, WRLD11) são barrados.',
          'BLOQUEIO DE CRIPTOATIVOS: Criptomoedas diretas e ETFs de criptoativos (HASH11, QBTC11, etc.) não são suportados.',
          'PROTEÇÃO CONTRA RISCO CAMBIAL NÃO DESEJADO: Todas as métricas de dividendos, yield e imposto consideram exclusivamente o Real (BRL) e o arcabouço fiscal da Receita Federal do Brasil.',
        ],
      },
      {
        id: 'regra-zero-honestidade',
        title: 'Regra 0 de Honestidade: Integridade & Transparência de Dados',
        shortTitle: 'Regra 0 Honestidade',
        summary: 'Compromisso ético fundamental da plataforma com o investidor brasileiro: dados transparentes, sem promessas irrealistas e sem inventar cotações.',
        latexFormula: '\\Delta t_{cotacao} \\approx 30\\text{ minutos (atraso regulatório oficial gratuito B3)}',
        variables: [
          { name: 'Atraso oficial', description: 'Defasagem padrão dos feeds gratuitos de mercado da B3', unit: 'minutos' },
          { name: 'Selo de Atualização', description: 'Timestamp explícito da última cotação recebida exibido em tela', unit: 'data e hora' },
        ],
        keyRules: [
          'Transparência com dados: Cotações da B3 possuem atraso oficial de aproximadamente 30 minutos em contas gratuitas, devidamente sinalizado com badges na interface.',
          'Não inventamos cotações: Na ausência de sinal em tempo real, utilizamos o último preço de fechamento do pregão com aviso visível.',
          'Sem promessas de enriquecimento rápido: Os simuladores enfatizam a variabilidade probabilística e os riscos reais de crises e drawdowns.',
          'Sem taxas ocultas nem paywalls com cartão de crédito: A plataforma opera com código aberto, sem exigir dados de pagamento.',
        ],
      },
    ];
  }
}
