// src/app/imposto/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useUI } from '@/lib/theme-context';
import { TaxAuditResult, TaxCalculator } from '@/domain/finance/tax-calculator';
import { TaxHero } from '@/components/tax/TaxHero';
import { MonthlyDarfCard } from '@/components/tax/MonthlyDarfCard';
import { SaleImpactSimulator } from '@/components/tax/SaleImpactSimulator';
import { LossCarryoverCard } from '@/components/tax/LossCarryoverCard';
import { DirpfReportCard } from '@/components/tax/DirpfReportCard';
import { Calendar, Calculator, TrendingDown, FileSpreadsheet, Loader2 } from 'lucide-react';

export default function ImpostoPage() {
  const { userId } = useUI();
  const [activeTab, setActiveTab] = useState<'darf' | 'simulator' | 'loss' | 'dirpf'>('darf');
  const [loading, setLoading] = useState<boolean>(true);
  const [auditResult, setAuditResult] = useState<TaxAuditResult | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tax?userId=${encodeURIComponent(userId)}&year=${selectedYear}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setAuditResult(data.auditResult);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API tax fetch failed, falling back to local domain:', err);
      }

      // Offline fallback
      if (isMounted) {
        const fallback = TaxCalculator.auditAnnualTax(selectedYear, []);
        setAuditResult(fallback);
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [userId, selectedYear]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 pb-24">
      {/* Hero with Fiscal KPIs */}
      <TaxHero auditResult={auditResult || undefined} currentMonthIndex={10} />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0E1017]/80 border border-white/[0.08] backdrop-blur-xl overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('darf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'darf'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Apuração Mensal & DARF 6015</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Simulador de Venda (Teto R$ 20k)</span>
        </button>

        <button
          onClick={() => setActiveTab('loss')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'loss'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Compensação de Prejuízos</span>
        </button>

        <button
          onClick={() => setActiveTab('dirpf')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeTab === 'dirpf'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_20px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Informe Anual DIRPF</span>
        </button>

        {/* Year Selector */}
        <div className="ml-auto flex items-center gap-1 pl-3 pr-2 border-l border-white/[0.08] shrink-0">
          {[2026, 2025].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedYear === yr
                  ? 'bg-white/10 text-[#F3F5FA]'
                  : 'text-[#A3A9BC] hover:text-[#F3F5FA]'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Areas */}
      {loading || !auditResult ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#A3A9BC]">
          <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
          <span className="text-sm">Auditando regras fiscais da Receita Federal...</span>
        </div>
      ) : (
        <>
          {activeTab === 'darf' && (
            <MonthlyDarfCard
              monthlyBreakdowns={auditResult.monthlyBreakdowns}
              initialMonthIndex={10}
            />
          )}

          {activeTab === 'simulator' && (
            <SaleImpactSimulator
              currentMonthSalesCents={auditResult.monthlyBreakdowns[9]?.totalStockSalesCents || 0}
              accumulatedLossCents={auditResult.currentStockLossCarryoverCents}
            />
          )}

          {activeTab === 'loss' && (
            <LossCarryoverCard
              stockLossCents={auditResult.currentStockLossCarryoverCents}
              fiiLossCents={auditResult.currentFiiLossCarryoverCents}
              dayTradeLossCents={auditResult.currentDayTradeLossCarryoverCents}
            />
          )}

          {activeTab === 'dirpf' && (
            <DirpfReportCard report={auditResult.dirpfReport} />
          )}
        </>
      )}
    </div>
  );
}
