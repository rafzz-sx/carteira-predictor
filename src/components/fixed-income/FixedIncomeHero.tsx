// src/components/fixed-income/FixedIncomeHero.tsx
'use client';

import React from 'react';
import { Shield, TrendingUp, Percent, Info, Landmark } from 'lucide-react';

interface MacroRates {
  selicPercent: number;
  cdiPercent: number;
  ipca12mPercent: number;
  realInterestPercent: number;
  referenceDate: string;
  source: string;
  isExample: boolean;
}

interface FixedIncomeHeroProps {
  macroRates?: MacroRates;
}

export function FixedIncomeHero({ macroRates }: FixedIncomeHeroProps) {
  const rates = macroRates || {
    selicPercent: 10.75,
    cdiPercent: 10.65,
    ipca12mPercent: 4.42,
    realInterestPercent: 6.33,
    referenceDate: 'Outubro / 2026',
    source: 'Banco Central do Brasil / B3 / IBGE',
    isExample: true,
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-6 sm:p-8">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#22D3EE]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#7C5CFF]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header line with honest badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE] shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
                  Renda Fixa & Títulos Públicos B3
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/25">
                  100% Brasil
                </span>
              </div>
              <p className="text-xs text-[#A3A9BC] mt-0.5">
                Marcação a Mercado (MtM), Curva de Juros DI, Comparador Tributário e Monitor FGC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              DADOS DE EXEMPLO (OUT/2026)
            </span>
          </div>
        </div>

        {/* 4 Macro Key Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#A3A9BC] text-[11px]">
              <span>Taxa Selic Meta</span>
              <Landmark className="w-3.5 h-3.5 text-[#22D3EE]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-[#F3F5FA]">
              {rates.selicPercent.toFixed(2)}%
              <span className="text-xs text-[#A3A9BC] font-normal ml-1">a.a.</span>
            </div>
            <span className="text-[10px] text-[#A3A9BC]">Copom BNDES / Bacen</span>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#A3A9BC] text-[11px]">
              <span>CDI Anualizado</span>
              <Percent className="w-3.5 h-3.5 text-[#7C5CFF]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-[#7C5CFF]">
              {rates.cdiPercent.toFixed(2)}%
              <span className="text-xs text-[#A3A9BC] font-normal ml-1">a.a.</span>
            </div>
            <span className="text-[10px] text-[#A3A9BC]">Benchmark B3 Interbancário</span>
          </div>

          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#A3A9BC] text-[11px]">
              <span>IPCA Acumulado 12m</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-amber-400">
              {rates.ipca12mPercent.toFixed(2)}%
              <span className="text-xs text-[#A3A9BC] font-normal ml-1">a.a.</span>
            </div>
            <span className="text-[10px] text-[#A3A9BC]">Inflação Oficial IBGE</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-emerald-400 text-[11px] font-medium">
              <span>Juro Real Líquido</span>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-emerald-400">
              +{rates.realInterestPercent.toFixed(2)}%
              <span className="text-xs text-emerald-400/70 font-normal ml-1">a.a.</span>
            </div>
            <span className="text-[10px] text-emerald-400/80">Selic descontada a inflação</span>
          </div>
        </div>

        {/* Micro notice */}
        <div className="flex items-center gap-2 text-[11px] text-[#A3A9BC]">
          <Info className="w-3.5 h-3.5 shrink-0 text-[#22D3EE]" />
          <span>
            No Brasil, a marcação a mercado só afeta quem vende antecipadamente. Ao carregar o título até a data de vencimento, você tem 100% da rentabilidade contratada garantida pelo emissor ou pelo Tesouro Nacional.
          </span>
        </div>
      </div>
    </div>
  );
}
