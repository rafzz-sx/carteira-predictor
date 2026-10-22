// src/components/simulation/HistoricalStressCard.tsx
'use client';

import React, { useState } from 'react';
import {
  Info,
  History,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';
import { ScenarioSimulationResult } from '@/domain/finance/scenario-simulator';

interface HistoricalStressCardProps {
  scenarios: ScenarioSimulationResult[];
  className?: string;
}

export function HistoricalStressCard({ scenarios, className = '' }: HistoricalStressCardProps) {
  const [selectedId, setSelectedId] = useState<string>(scenarios[0]?.scenario.id || 'joesley_day');

  const current = scenarios.find((s) => s.scenario.id === selectedId) || scenarios[0];
  if (!current) return null;

  const isLoss = current.deltaAmountCents < 0;

  return (
    <Card variant="glass" borderAccent="warning" className={`p-5 sm:p-6 flex flex-col gap-5 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F5B83D]/15 border border-[#F5B83D]/30 text-[#F5B83D]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA]">
                Testes de Estresse Histórico B3
              </h2>
              <Badge variant="warning" size="sm">
                CRISES REAIS
              </Badge>
            </div>
            <p className="text-xs text-[#A3A9BC]">
              Veja como seu portfólio atual se comportaria caso os maiores choques da história recente se repetissem
            </p>
          </div>
        </div>

        <div className="text-[11px] text-[#A3A9BC] flex items-center gap-1.5 self-start sm:self-auto bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
          <Info className="w-3.5 h-3.5 text-[#F5B83D] shrink-0" />
          <span>Dados empíricos apurados no pregão B3</span>
        </div>
      </div>

      {/* Scenario Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {scenarios.map((scen) => {
          const isSelected = scen.scenario.id === selectedId;
          const isScenLoss = scen.deltaAmountCents < 0;
          return (
            <button
              key={scen.scenario.id}
              onClick={() => setSelectedId(scen.scenario.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-white/[0.08] border-[#F5B83D] shadow-[0_0_15px_rgba(245,184,61,0.2)]'
                  : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F3F5FA] truncate">
                  {scen.scenario.name.split('(')[0]}
                </span>
                <span
                  className={`text-[10px] font-mono font-semibold ${
                    isScenLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
                  }`}
                >
                  {isScenLoss ? '' : '+'}
                  {scen.deltaPercent.toFixed(1)}%
                </span>
              </div>
              <span className="text-[10px] text-[#70778C]">{scen.scenario.period}</span>
            </button>
          );
        })}
      </div>

      {/* Detailed Impact Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-black/40 border border-white/[0.08]">
        {/* Metric 1: Delta on user portfolio */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#A3A9BC]">Impacto no seu patrimônio:</span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-tabular maskable ${
                isLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
              }`}
            >
              {isLoss ? '' : '+'}
              {formatCurrency(current.deltaAmountCents)}
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                isLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
              }`}
            >
              ({isLoss ? '' : '+'}
              {current.deltaPercent.toFixed(2)}%)
            </span>
          </div>
          <span className="text-[11px] text-[#70778C]">
            De {formatCurrency(current.initialTotalCents)} para {formatCurrency(current.simulatedTotalCents)}
          </span>
        </div>

        {/* Metric 2: Resilience Score Gauge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Score de Resiliência:</span>
            <span className="font-mono font-bold text-[#F3F5FA]">{current.resilienceScore}/100</span>
          </div>
          <div className="w-full bg-white/[0.08] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                current.resilienceScore >= 75
                  ? 'bg-[#19D98B]'
                  : current.resilienceScore >= 50
                  ? 'bg-[#F5B83D]'
                  : 'bg-[#FF4D6D]'
              }`}
              style={{ width: `${current.resilienceScore}%` }}
            />
          </div>
          <span className="text-[10px] text-[#70778C]">{current.diagnosis}</span>
        </div>

        {/* Metric 3: Macro Facts of the Event */}
        <div className="flex flex-col gap-1 text-[11px] text-[#A3A9BC] border-t md:border-t-0 md:border-l border-white/[0.08] md:pl-4 pt-2 md:pt-0">
          <span className="font-semibold text-[#F3F5FA] mb-0.5">Parâmetros do Evento Histórico:</span>
          <div className="flex justify-between">
            <span>Ibovespa no choque:</span>
            <span className="font-mono text-[#F3F5FA]">{current.scenario.macroImpacts.ibovChangePercent}%</span>
          </div>
          <div className="flex justify-between">
            <span>IFIX (Fundos Imobiliários):</span>
            <span className="font-mono text-[#F3F5FA]">{current.scenario.macroImpacts.ifixChangePercent}%</span>
          </div>
          <div className="flex justify-between">
            <span>Choque DI / Selic:</span>
            <span className="font-mono text-[#F3F5FA]">+{current.scenario.macroImpacts.selicChangeBps} bps</span>
          </div>
        </div>
      </div>

      {/* Narrative context */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5 text-xs text-[#A3A9BC]">
        <Info className="w-4 h-4 text-[#7C5CFF] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#F3F5FA]">{current.scenario.name}: </strong>
          <span>{current.scenario.context}</span>
        </div>
      </div>

      {/* Position Breakdown Table */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#A3A9BC]">
          Comportamento Ativo a Ativo na sua Custódia:
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#A3A9BC]">
                <th className="pb-2 font-semibold">Ativo</th>
                <th className="pb-2 font-semibold">Classe</th>
                <th className="pb-2 font-semibold">Saldo Atual</th>
                <th className="pb-2 font-semibold">Saldo no Choque</th>
                <th className="pb-2 font-semibold text-right">Variação R$</th>
                <th className="pb-2 font-semibold text-right">Variação %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {current.assetImpacts.map((pos) => {
                const isPosLoss = pos.deltaCents < 0;
                return (
                  <tr key={pos.ticker} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono font-bold text-[#F3F5FA]">
                      {pos.ticker}
                    </td>
                    <td className="py-2.5 text-[#A3A9BC] uppercase text-[10px]">
                      {pos.assetClass}
                    </td>
                    <td className="py-2.5 font-tabular text-[#A3A9BC] maskable">
                      {formatCurrency(pos.initialCents)}
                    </td>
                    <td className="py-2.5 font-tabular text-[#F3F5FA] font-semibold maskable">
                      {formatCurrency(pos.simulatedCents)}
                    </td>
                    <td
                      className={`py-2.5 font-tabular text-right font-semibold maskable ${
                        isPosLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
                      }`}
                    >
                      {isPosLoss ? '' : '+'}
                      {formatCurrency(pos.deltaCents)}
                    </td>
                    <td
                      className={`py-2.5 font-mono text-right font-bold ${
                        isPosLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
                      }`}
                    >
                      {isPosLoss ? '' : '+'}
                      {pos.deltaPercent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
