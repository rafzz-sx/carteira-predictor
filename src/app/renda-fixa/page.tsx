// src/app/renda-fixa/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUI } from '@/lib/theme-context';
import {
  TesouroDirectSecurity,
  PrivateCreditInstrument,
  YieldCurvePoint,
  InvestmentComparisonItem,
  MarkToMarketSimulationResult,
  FgcAnalysisResult,
  FixedIncomeService,
} from '@/domain/finance/fixed-income';
import { FixedIncomeHero } from '@/components/fixed-income/FixedIncomeHero';
import { MarkToMarketSimulator } from '@/components/fixed-income/MarkToMarketSimulator';
import { YieldCurveWidget } from '@/components/fixed-income/YieldCurveWidget';
import { FixedIncomeComparator } from '@/components/fixed-income/FixedIncomeComparator';
import { FgcCoverageThermometer } from '@/components/fixed-income/FgcCoverageThermometer';
import { FixedIncomeShowcase } from '@/components/fixed-income/FixedIncomeShowcase';
import { Sliders, Scale, ShieldCheck, Landmark, Loader2 } from 'lucide-react';

interface MacroRates {
  selicPercent: number;
  cdiPercent: number;
  ipca12mPercent: number;
  realInterestPercent: number;
  referenceDate: string;
  source: string;
  isExample: boolean;
}

export default function RendaFixaPage() {
  const { userId } = useUI();
  const [activeTab, setActiveTab] = useState<'mtm' | 'compare' | 'fgc' | 'showcase'>('mtm');
  const [loading, setLoading] = useState<boolean>(true);

  const [macroRates, setMacroRates] = useState<MacroRates | undefined>(undefined);
  const [yieldCurve, setYieldCurve] = useState<YieldCurvePoint[]>([]);
  const [tesouroSecurities, setTesouroSecurities] = useState<TesouroDirectSecurity[]>([]);
  const [privateCreditInstruments, setPrivateCreditInstruments] = useState<PrivateCreditInstrument[]>([]);
  const [defaultComparison, setDefaultComparison] = useState<InvestmentComparisonItem[]>([]);
  const [defaultMtm, setDefaultMtm] = useState<MarkToMarketSimulationResult | undefined>(undefined);
  const [fgcAnalysis, setFgcAnalysis] = useState<FgcAnalysisResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/fixed-income?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setMacroRates(data.macroRates);
            setYieldCurve(data.yieldCurve);
            setTesouroSecurities(data.tesouroSecurities);
            setPrivateCreditInstruments(data.privateCreditInstruments);
            setDefaultComparison(data.defaultComparison);
            setDefaultMtm(data.defaultMtm);
            setFgcAnalysis(data.fgcAnalysis);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API fetch failed, falling back to local domain:', err);
      }

      // Offline fallback
      if (isMounted) {
        setYieldCurve(FixedIncomeService.getYieldCurvePoints());
        setTesouroSecurities(FixedIncomeService.getTesouroSecurities());
        setPrivateCreditInstruments(FixedIncomeService.getPrivateCreditShowcase());
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const [selectedSecurityId, setSelectedSecurityId] = useState<string | undefined>(undefined);

  const handleSelectTesouroFromShowcase = (securityId: string) => {
    setSelectedSecurityId(securityId);
    setActiveTab('mtm');
    // Scroll smoothly to simulator
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 pb-24">
      {/* Hero with Macro Rates */}
      <FixedIncomeHero macroRates={macroRates} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0E1017]/80 border border-white/[0.08] backdrop-blur-xl overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('mtm')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'mtm'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Marcação a Mercado & Curva DI</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'compare'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Comparador Líquido & Gross-up</span>
        </button>

        <button
          onClick={() => setActiveTab('fgc')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'fgc'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Termômetro FGC</span>
        </button>

        <button
          onClick={() => setActiveTab('showcase')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'showcase'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Vitrine de Títulos</span>
        </button>
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A3A9BC]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
          <span className="text-sm">Carregando dados de Renda Fixa e Curva de Juros...</span>
        </div>
      ) : (
        <>
          {activeTab === 'mtm' && (
            <div className="flex flex-col gap-8">
              <MarkToMarketSimulator
                securities={tesouroSecurities}
                initialMtm={defaultMtm}
                selectedSecurityId={selectedSecurityId}
                onSelectSecurity={setSelectedSecurityId}
              />
              <YieldCurveWidget points={yieldCurve} />
            </div>
          )}

          {activeTab === 'compare' && (
            <FixedIncomeComparator initialComparison={defaultComparison} />
          )}

          {activeTab === 'fgc' && fgcAnalysis && (
            <FgcCoverageThermometer fgcAnalysis={fgcAnalysis} />
          )}

          {activeTab === 'showcase' && (
            <FixedIncomeShowcase
              tesouroSecurities={tesouroSecurities}
              privateCreditInstruments={privateCreditInstruments}
              onSelectTesouro={handleSelectTesouroFromShowcase}
            />
          )}
        </>
      )}
    </div>
  );
}
