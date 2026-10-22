// src/components/fixed-income/MarkToMarketSimulator.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  TesouroDirectSecurity,
  FixedIncomeService,
  MarkToMarketSimulationResult,
} from '@/domain/finance/fixed-income';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface MarkToMarketSimulatorProps {
  securities: TesouroDirectSecurity[];
  initialMtm?: MarkToMarketSimulationResult;
  selectedSecurityId?: string;
  onSelectSecurity?: (id: string) => void;
}

export function MarkToMarketSimulator({
  securities,
  initialMtm,
  selectedSecurityId: controlledSecurityId,
  onSelectSecurity,
}: MarkToMarketSimulatorProps) {
  // Available securities for simulation (Prefixados & IPCA+)
  const eligibleSecurities = useMemo(() => {
    return securities.filter((s) => s.type === 'prefixado' || s.type === 'ipca');
  }, [securities]);

  const [internalSecurityId, setInternalSecurityId] = useState<string>(
    initialMtm?.securityId || eligibleSecurities[1]?.id || eligibleSecurities[0]?.id || 'tesouro_ipca_2035'
  );

  const selectedSecurityId = controlledSecurityId || internalSecurityId;
  const setSelectedSecurityId = (id: string) => {
    setInternalSecurityId(id);
    onSelectSecurity?.(id);
  };

  const [investedAmount, setInvestedAmount] = useState<number>(10000);
  const [rateDeltaBps, setRateDeltaBps] = useState<number>(50); // +50 bps default
  const [yearsElapsed, setYearsElapsed] = useState<number>(2);

  const selectedSecurity = useMemo(() => {
    return eligibleSecurities.find((s) => s.id === selectedSecurityId) || eligibleSecurities[0];
  }, [eligibleSecurities, selectedSecurityId]);

  // Recalculate MtM instantly using domain engine
  const simulation = useMemo(() => {
    if (!selectedSecurity) return null;

    const currentSimulatedRate = selectedSecurity.baseRatePercent + rateDeltaBps / 100;
    const daysElapsed = Math.round(yearsElapsed * 365.25);
    const maturityYear = parseInt(selectedSecurity.maturityDate.split('-')[0], 10);
    const currentYear = 2026;
    const totalYears = Math.max(yearsElapsed + 1, maturityYear - (currentYear - yearsElapsed));
    const daysTotal = Math.round(totalYears * 365.25);

    return FixedIncomeService.calculateMarkToMarket({
      security: selectedSecurity,
      investedCents: investedAmount * 100,
      purchaseRatePercent: selectedSecurity.baseRatePercent,
      currentSimulatedRatePercent: currentSimulatedRate,
      daysElapsed,
      daysTotal,
    });
  }, [selectedSecurity, investedAmount, rateDeltaBps, yearsElapsed]);

  if (!selectedSecurity || !simulation) return null;

  const isAgio = simulation.mtmGainLossCents > 0;
  const isDesagio = simulation.mtmGainLossCents < 0;

  // Visual SVG chart generation (Accrual line vs MtM marker)
  const chartWidth = 560;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const graphW = chartWidth - padding.left - padding.right;
  const graphH = chartHeight - padding.top - padding.bottom;

  // 10 points along the life of the bond
  const totalSimYears = Math.max(5, yearsElapsed + 4);
  const points = [];
  const maxVal = Math.max(simulation.valueAtMaturityGrossCents, simulation.marketExitGrossCents) * 1.05;
  const minVal = investedAmount * 100 * 0.9;

  for (let i = 0; i <= totalSimYears; i++) {
    const xRatio = i / totalSimYears;
    const x = padding.left + xRatio * graphW;
    const curveValue = investedAmount * 100 * Math.pow(1 + selectedSecurity.baseRatePercent / 100, i);
    const yRatio = (curveValue - minVal) / (maxVal - minVal);
    const y = padding.top + graphH - yRatio * graphH;
    points.push({ x, y, year: i, val: curveValue });
  }

  // Current year point
  const currentX = padding.left + (yearsElapsed / totalSimYears) * graphW;
  const currentCurveY =
    padding.top +
    graphH -
    ((simulation.curveAccrualGrossCents - minVal) / (maxVal - minVal)) * graphH;
  const currentMtmY =
    padding.top +
    graphH -
    ((simulation.marketExitGrossCents - minVal) / (maxVal - minVal)) * graphH;

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Simulador de Marcação a Mercado (MtM)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20">
                Duration & Convexidade
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Entenda como a variação da curva de juros valoriza ou desvaloriza seu título antes do vencimento
            </p>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setRateDeltaBps(-150)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
          >
            Queda (-150 bps)
          </button>
          <button
            onClick={() => setRateDeltaBps(0)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.05] text-[#A3A9BC] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
          >
            Neutro (0 bps)
          </button>
          <button
            onClick={() => setRateDeltaBps(+150)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
          >
            Alta (+150 bps)
          </button>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-white/[0.06] bg-black/20">
        {/* Security Picker */}
        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Título do Tesouro
          </label>
          <select
            value={selectedSecurityId}
            onChange={(e) => setSelectedSecurityId(e.target.value)}
            className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
          >
            {eligibleSecurities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.annualRateDescription})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-[#A3A9BC] mt-1 block">
            Vencimento: {selectedSecurity.maturityDate} • Duration: {selectedSecurity.modifiedDurationYears}a
          </span>
        </div>

        {/* Invested Amount */}
        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Valor Investido (R$)
          </label>
          <input
            type="number"
            value={investedAmount}
            onChange={(e) => setInvestedAmount(Math.max(100, Number(e.target.value)))}
            step={1000}
            min={100}
            className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-tabular text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
          />
          <span className="text-[10px] text-[#A3A9BC] mt-1 block">
            PU Atual: R$ {(selectedSecurity.currentUnitPriceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Rate Delta Slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            <span>Choque na Taxa de Juros</span>
            <span
              className={`font-tabular font-bold ${
                rateDeltaBps > 0
                  ? 'text-amber-400'
                  : rateDeltaBps < 0
                  ? 'text-emerald-400'
                  : 'text-[#F3F5FA]'
              }`}
            >
              {rateDeltaBps > 0 ? `+${rateDeltaBps}` : rateDeltaBps} bps ({(rateDeltaBps / 100).toFixed(2)}%)
            </span>
          </div>
          <input
            type="range"
            min={-300}
            max={300}
            step={10}
            value={rateDeltaBps}
            onChange={(e) => setRateDeltaBps(Number(e.target.value))}
            className="w-full accent-[#7C5CFF] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#A3A9BC] mt-1">
            <span>-300 bps (Corte)</span>
            <span>0</span>
            <span>+300 bps (Alta)</span>
          </div>
        </div>

        {/* Elapsed Time */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            <span>Tempo Transcorrido</span>
            <span className="font-tabular font-bold text-[#F3F5FA]">{yearsElapsed} anos</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={yearsElapsed}
            onChange={(e) => setYearsElapsed(Number(e.target.value))}
            className="w-full accent-[#22D3EE] h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#A3A9BC] mt-1">
            <span>1 ano</span>
            <span>{simulation.daysRemaining} dias restantes</span>
            <span>8 anos</span>
          </div>
        </div>
      </div>

      {/* Main Dual-Verdict Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1: Hold to Maturity (Carregar até o vencimento) */}
        <div className="p-4 sm:p-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Se mantiver até o vencimento ({selectedSecurity.maturityDate})</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(simulation.valueAtMaturityGrossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-emerald-300 font-medium mt-0.5">
                +R$ {(simulation.profitAtMaturityGrossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de lucro contratado ({selectedSecurity.annualRateDescription})
              </p>
            </div>
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              100% GARANTIDO
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/15 text-[11px] text-[#A3A9BC]">
            O Tesouro Nacional garante exatamente a taxa contratada de {selectedSecurity.baseRatePercent.toFixed(2)}% a.a. independentemente das oscilações da taxa Selic durante o período.
          </div>
        </div>

        {/* Scenario 2: Early Exit Today (Resgate antecipado com MtM) */}
        <div
          className={`p-4 sm:p-5 rounded-xl border relative overflow-hidden flex flex-col justify-between ${
            isAgio
              ? 'border-[#7C5CFF]/40 bg-[#7C5CFF]/[0.06]'
              : isDesagio
              ? 'border-amber-500/30 bg-amber-500/[0.04]'
              : 'border-white/[0.08] bg-black/20'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A3A9BC]">
                <TrendingUp className="w-4 h-4 text-[#7C5CFF]" />
                <span>Se resgatar HOJE a mercado (após {yearsElapsed} anos)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(simulation.marketExitGrossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs font-semibold font-tabular ${
                    isAgio ? 'text-emerald-400' : isDesagio ? 'text-amber-400' : 'text-[#A3A9BC]'
                  }`}
                >
                  {simulation.mtmGainLossPercent > 0 ? `+${simulation.mtmGainLossPercent}%` : `${simulation.mtmGainLossPercent}%`} de marcação
                </span>
                <span className="text-[11px] text-[#A3A9BC]">
                  (Líquido: R$ {(simulation.marketExitNetCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} após {simulation.applicableTaxRatePercent}% IR)
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                isAgio
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : isDesagio
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-white/[0.05] text-[#A3A9BC] border-white/[0.1]'
              }`}
            >
              {isAgio ? 'ÁGIO DE MERCADO' : isDesagio ? 'DESÁGIO TEMPORÁRIO' : 'NA CURVA'}
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.08] text-[11px] text-[#A3A9BC]">
            Sensibilidade: Para cada 100 bps de variação na taxa, o preço deste título oscila aprox.{' '}
            <strong className="text-[#F3F5FA] font-tabular">{simulation.priceSensitivityPer100Bps}%</strong> (Duration {simulation.modifiedDurationYears} anos).
          </div>
        </div>
      </div>

      {/* SVG Interactive Visual Chart */}
      <div className="p-4 rounded-xl border border-white/[0.06] bg-black/30">
        <div className="flex items-center justify-between text-xs text-[#A3A9BC] mb-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#22D3EE]" /> Curva Teórica Contratada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C5CFF]" /> Posição de Resgate com MtM
            </span>
          </div>
          <span className="text-[11px] text-[#A3A9BC] hidden sm:inline">
            Eixo X: Anos decorridos • Eixo Y: Patrimônio (R$)
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto min-w-[500px] select-none"
          >
            {/* Horizontal Gridlines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio) => {
              const y = padding.top + graphH * (1 - ratio);
              const val = minVal + (maxVal - minVal) * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#666E85"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    R$ {(val / 100000).toFixed(1)}k
                  </text>
                </g>
              );
            })}

            {/* Accrual Curve (Teórica) */}
            <path
              d={pathD}
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Vertical line for Current Elapsed Year */}
            <line
              x1={currentX}
              y1={padding.top}
              x2={currentX}
              y2={chartHeight - padding.bottom}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 4"
            />
            <text
              x={currentX}
              y={chartHeight - padding.bottom + 15}
              textAnchor="middle"
              fill="#A3A9BC"
              fontSize="10"
              fontWeight="bold"
            >
              Ano {yearsElapsed} (Hoje)
            </text>

            {/* Curve Accrual Dot */}
            <circle cx={currentX} cy={currentCurveY} r="4" fill="#22D3EE" />

            {/* MtM Market Exit Dot */}
            <circle
              cx={currentX}
              cy={currentMtmY}
              r="6"
              fill="#7C5CFF"
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />

            {/* Line connecting Accrual and MtM */}
            {currentCurveY !== currentMtmY && (
              <line
                x1={currentX}
                y1={currentCurveY}
                x2={currentX}
                y2={currentMtmY}
                stroke={isAgio ? '#10B981' : '#F59E0B'}
                strokeWidth="2"
                strokeDasharray="2 2"
              />
            )}

            {/* Label for MtM */}
            <text
              x={currentX + (currentX > chartWidth - 120 ? -10 : 10)}
              y={currentMtmY + 4}
              textAnchor={currentX > chartWidth - 120 ? 'end' : 'start'}
              fill={isAgio ? '#10B981' : isDesagio ? '#F59E0B' : '#F3F5FA'}
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              R$ {(simulation.marketExitGrossCents / 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              {' '}({simulation.mtmGainLossPercent > 0 ? `+${simulation.mtmGainLossPercent}%` : `${simulation.mtmGainLossPercent}%`})
            </text>
          </svg>
        </div>
      </div>

      {/* Pedagogical Verdict Notice */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
          isAgio
            ? 'border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300'
            : isDesagio
            ? 'border-amber-500/30 bg-amber-500/[0.05] text-amber-300'
            : 'border-white/[0.08] bg-black/20 text-[#A3A9BC]'
        }`}
      >
        {isAgio ? (
          <Sparkles className="w-5 h-5 shrink-0 text-emerald-400" />
        ) : isDesagio ? (
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
        ) : (
          <HelpCircle className="w-5 h-5 shrink-0 text-[#22D3EE]" />
        )}
        <div className="leading-relaxed">
          <strong className="block text-[#F3F5FA] font-semibold mb-1">
            {isAgio
              ? 'Oportunidade de Ganho de Capital (Ágio)'
              : isDesagio
              ? 'Deságio Temporário — Não Venda em Pânico!'
              : 'Rentabilidade Alinhada à Curva'}
          </strong>
          {simulation.verdictText}
        </div>
      </div>
    </div>
  );
}
