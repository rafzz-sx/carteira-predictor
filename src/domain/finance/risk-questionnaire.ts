// src/domain/finance/risk-questionnaire.ts
// Objective, scenario-based investor risk assessment calibrated for the Brazilian financial market (B3 & Renda Fixa).

import { InvestorRiskProfile } from '../models/user-profile';

export interface QuestionnaireOption {
  id: string;
  label: string;
  description?: string;
  score: number; // 0 to 100 contribution
}

export interface QuestionnaireQuestion {
  id: string;
  category: 'objective' | 'horizon' | 'crisis_reaction' | 'experience' | 'volatility_tolerance';
  title: string;
  subtitle: string;
  weight: number; // Weight in final score (sum = 1.0)
  options: QuestionnaireOption[];
}

export interface TargetAllocation {
  fixedIncomePct: number; // Tesouro Selic, IPCA+, CDB, LCI/LCA
  fiisPct: number;        // Fundos Imobiliários, FIAGRO, FI-Infra
  equitiesPct: number;    // Ações brasileiras (Dividendos, Valor, Crescimento)
  description: string;
}

export interface RiskEvaluationResult {
  score: number; // 0 to 100 integer
  profile: InvestorRiskProfile;
  profileLabel: string;
  summary: string;
  reasons: string[];
  recommendedAllocation: TargetAllocation;
}

