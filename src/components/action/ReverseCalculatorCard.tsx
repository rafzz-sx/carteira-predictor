// src/components/action/ReverseCalculatorCard.tsx
'use client';

import React, { useState } from 'react';
import {
  Compass,
  Target,
  Coins,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatCurrency, parseCurrencyToCents } from '@/lib/formatters';
import { calculateRequiredMonthlyAction } from '@/domain/finance/action-planner';

interface ReverseCalculatorCardProps {
  className?: string;
  currentPlannedMonthlyCents?: number;
}

const PRESET_GOALS = [
  { label: 'R$ 2.500/mês', cents: 250000 },
  { label: 'R$ 5.000/mês', cents: 500000 },
  { label: 'R$ 10.000/mês', cents: 1000000 },
  { label: 'R$ 20.000/mês', cents: 2000000 },
];

const HORIZONS = [10, 15, 20, 25, 30];

export function ReverseCalculatorCard({
  className = '',
  currentPlannedMonthlyCents = 250000, // R$ 2.500 default
}: ReverseCalculatorCardProps) {
  const [targetIncomeStr, setTargetIncomeStr] = useState<string>('5000');
  const [selectedYears, setSelectedYears] = useState<number>(20);
  const [dividendYieldPct] = useState<number>(7.0);
  const [realRatePct] = useState<number>(6.0);

  const targetMonthlyPassiveCents = parseCurrencyToCents(targetIncomeStr);

  const calc = calculateRequiredMonthlyAction(
    targetMonthlyPassiveCents,
    dividendYieldPct,
    realRatePct,
    selectedYears
  );

  const gapWithCurrentPlanCents = calc.requiredMonthlyCents - currentPlannedMonthlyCents;
  const isCurrentPlanSufficient = gapWithCurrentPlanCents <= 0;

  const percentFromDividends = calc.targetPortfolioCents > 0
    ? Math.round((calc.compoundInterestGainedCents / calc.targetPortfolioCents) * 100)
    : 0;

  return (
    <Card
      variant="glass"
      borderAccent="brand"
      className={`p-5 sm:p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F3F5FA]">
                Calculadora Reversa da Renda Passiva
              </h3>
              <Badge variant="brand" size="sm">
                ENGENHARIA REVERSA B3
              </Badge>
            </div>
            <p className="text-xs text-[#A3A9BC]">
              Defina sua meta de renda passiva mensal e descubra o valor exato da Ação necessária
            </p>
          </div>
        </div>

        <div className="text-[11px] text-[#A3A9BC] flex items-center gap-1.5 self-start sm:self-auto bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
          <span>DY {dividendYieldPct.toFixed(1)}% a.a. • Acumulação IPCA + {realRatePct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Target Goal Input & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3">
          <Input
            label="Renda Passiva Mensal Desejada"
            prefixText="R$"
            suffixText="/mês"
            value={targetIncomeStr}
            onChange={(e) => setTargetIncomeStr(e.target.value)}
            placeholder="5.000,00"
            helperText="Valor mensal limpo de dividendos (FIIs, ações de valor, FIAGRO)."
          />

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_GOALS.map((preset) => (
              <button
                key={preset.cents}
                onClick={() => setTargetIncomeStr((preset.cents / 100).toString())}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                  targetMonthlyPassiveCents === preset.cents
                    ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                    : 'bg-white/[0.03] border border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#A3A9BC]">
            Horizonte de Tempo (Prazo para atingir a meta)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {HORIZONS.map((years) => (
              <button
                key={years}
                onClick={() => setSelectedYears(years)}
                className={`py-3 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                  selectedYears === years
                    ? 'bg-[#7C5CFF] text-white border-[#7C5CFF] font-bold shadow-[0_0_15px_rgba(124,92,255,0.3)]'
                    : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.05]'
                }`}
              >
                <div className="text-xs font-mono">{years}</div>
                <div className="text-[10px] opacity-75">anos</div>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-[#A3A9BC] mt-1">
            Total de {selectedYears * 12} meses de acumulação com reinvestimento integral de proventos.
          </span>
        </div>
      </div>

      {/* Primary Results Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Card 1: Required Monthly Action */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C5CFF]/15 to-transparent border border-[#7C5CFF]/30 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A9BC] uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#7C5CFF]" />
              Ação Mensal Necessária
            </span>
            <Badge variant="brand" size="sm">
              PLANO RECOMENDADO
            </Badge>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F3F5FA] font-tabular maskable">
              {formatCurrency(calc.requiredMonthlyCents)}
              <span className="text-sm font-normal text-[#A3A9BC]"> /mês</span>
            </span>
            <span className="text-xs text-[#A3A9BC]">
              Valor mensal disciplinado para comprar ativos durante {selectedYears} anos.
            </span>
          </div>

          {/* Comparison with user current plan */}
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Sua Ação atual:</span>
            <span className="font-semibold text-[#F3F5FA] font-tabular">
              {formatCurrency(currentPlannedMonthlyCents)}/mês
            </span>
          </div>

          {isCurrentPlanSufficient ? (
            <div className="flex items-center gap-2 text-xs text-[#19D98B]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Excelente! Sua Ação atual de <strong>{formatCurrency(currentPlannedMonthlyCents)}</strong> supera o necessário para bater a meta em {selectedYears} anos!
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[#F5B83D]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Falta acelerar sua Ação em <strong>+{formatCurrency(gapWithCurrentPlanCents)}/mês</strong> para atingir os {formatCurrency(targetMonthlyPassiveCents)}/mês no prazo.
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Target Portfolio Needed */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A3A9BC] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#22D3EE]" />
              Patrimônio Alvo para Viver de Renda
            </span>
            <Badge variant="neutral" size="sm">
              GERAÇÃO DE DIVIDENDOS
            </Badge>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#22D3EE] font-tabular maskable">
              {formatCurrency(calc.targetPortfolioCents)}
            </span>
            <span className="text-xs text-[#A3A9BC]">
              Tamanho da carteira geradora que rende {formatCurrency(targetMonthlyPassiveCents)} todo mês.
            </span>
          </div>

          {/* Breakdown bar: Invested vs Juros Compostos */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A3A9BC]">
                Do seu bolso: <strong>{formatCurrency(calc.totalInvestedCents)}</strong>
              </span>
              <span className="text-[#19D98B]">
                Juros Compostos: <strong>{percentFromDividends}%</strong>
              </span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-[#7C5CFF] h-full"
                style={{
                  width: `${calc.targetPortfolioCents > 0 ? (calc.totalInvestedCents / calc.targetPortfolioCents) * 100 : 0}%`,
                }}
                title="Total investido do bolso"
              />
              <div
                className="bg-[#19D98B] h-full"
                style={{
                  width: `${percentFromDividends}%`,
                }}
                title="Ganho por juros compostos e reinvestimento"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
