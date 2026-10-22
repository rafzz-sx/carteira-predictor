'use client';

import React from 'react';
import { BookOpen, ShieldCheck, Clock, Cpu, FileCheck } from 'lucide-react';

interface MethodologyHeroProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function MethodologyHero({ activeTab, onTabChange }: MethodologyHeroProps) {
  const tabs = [
    { id: 'preco-medio', label: 'Preço Médio (RFB)', icon: BookOpen },
    { id: 'monte-carlo', label: 'Monte Carlo & Risco', icon: Cpu },
    { id: 'marcacao-mercado', label: 'Renda Fixa & MtM', icon: Clock },
    { id: 'regras-fiscais', label: 'Tributação B3', icon: FileCheck },
    { id: 'guarda-ativos', label: 'Guarda de Ativos', icon: ShieldCheck },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.08] p-6 lg:p-8 backdrop-blur-xl mb-8">
      {/* Background glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-10 w-64 h-64 bg-[#22D3EE]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF] text-xs font-semibold uppercase tracking-wider mb-4">
          <BookOpen className="w-3.5 h-3.5" />
          Metodologia & Transparência Algorítmica
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F3F5FA] mb-3">
          Como Calculamos: Cockpit Aberto & Auditável
        </h1>

        <p className="text-sm sm:text-base text-[#A3A9BC] leading-relaxed mb-6">
          No <strong className="text-white">Carteira Predictor</strong>, nenhuma fórmula é uma caixa-preta.
          Apresentamos com rigor matemático e conformidade legal as regras da Receita Federal do Brasil (IN RFB nº 1.585/2015),
          o motor estocástico de Monte Carlo, a marcação a mercado de títulos públicos e a guarda estrita de ativos 100% nacionais.
        </p>

        {/* Feature badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[11px] text-[#70778C] uppercase font-mono tracking-wider">Aritmética</span>
            <span className="text-xs sm:text-sm font-semibold text-[#F3F5FA] font-mono">Centavos Inteiros</span>
            <span className="text-[10px] text-[#A3A9BC]">Zero desvio de floating point</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[11px] text-[#70778C] uppercase font-mono tracking-wider">Receita Federal</span>
            <span className="text-xs sm:text-sm font-semibold text-[#19D98B] font-mono">IN 1.585/2015</span>
            <span className="text-[10px] text-[#A3A9BC]">Preço médio ponderado oficial</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[11px] text-[#70778C] uppercase font-mono tracking-wider">Monte Carlo</span>
            <span className="text-xs sm:text-sm font-semibold text-[#22D3EE] font-mono">1.000 Trajetórias</span>
            <span className="text-[10px] text-[#A3A9BC]">Amostragem Box-Muller</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <span className="text-[11px] text-[#70778C] uppercase font-mono tracking-wider">Regra 0</span>
            <span className="text-xs sm:text-sm font-semibold text-[#F5B83D] font-mono">~30 Min Atraso</span>
            <span className="text-[10px] text-[#A3A9BC]">Transparência total na B3</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/[0.08]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#7C5CFF] text-white shadow-[0_0_15px_rgba(124,92,255,0.4)]'
                    : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
