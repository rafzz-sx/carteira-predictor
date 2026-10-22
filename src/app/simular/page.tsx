// src/app/simular/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  History,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/formatters';
import {
  PortfolioAssetInput,
  ScenarioSimulationResult,
  MonteCarloSimulationResult,
} from '@/domain/finance/scenario-simulator';
import { MonteCarloChart } from '@/components/simulation/MonteCarloChart';
import { HistoricalStressCard } from '@/components/simulation/HistoricalStressCard';
import { CustomShockSimulator } from '@/components/simulation/CustomShockSimulator';

interface SimulationApiResponse {
  positions: PortfolioAssetInput[];
  totalPortfolioCents: number;
  currentActionCents: number;
  historicalScenarios: ScenarioSimulationResult[];
  monteCarlo: MonteCarloSimulationResult;
  isReferencePortfolio: boolean;
  disclaimer: string;
}

export default function SimularPage() {
  const [data, setData] = useState<SimulationApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monte_carlo' | 'historical' | 'custom'>('monte_carlo');

  useEffect(() => {
    let isCancelled = false;
    async function loadSimulation() {
      try {
        setLoading(true);
        const res = await fetch('/api/simular');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Falha ao carregar simulação.');

        if (!isCancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Erro inesperado.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    loadSimulation();
    return () => {
      isCancelled = true;
    };
  }, []);

  const worstHistoricalScenario = data?.historicalScenarios.reduce((min, s) =>
    s.deltaPercent < min.deltaPercent ? s : min
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F3F5FA]">
              Simulador de Cenários & Estresse B3
            </h1>
            <Badge variant="brand" size="sm">
              MONTE CARLO
            </Badge>
            <Badge variant="warning" size="sm">
              STRESS TEST B3
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#A3A9BC] mt-0.5">
            Modelagem estocástica com 1.000 trajetórias, testes de crises históricas reais e sensibilidade macroeconômica
          </p>
        </div>

        {data?.isReferencePortfolio && (
          <div className="text-xs text-[#F5B83D] bg-[#F5B83D]/10 px-3 py-1.5 rounded-xl border border-[#F5B83D]/30 flex items-center gap-1.5 self-start sm:self-auto font-mono">
            <span>DADOS DE EXEMPLO (Carteira de Referência B3)</span>
          </div>
        )}
      </div>

      {loading && !data ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-sm text-[#FF4D6D]">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Top Hero KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Current Portfolio Base */}
            <Card variant="metric" borderAccent="brand" className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                  Base Patrimonial Simulada
                </span>
                <Badge variant="brand" size="sm">
                  CUSTÓDIA
                </Badge>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F3F5FA] font-tabular maskable">
                  {formatCurrency(data.totalPortfolioCents)}
                </div>
                <div className="text-xs text-[#A3A9BC] mt-0.5">
                  Com Ação planejada de {formatCurrency(data.currentActionCents)}/mês
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] text-[11px] text-[#70778C]">
                {data.positions.length} ativos em custódia nacional
              </div>
            </Card>

            {/* Card 2: 20-Year Median Projection */}
            <Card variant="metric" borderAccent="none" className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                  Projeção Mediana P50 (20 Anos)
                </span>
                <Badge variant="gain" size="sm">
                  CENTRAL
                </Badge>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#19D98B] font-tabular maskable">
                  {formatCurrency(data.monteCarlo.finalOutcome.p50Cents)}
                </div>
                <div className="text-xs text-[#A3A9BC] mt-0.5">
                  Renda passiva: {formatCurrency(data.monteCarlo.finalOutcome.p50PassiveMonthlyCents)}/mês
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] text-[11px] text-[#A3A9BC] flex items-center justify-between">
                <span>Multiplicador de patrimônio:</span>
                <span className="font-mono text-[#F3F5FA] font-bold">
                  {data.monteCarlo.finalOutcome.p50Multiplier}x do investido
                </span>
              </div>
            </Card>

            {/* Card 3: Worst Historical Drawdown */}
            <Card variant="metric" borderAccent="warning" className="p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                  Pior Drawdown Histórico
                </span>
                <Badge variant="loss" size="sm">
                  ESTRESSE
                </Badge>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#FF4D6D] font-tabular font-mono">
                  {worstHistoricalScenario?.deltaPercent.toFixed(1)}%
                </div>
                <div className="text-xs text-[#A3A9BC] mt-0.5 truncate">
                  {worstHistoricalScenario?.scenario.name}
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] text-[11px] text-[#A3A9BC] flex items-center justify-between">
                <span>Perda máxima estimada:</span>
                <span className="font-tabular text-[#FF4D6D] font-bold maskable">
                  {formatCurrency(worstHistoricalScenario?.deltaAmountCents || 0)}
                </span>
              </div>
            </Card>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('monte_carlo')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'monte_carlo'
                  ? 'bg-[#7C5CFF] text-white shadow-[0_0_15px_rgba(124,92,255,0.3)]'
                  : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Monte Carlo (Probabilidades)</span>
            </button>

            <button
              onClick={() => setActiveTab('historical')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'historical'
                  ? 'bg-[#F5B83D] text-[#07080C] shadow-[0_0_15px_rgba(245,184,61,0.3)] font-bold'
                  : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Estresse Histórico B3</span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === 'custom'
                  ? 'bg-[#22D3EE] text-[#07080C] shadow-[0_0_15px_rgba(34,211,238,0.3)] font-bold'
                  : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Choques Personalizados</span>
            </button>
          </div>

          {/* Dynamic Active Tab Content */}
          {activeTab === 'monte_carlo' && (
            <MonteCarloChart simulation={data.monteCarlo} />
          )}

          {activeTab === 'historical' && (
            <HistoricalStressCard scenarios={data.historicalScenarios} />
          )}

          {activeTab === 'custom' && (
            <CustomShockSimulator positions={data.positions} />
          )}

          {/* Rule 0 Disclaimer */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-2 text-xs text-[#70778C]">
            <Shield className="w-4 h-4 text-[#7C5CFF] shrink-0" />
            <span>
              {data.disclaimer} As simulações utilizam o modelo de Movimento Browniano Geométrico e choques empíricos observados na bolsa brasileira. Não representam promessa de rentabilidade futura.
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