export const RISK_QUESTIONS: QuestionnaireQuestion[] = [
  {
    id: 'primary_goal',
    category: 'objective',
    title: 'Qual é o seu objetivo principal ao investir?',
    subtitle: 'Define a finalidade estratégica do seu capital na B3 e Renda Fixa.',
    weight: 0.20,
    options: [
      {
        id: 'goal_preservation',
        label: 'Preservação de Capital e Reserva',
        description: 'Prioridade absoluta em segurança e liquidez diária, sem correr risco de oscilação negativa.',
        score: 10,
      },
      {
        id: 'goal_income',
        label: 'Renda Passiva Mensal com Dividendos',
        description: 'Foco no fluxo mensal previsível de proventos isentos (FIIs) e dividendos de empresas consolidadas.',
        score: 45,
      },
      {
        id: 'goal_balanced_growth',
        label: 'Construção de Patrimônio no Longo Prazo',
        description: 'Combinação equilibrada entre valorização de cotas e reinvestimento de proventos.',
        score: 70,
      },
      {
        id: 'goal_max_growth',
        label: 'Multiplicação Acelerada de Capital',
        description: 'Maximizar rentabilidade aceitando alta volatilidade e períodos prolongados de baixa.',
        score: 95,
      },
    ],
  },
  {
    id: 'investment_horizon',
    category: 'horizon',
    title: 'Por quanto tempo você pretende manter esses investimentos?',
    subtitle: 'Prazos maiores amortizam a volatilidade de curto prazo da bolsa brasileira.',
    weight: 0.20,
    options: [
      {
        id: 'horizon_short',
        label: 'Curto prazo (até 2 anos)',
        description: 'Necessidade de resgate em horizonte próximo (ex: entrada de imóvel ou transição de carreira).',
        score: 10,
      },
      {
        id: 'horizon_medium',
        label: 'Médio prazo (2 a 5 anos)',
        description: 'Horizonte planejado para metas intermediárias, permitindo parcela moderada em risco.',
        score: 40,
      },
      {
        id: 'horizon_long',
        label: 'Longo prazo (5 a 10 anos)',
        description: 'Construção contínua de patrimônio com tempo suficiente para capturar ciclos de corte da Selic.',
        score: 75,
      },
      {
        id: 'horizon_very_long',
        label: 'Muito longo prazo (mais de 10 anos / Aposentadoria)',
        description: 'Foco na independência financeira, sem qualquer necessidade de resgate forçado.',
        score: 95,
      },
    ],
  },
  {
    id: 'market_drop_reaction',
    category: 'crisis_reaction',
    title: 'Cenário B3: Circuit Breaker e queda de -25% na carteira',
    subtitle: 'Imagine um mês atípico de pânico político ou crise global na B3. Qual seria a sua atitude imediata?',
    weight: 0.25,
    options: [
      {
        id: 'drop_panic_sell',
        label: 'Venderia tudo imediatamente para estancar as perdas',
        description: 'Não conseguiria dormir tranquilo vendo o patrimônio oscilar para baixo.',
        score: 5,
      },
      {
        id: 'drop_partial_sell',
        label: 'Venderia uma parte dos ativos de risco e migraria para Tesouro Selic',
        description: 'Reduziria a exposição em ações e FIIs para conter a ansiedade.',
        score: 30,
      },
      {
        id: 'drop_hold',
        label: 'Ficaria desconfortável, mas manteria a posição sem vender nada',
        description: 'Compreendo que a perda só se concretiza na venda e aguardaria a recuperação dos fundamentos.',
        score: 65,
      },
      {
        id: 'drop_buy_more',
        label: 'Aumentaria a Ação do mês comprando ativos de qualidade com desconto',
        description: 'Enxergo quedas fortes como janelas raras de barganha e compras com dividend yield elevado.',
        score: 95,
      },
    ],
  },
  {
    id: 'b3_experience',
    category: 'experience',
    title: 'Qual o seu nível de experiência com o mercado financeiro?',
    subtitle: 'Conhecimento prático sobre os instrumentos disponíveis no Brasil.',
    weight: 0.15,
    options: [
      {
        id: 'exp_beginner',
        label: 'Iniciante (Poupança e CDB básico)',
        description: 'Nunca comprei ativos na bolsa ou tive contato com plataformas de corretora.',
        score: 10,
      },
      {
        id: 'exp_intermediate',
        label: 'Intermediário (Tesouro Direto, CDBs e primeiros FIIs)',
        description: 'Já entendo a dinâmica da taxa Selic, marcação a mercado e proventos de Fundos Imobiliários.',
        score: 45,
      },
      {
        id: 'exp_advanced',
        label: 'Avançado (Carteira diversificada em Ações e FIIs há mais de 1 ano)',
        description: 'Acompanho balanços, relatórios gerenciais e já vivenciei oscilações reais de mercado.',
        score: 75,
      },
      {
        id: 'exp_expert',
        label: 'Experiente (Mais de 3 anos de bolsa, análise fundamentalista)',
        description: 'Domino múltiplos de valuation (P/L, P/VP, EV/EBITDA, DY) e estratégias de alocação de ativos.',
        score: 95,
      },
    ],
  },
  {
    id: 'volatility_tolerance',
    category: 'volatility_tolerance',
    title: 'Qual a oscilação anual máxima você aceita tolerar no valor da carteira?',
    subtitle: 'Relação entre oscilação tolerada e expectativa de ganho real acima da inflação.',
    weight: 0.20,
    options: [
      {
        id: 'vol_none',
        label: '0% — Não tolero oscilação negativa em nenhum período',
        description: 'Quero que meu saldo sempre aumente linearmente a cada mês (estilo Tesouro Selic).',
        score: 5,
      },
      {
        id: 'vol_low',
        label: 'Até -5% em anos adversos',
        description: 'Aceito leves oscilações transitórias se a média de 3 anos superar o CDI.',
        score: 35,
      },
      {
        id: 'vol_medium',
        label: 'Até -15% em anos adversos',
        description: 'Aceito volatilidade moderada para buscar rentabilidade IPCA + 6% ou mais no ciclo.',
        score: 65,
      },
      {
        id: 'vol_high',
        label: 'Acima de -20% sem me preocupar',
        description: 'Foco 100% no valuation e no fluxo de caixa no horizonte de 10 anos.',
        score: 95,
      },
    ],
  },
];

