'use client';

import React, { useState, useEffect } from 'react';
import { MethodologyHero } from '@/components/methodology/MethodologyHero';
import { AveragePriceLab } from '@/components/methodology/AveragePriceLab';
import { MonteCarloExplainer } from '@/components/methodology/MonteCarloExplainer';
import { FixedIncomeMathExplainer } from '@/components/methodology/FixedIncomeMathExplainer';
import { TaxRulesGuide } from '@/components/methodology/TaxRulesGuide';
import { AssetGuardAuditor } from '@/components/methodology/AssetGuardAuditor';
import { HonestyManifesto } from '@/components/methodology/HonestyManifesto';
import { useUI } from '@/lib/theme-context';

export default function ComoCalculamosPage() {
  const { userId } = useUI();
  const [activeTab, setActiveTab] = useState<string>('preco-medio');

  // Handle URL hash changes safely via event listener
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['preco-medio', 'monte-carlo', 'marcacao-mercado', 'regras-fiscais', 'guarda-ativos'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-[#F3F5FA] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Hero with Tabs */}
      <MethodologyHero activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Tab Content */}
      <main className="mb-12">
        {activeTab === 'preco-medio' && <AveragePriceLab />}
        {activeTab === 'monte-carlo' && <MonteCarloExplainer />}
        {activeTab === 'marcacao-mercado' && <FixedIncomeMathExplainer />}
        {activeTab === 'regras-fiscais' && <TaxRulesGuide />}
        {activeTab === 'guarda-ativos' && <AssetGuardAuditor />}
      </main>

      {/* Ethical Commitment Manifesto */}
      <footer className="mt-12 border-t border-white/[0.08] pt-8">
        <HonestyManifesto />
        <div className="mt-8 text-center text-xs text-[#70778C] font-mono">
          CARTEIRA PREDICTOR &bull; Cockpit Pessoal de Investimentos B3 &bull; Carteira Ativa: {userId}
        </div>
      </footer>
    </div>
  );
}
