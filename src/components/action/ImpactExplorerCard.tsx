// src/components/action/ImpactExplorerCard.tsx
'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Info,
  Calendar,
  Coins,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';
import {
  calculateAnnuityFutureValue,
  calculateMonthlyPassiveIncome,
} from '@/domain/finance/action-planner';

interface ImpactExplorerCardProps {
  className?: string;
  defaultExtraAmountCents?: number;
}

const PRESET_AMOUNTS = [
  { label: '+ R$ 100', cents: 10000 },
  { label: '+ R$ 200', cents: 20000 },
  { label: '+ R$ 500', cents: 50000 },
  { label: '+ R$ 1.000', cents: 100000 },
  { label: '+ R$ 2.000', cents: 200000 },
];

const ASSUMED_REAL_RATE_PCT = 6.0; // IPCA + 6.0% a.a. real
const ASSUMED_DIVIDEND_YIELD_PCT = 7.0; // 7.0% sustainable DY

export function ImpactExplorerCard({
  className = '',
  defaultExtraAmountCents = 20000, // R$ 200
}: ImpactExplorerCardProps) {
  const [selectedExtraCents, setSelectedExtraCents] = useState<number>(defaultExtraAmountCents);

  const horizons = [10, 20, 30].map((years) => {
    const totalInvestedCents = selectedExtraCents * years * 12;
    const futureValueCents = calculateAnnuityFutureValue(
      selectedExtraCents,
      ASSUMED_REAL_RATE_PCT,
      years
    );
    const monthlyPassiveIncomeCents = calculateMonthlyPassiveIncome(
      futureValueCents,
      ASSUMED_DIVIDEND_YIELD_PCT
    );
    const compoundMultiplier = totalInvestedCents > 0
      ? (futureValueCents / totalInvestedCents).toFixed(1)
      : '1.0';

    return {
      years,
      totalInvestedCents,
      futureValueCents,
      monthlyPassiveIncomeCents,
      compoundMultiplier,
    };
  });

  return (
    <Card
      variant="glass"
      borderAccent="none"
      className={`p-5 sm:p-6 flex flex-col gap-5 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F3F5FA]">
                Explorador de Impacto no Longo Prazo
              </h3>
              <Badge variant="brand" size="sm">
                SIMULAÇÃO QUANTITATIVA
              </Badge>
            </div>
            <p className="text-xs text-[#A3A9BC]">
              Veja a força exponencial dos juros compostos caso você aumente sua Ação mensal
            </p>
          </div>
        </div>

        <div className="text-[11px] text-[#A3A9BC] flex items-center gap-1.5 self-start sm:self-auto bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06]">
          <Info className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
          <span>Premissas: IPCA + 6,0% a.a. real • 7% Dividend Yield</span>
        </div>
      </div>

      {/* Preset Selector Chips */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#A3A9BC]">
          Escolha o acréscimo mensal na sua Ação regular:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_AMOUNTS.map((preset) => {
            const isSelected = selectedExtraCents === preset.cents;
            return (
              <button
                key={preset.cents}
                onClick={() => setSelectedExtraCents(preset.cents)}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#22D3EE] text-[#07080C] shadow-[0_0_15px_rgba(34,211,238,0.35)] scale-[1.02]'
                    : 'bg-white/[0.03] border border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.06]'
                }`}
              >
                {preset.label}/mês
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Horizon Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {horizons.map((h) => (
          <div
            key={h.years}
            className={`p-4 rounded-xl border flex flex-col justify-between gap-3.5 transition-all ${
              h.years === 30
                ? 'bg-[#7C5CFF]/10 border-[#7C5CFF]/30 shadow-[0_0_20px_rgba(124,92,255,0.12)]'
                : 'bg-white/[0.02] border-white/[0.08]'
            }`}
          >
            {/* Top Period Badge */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#F3F5FA] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                Em {h.years} Anos
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-[#22D3EE]">
                {h.compoundMultiplier}x multiplicador
              </span>
            </div>

            {/* Main Value */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-[#A3A9BC]">Patrimônio extra acumulado:</span>
              <span className="text-lg sm:text-xl font-bold text-[#F3F5FA] font-tabular maskable">
                {formatCurrency(h.futureValueCents)}
              </span>
            </div>

            {/* Passive Income Metric */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[#19D98B]">
                <Coins className="w-3.5 h-3.5" />
                <span className="font-medium">Renda passiva extra:</span>
              </div>
              <span className="text-xs font-bold text-[#19D98B] font-tabular maskable">
                {formatCurrency(h.monthlyPassiveIncomeCents)}/mês
              </span>
            </div>

            {/* Bottom Invested Detail */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#A3A9BC]">
              <span>Investido do bolso:</span>
              <span className="font-mono">{formatCurrency(h.totalInvestedCents)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quantitative Takeaway Footer */}
      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start sm:items-center gap-2.5 text-xs text-[#A3A9BC]">
        <Sparkles className="w-4 h-4 text-[#7C5CFF] shrink-0 mt-0.5 sm:mt-0" />
        <span>
          Aumentando apenas <strong>{formatCurrency(selectedExtraCents)}</strong> por mês na sua Ação regular, você acumula mais de{' '}
          <strong className="text-[#F3F5FA]">{formatCurrency(horizons[2].futureValueCents)}</strong> em 30 anos, gerando{' '}
          <strong className="text-[#19D98B]">{formatCurrency(horizons[2].monthlyPassiveIncomeCents)}</strong> todo mês em dividendos isentos de imposto ou reinvestíveis.
        </span>
      </div>
    </Card>
  );
}
