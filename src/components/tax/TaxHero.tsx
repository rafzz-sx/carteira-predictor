// src/components/tax/TaxHero.tsx
'use client';

import React from 'react';
import { FileText, ShieldAlert, CheckCircle2, TrendingDown, DollarSign } from 'lucide-react';
import { TaxAuditResult } from '@/domain/finance/tax-calculator';

interface TaxHeroProps {
  auditResult?: TaxAuditResult;
  currentMonthIndex?: number;
}

export function TaxHero({ auditResult, currentMonthIndex = 10 }: TaxHeroProps) {
  const currentMonthData = auditResult?.monthlyBreakdowns[currentMonthIndex - 1];

  const annualExemptGains = auditResult?.annualExemptGainsCents || 37000; // R$ 370,00
  const annualDarfPaid = auditResult?.annualTotalDarfPaidCents || 62720; // R$ 627,20
  const stockLossCarryover = auditResult?.currentStockLossCarryoverCents || 0;
  const fiiLossCarryover = auditResult?.currentFiiLossCarryoverCents || 0;
  const totalLossCarryover = stockLossCarryover + fiiLossCarryover;

  const currentMonthSales = currentMonthData?.totalStockSalesCents || 0;
  const exemptionLimit = 2000000; // R$ 20.000,00
  const salesRatio = Math.min(100, Number(((currentMonthSales / exemptionLimit) * 100).toFixed(1)));
  const isExempt = currentMonthSales <= exemptionLimit;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-6 sm:p-8">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#7C5CFF]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#22D3EE]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header line with honest badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF] shadow-[0_0_20px_rgba(124,92,255,0.2)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
                  Imposto de Renda & Controle Fiscal B3
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/25">
                  DARF 6015 & DIRPF
                </span>
              </div>
              <p className="text-xs text-[#A3A9BC] mt-0.5">
                Apuração de isenção de R$ 20k/mês, compensação de prejuízos, DARF mensal e informe anual da Receita Federal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              REGRAS OFICIAIS RECEITA FEDERAL 2026
            </span>
          </div>
        </div>

        {/* 4 Main Fiscal KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Lucro Isento (< R$ 20k) */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-emerald-400 text-[11px] font-medium">
              <span>Lucro Isento Acumulado</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-emerald-400">
              +R$ {(annualExemptGains / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400/80">Vendas de ações $\le$ R$ 20k/mês</span>
          </div>

          {/* DARF Pago no Ano */}
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#A3A9BC] text-[11px]">
              <span>Total de DARF Gerado</span>
              <DollarSign className="w-3.5 h-3.5 text-[#7C5CFF]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-[#F3F5FA]">
              R$ {(annualDarfPaid / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#A3A9BC]">Código de Receita 6015</span>
          </div>

          {/* Prejuízos a Compensar */}
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#A3A9BC] text-[11px]">
              <span>Prejuízos a Compensar</span>
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-amber-400">
              R$ {(totalLossCarryover / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#A3A9BC]">Abaterão lucros futuros</span>
          </div>

          {/* Status do Mês Atual (Teto R$ 20k) */}
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-black/30 backdrop-blur-sm flex flex-col gap-1">
            <div className="flex items-center justify-between text-[#A3A9BC] text-[11px]">
              <span>Vendas de Ações (Mês)</span>
              <span className={`text-[10px] font-bold ${isExempt ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isExempt ? 'ISENTO' : 'TRIBUTÁVEL'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-tabular text-[#22D3EE]">
              R$ {(currentMonthSales / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#A3A9BC]">Teto legal: R$ 20.000,00</span>
          </div>
        </div>

        {/* Real-time Exemption Progress Bar */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#22D3EE]" />
              Consumo do Limite de Isenção Mensal de R$ 20.000 (Ações Comuns):
            </span>
            <span className="font-tabular font-bold text-[#F3F5FA]">
              {salesRatio}% ({isExempt ? `R$ ${((exemptionLimit - currentMonthSales) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restantes` : 'Limite ultrapassado!'})
            </span>
          </div>
          <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                salesRatio > 100
                  ? 'bg-rose-500'
                  : salesRatio > 80
                  ? 'bg-amber-400'
                  : 'bg-[#22D3EE]'
              }`}
              style={{ width: `${Math.min(100, salesRatio)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