export const PROFILE_ALLOCATIONS: Record<InvestorRiskProfile, TargetAllocation> = {
  conservador: {
    fixedIncomePct: 80,
    fiisPct: 15,
    equitiesPct: 5,
    description: 'Prioridade em proteção patrimonial (Tesouro Selic/IPCA e CDBs com liquidez), com leve exposição a FIIs de tijolo consolidados.',
  },
  moderado: {
    fixedIncomePct: 50,
    fiisPct: 30,
    equitiesPct: 20,
    description: 'Equilíbrio sólido entre estabilidade de renda fixa, fluxo mensal de dividendos em FIIs e crescimento moderado em ações blue chips.',
  },
  arrojado: {
    fixedIncomePct: 25,
    fiisPct: 40,
    equitiesPct: 35,
    description: 'Maior inclinação a ativos de renda variável, com forte alocação em Fundos Imobiliários e carteira robusta de ações de dividendos e valor.',
  },
  agressivo: {
    fixedIncomePct: 10,
    fiisPct: 40,
    equitiesPct: 50,
    description: 'Exposição máxima à valorização da B3 e dividend yields elevados. Reserva em renda fixa limitada apenas a oportunidades de compra.',
  },
};

export const PROFILE_METADATA: Record<InvestorRiskProfile, { label: string; minScore: number; maxScore: number; summary: string }> = {
  conservador: {
    label: 'Conservador',
    minScore: 0,
    maxScore: 25,
    summary: 'Seu foco principal é a preservação de capital e previsibilidade. A volatilidade da bolsa deve ser dosada de forma gradual e segura.',
  },
  moderado: {
    label: 'Moderado',
    minScore: 26,
    maxScore: 55,
    summary: 'Você busca rendimentos superiores ao CDI, mas valoriza uma base estável de renda fixa para amortecer períodos de crise na B3.',
  },
  arrojado: {
    label: 'Arrojado',
    minScore: 56,
    maxScore: 80,
    summary: 'Você tolera oscilações de mercado com tranquilidade em prol de retornos reais superiores e fluxos contínuos de dividendos no longo prazo.',
  },
  agressivo: {
    label: 'Agressivo',
    minScore: 81,
    maxScore: 100,
    summary: 'Você domina os ciclos de mercado da B3, vê correções como oportunidade de compra e prioriza a valorização acelerada no longo prazo.',
  },
};

/**
 * Calculates the investor risk score (0 to 100) and maps it to a calibrated profile.
 * @param answers Map of question id to selected option id
 */
export function calculateRiskScore(answers: Record<string, string>): RiskEvaluationResult {
  let weightedScoreSum = 0;
  let totalWeight = 0;
  const reasons: string[] = [];

  for (const question of RISK_QUESTIONS) {
    const selectedOptionId = answers[question.id];
    const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);

    if (selectedOption) {
      weightedScoreSum += selectedOption.score * question.weight;
      totalWeight += question.weight;

      if (question.id === 'market_drop_reaction') {
        reasons.push(`Reação a quedas: "${selectedOption.label}" (${selectedOption.score} pts).`);
      } else if (question.id === 'investment_horizon') {
        reasons.push(`Horizonte temporal: "${selectedOption.label}" confere suporte para ${selectedOption.score > 50 ? 'maior' : 'menor'} volatilidade.`);
      } else if (question.id === 'volatility_tolerance') {
        reasons.push(`Tolerância declarada a oscilações anuais: "${selectedOption.label}".`);
      }
    }
  }

  // Normalize in case weights don't perfectly equal 1.0 (they do, 0.20+0.20+0.25+0.15+0.20 = 1.0)
  const normalizedScore = totalWeight > 0 ? Math.round(weightedScoreSum / totalWeight) : 20;
  const boundedScore = Math.min(100, Math.max(0, normalizedScore));

  let profile: InvestorRiskProfile = 'conservador';
  if (boundedScore >= 81) {
    profile = 'agressivo';
  } else if (boundedScore >= 56) {
    profile = 'arrojado';
  } else if (boundedScore >= 26) {
    profile = 'moderado';
  } else {
    profile = 'conservador';
  }

  const meta = PROFILE_METADATA[profile];
  const recommendedAllocation = PROFILE_ALLOCATIONS[profile];

  return {
    score: boundedScore,
    profile,
    profileLabel: meta.label,
    summary: meta.summary,
    reasons,
    recommendedAllocation,
  };
}
