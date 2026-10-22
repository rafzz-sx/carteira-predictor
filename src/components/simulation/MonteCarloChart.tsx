// src/components/simulation/MonteCarloChart.tsx
'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Coins,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';
import { MonteCarloSimulationResult } from '@/domain/finance/scenario-simulator';

interface MonteCarloChartProps {
  simulation: MonteCarloSimulationResult;
  className?: string;
}

export function MonteCarloChart({ simulation, className = '' }: MonteCarloChartProps) {
  const [viewMode, setViewMode] = useState<'wealth' | 'income'>('wealth');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const { timeline, iterations, annualSustainableDividendYieldPct } = simulation;

  // Selected or default year milestone (default is final year)
  const activeYear = hoveredYear !== null ? hoveredYear : timeline[timeline.length - 1].year;
  const activePoint = timeline.find((pt) => pt.year === activeYear) || timeline[timeline.length - 1];

  // SVG Chart Dimensions
  const width = 800;
  const height = 320;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 40;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Maximum value for scaling Y
  const maxY = Math.max(...timeline.map((pt) => (viewMode === 'wealth' ? pt.p90Cents : pt.p90PassiveMonthlyCents)));

  const getX = (year: number) => padLeft + (year / simulation.years) * chartW;
  const getY = (valCents: number) => padTop + chartH - (maxY > 0 ? (valCents / maxY) * chartH : 0);

  // Generate SVG area path between P10 and P90
  const areaP10P90 = (() => {
    let topPath = '';
    let bottomPath = '';

    timeline.forEach((pt, i) => {
      const x = getX(pt.year);
      const yTop = getY(viewMode === 'wealth' ? pt.p90Cents : pt.p90PassiveMonthlyCents);
      const yBottom = getY(viewMode === 'wealth' ? pt.p10Cents : pt.p10PassiveMonthlyCents);

      if (i === 0) {
        topPath += `M ${x} ${yTop}`;
        bottomPath = `L ${x} ${yBottom}`;
      } else {
        topPath += ` L ${x} ${yTop}`;
        bottomPath = ` L ${x} ${yBottom}` + bottomPath;
      }
    });

    return topPath + bottomPath + ' Z';
  })();

  // Generate SVG area path between P25 and P75
  const areaP25P75 = (() => {
    let topPath = '';
    let bottomPath = '';

    timeline.forEach((pt, i) => {
      const x = getX(pt.year);
      const yTop = getY(viewMode === 'wealth' ? pt.p75Cents : Math.round((pt.p75Cents * (annualSustainableDividendYieldPct / 100)) / 12));
      const yBottom = getY(viewMode === 'wealth' ? pt.p25Cents : Math.round((pt.p25Cents * (annualSustainableDividendYieldPct / 100)) / 12));

      if (i === 0) {
        topPath += `M ${x} ${yTop}`;
        bottomPath = `L ${x} ${yBottom}`;
      } else {
        topPath += ` L ${x} ${yTop}`;
        bottomPath = ` L ${x} ${yBottom}` + bottomPath;
      }
    });

    return topPath + bottomPath + ' Z';
  })();

  // P50 line path
  const p50Line = timeline
    .map((pt, i) => {
      const x = getX(pt.year);
      const y = getY(viewMode === 'wealth' ? pt.p50Cents : pt.p50PassiveMonthlyCents);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Invested line path (for wealth mode)
  const investedLine = timeline
    .map((pt, i) => {
      const x = getX(pt.year);
      const y = getY(viewMode === 'wealth' ? pt.totalInvestedCents : 0);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <Card variant="glass" borderAccent="brand" className={`p-5 sm:p-6 flex flex-col gap-5 ${className}`}>
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA]">
                Simulação Estocástica de Monte Carlo ({iterations} Trajetórias)
              </h2>
              <Badge variant="brand" size="sm">
                QUANT B3
              </Badge>
            </div>
            <p className="text-xs text-[#A3A9BC]">
              Faixas de probabilidade estocástica P10 (pessimista), P50 (mediana) e P90 (otimista)
            </p>
          </div>
        </div>

        {/* Wealth vs Income Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.08] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('wealth')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'wealth'
                ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                : 'text-[#A3A9BC] hover:text-[#F3F5FA]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Patrimônio Acumulado</span>
          </button>
          <button
            onClick={() => setViewMode('income')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'income'
                ? 'bg-[#22D3EE] text-[#07080C] shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'text-[#A3A9BC] hover:text-[#F3F5FA]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Renda Mensal de Dividendos</span>
          </button>
        </div>
      </div>

      {/* Dynamic Milestone Value Cards (Updates on Hover or Final Year) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* P10 (Pessimistic) */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-[#A3A9BC]">
            <span>P10 (Cenário de Estresse)</span>
            <span className="font-mono text-[#F5B83D]">90% de chance superior</span>
          </div>
          <div className="text-xl font-bold text-[#F5B83D] font-tabular maskable">
            {formatCurrency(viewMode === 'wealth' ? activePoint.p10Cents : activePoint.p10PassiveMonthlyCents)}
            {viewMode === 'income' && <span className="text-xs font-normal text-[#A3A9BC]">/mês</span>}
          </div>
          <span className="text-[10px] text-[#70778C]">Em {activePoint.year} anos</span>
        </div>

        {/* P50 (Median) */}
        <div className="p-3.5 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/35 shadow-[0_0_20px_rgba(124,92,255,0.15)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#F3F5FA] font-bold">P50 (Cenário Mais Provável)</span>
            <span className="font-mono text-[#7C5CFF] font-semibold">Mediana</span>
          </div>
          <div className="text-2xl font-black text-[#F3F5FA] font-tabular maskable">
            {formatCurrency(viewMode === 'wealth' ? activePoint.p50Cents : activePoint.p50PassiveMonthlyCents)}
            {viewMode === 'income' && <span className="text-xs font-normal text-[#A3A9BC]">/mês</span>}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">
            Em {activePoint.year} anos • {activePoint.totalInvestedCents > 0 ? (activePoint.p50Cents / activePoint.totalInvestedCents).toFixed(1) : '1.0'}x do investido
          </span>
        </div>

        {/* P90 (Optimistic) */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-[#A3A9BC]">
            <span>P90 (Cenário Favorável)</span>
            <span className="font-mono text-[#19D98B]">Top 10% melhores</span>
          </div>
          <div className="text-xl font-bold text-[#19D98B] font-tabular maskable">
            {formatCurrency(viewMode === 'wealth' ? activePoint.p90Cents : activePoint.p90PassiveMonthlyCents)}
            {viewMode === 'income' && <span className="text-xs font-normal text-[#A3A9BC]">/mês</span>}
          </div>
          <span className="text-[10px] text-[#70778C]">Em {activePoint.year} anos</span>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="gradientP10P90" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.03" />
            </linearGradient>
            <linearGradient id="gradientP25P75" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padTop + chartH * (1 - pct);
            const val = Math.round(maxY * pct);
            return (
              <g key={pct}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fill="#70778C"
                  fontFamily="monospace"
                >
                  {formatCurrency(val, { compact: true })}
                </text>
              </g>
            );
          })}

          {/* X Axis years */}
          {timeline.map((pt) => {
            const x = getX(pt.year);
            const isHovered = activePoint.year === pt.year;
            return (
              <g key={pt.year}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke={isHovered ? 'rgba(124, 92, 255, 0.35)' : 'rgba(255, 255, 255, 0.04)'}
                />
                <text
                  x={x}
                  y={padTop + chartH + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? '#7C5CFF' : '#70778C'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontFamily="monospace"
                >
                  {pt.year}a
                </text>
              </g>
            );
          })}

          {/* Shaded Area P10-P90 */}
          <path d={areaP10P90} fill="url(#gradientP10P90)" />

          {/* Shaded Area P25-P75 */}
          <path d={areaP25P75} fill="url(#gradientP25P75)" />

          {/* Invested Capital Line (wealth mode only) */}
          {viewMode === 'wealth' && (
            <path
              d={investedLine}
              fill="none"
              stroke="#A3A9BC"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}

          {/* P50 Median Line */}
          <path
            d={p50Line}
            fill="none"
            stroke="#7C5CFF"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Active Hover Point Indicator */}
          {(() => {
            const x = getX(activePoint.year);
            const y = getY(viewMode === 'wealth' ? activePoint.p50Cents : activePoint.p50PassiveMonthlyCents);
            return (
              <g>
                <circle cx={x} cy={y} r="6" fill="#7C5CFF" stroke="#F3F5FA" strokeWidth="2" />
                <circle cx={x} cy={y} r="12" fill="#7C5CFF" opacity="0.3" className="animate-ping" />
              </g>
            );
          })()}

          {/* Invisible interactive hover rects */}
          {timeline.map((pt) => {
            const x = getX(pt.year) - chartW / (simulation.years * 2);
            const w = chartW / simulation.years;
            return (
              <rect
                key={pt.year}
                x={x}
                y={padTop}
                width={w}
                height={chartH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredYear(pt.year)}
                onMouseLeave={() => setHoveredYear(null)}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend & Assumptions Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.08] text-xs text-[#A3A9BC]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#7C5CFF] rounded-full" />
            <span>Mediana P50 (Cenário Central)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#22D3EE]/30 rounded" />
            <span>Faixa P25 - P75 (50% Probabilidade)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#7C5CFF]/15 rounded" />
            <span>Faixa P10 - P90 (80% Probabilidade)</span>
          </div>
          {viewMode === 'wealth' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#A3A9BC]" />
              <span>Capital Investido do Bolso</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-[#70778C]">
          Premissas: IPCA + {simulation.expectedAnnualRealReturnPct}% a.a. real • Vol {simulation.annualVolatilityPct}%
        </div>
      </div>
    </Card>
  );
}
