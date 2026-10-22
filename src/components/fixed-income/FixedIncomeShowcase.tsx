// src/components/fixed-income/FixedIncomeShowcase.tsx
'use client';

import React, { useState } from 'react';
import {
  TesouroDirectSecurity,
  PrivateCreditInstrument,
} from '@/domain/finance/fixed-income';
import { Landmark, Briefcase, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface FixedIncomeShowcaseProps {
  tesouroSecurities: TesouroDirectSecurity[];
  privateCreditInstruments: PrivateCreditInstrument[];
  onSelectTesouro?: (securityId: string) => void;
}

export function FixedIncomeShowcase({
  tesouroSecurities,
  privateCreditInstruments,
  onSelectTesouro,
}: FixedIncomeShowcaseProps) {
  const [filter, setFilter] = useState<'all' | 'tesouro' | 'isento' | 'fgc'>('all');

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
            Vitrine de Títulos Disponíveis no Brasil
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
              B3 & Tesouro Direto
            </span>
          </h2>
          <p className="text-xs text-[#A3A9BC]">
            Explore os principais papéis públicos federais e instrumentos de crédito privado nacional
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                : 'bg-white/[0.05] text-[#A3A9BC] hover:bg-white/[0.1] border border-white/[0.08]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('tesouro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'tesouro'
                ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                : 'bg-white/[0.05] text-[#A3A9BC] hover:bg-white/[0.1] border border-white/[0.08]'
            }`}
          >
            Tesouro Direto
          </button>
          <button
            onClick={() => setFilter('isento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'isento'
                ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                : 'bg-white/[0.05] text-[#A3A9BC] hover:bg-white/[0.1] border border-white/[0.08]'
            }`}
          >
            Isentos de IR
          </button>
          <button
            onClick={() => setFilter('fgc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'fgc'
                ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                : 'bg-white/[0.05] text-[#A3A9BC] hover:bg-white/[0.1] border border-white/[0.08]'
            }`}
          >
            Garantidos pelo FGC
          </button>
        </div>
      </div>

      {/* Grid of Securities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tesouro Securities */}
        {(filter === 'all' || filter === 'tesouro') &&
          tesouroSecurities.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl border border-white/[0.06] bg-black/20 hover:border-[#22D3EE]/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/25 flex items-center gap-1">
                    <Landmark className="w-3 h-3" />
                    Tesouro Nacional
                  </span>
                  <span className="text-[10px] text-[#A3A9BC] font-tabular">
                    Vence {t.maturityDate.split('-')[0]}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#F3F5FA] group-hover:text-[#22D3EE] transition-colors">
                  {t.name}
                </h3>
                <div className="text-base font-bold font-tabular text-[#22D3EE] mt-1">
                  {t.annualRateDescription}
                </div>
                <p className="text-xs text-[#A3A9BC] mt-2 line-clamp-2">
                  {t.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#A3A9BC] block">Mínimo</span>
                  <span className="font-tabular font-medium text-[#F3F5FA]">
                    R$ {(t.minInvestmentCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {onSelectTesouro && (t.type === 'prefixado' || t.type === 'ipca') && (
                  <button
                    onClick={() => onSelectTesouro(t.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#7C5CFF] hover:text-[#9A82FF] transition-colors"
                  >
                    <span>Simular MtM</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

        {/* Private Credit Securities */}
        {(filter === 'all' || filter === 'isento' || filter === 'fgc') &&
          privateCreditInstruments
            .filter((p) => {
              if (filter === 'isento' && !p.isTaxExempt) return false;
              if (filter === 'fgc' && !p.hasFgcGuarantee) return false;
              return true;
            })
            .map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-white/[0.06] bg-black/20 hover:border-[#7C5CFF]/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                        p.isTaxExempt
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                          : 'bg-[#7C5CFF]/15 text-[#7C5CFF] border-[#7C5CFF]/25'
                      }`}
                    >
                      {p.isTaxExempt ? <Sparkles className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                      {p.category.toUpperCase().replace('_', ' ')}
                    </span>

                    {p.hasFgcGuarantee && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        FGC
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#F3F5FA] group-hover:text-[#7C5CFF] transition-colors">
                    {p.issuer}
                  </h3>
                  <div className="text-base font-bold font-tabular text-[#F3F5FA] mt-1">
                    {p.contractedRateDescription}
                  </div>
                  <p className="text-xs text-[#A3A9BC] mt-2 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#A3A9BC] block">Rating & Prazo</span>
                    <span className="font-tabular font-medium text-[#F3F5FA]">
                      {p.creditRating} • {p.termDays} dias
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#A3A9BC] block">Aplicação Mínima</span>
                    <span className="font-tabular font-medium text-[#F3F5FA]">
                      R$ {(p.minInvestmentCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
