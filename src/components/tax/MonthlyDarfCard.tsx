// src/components/tax/MonthlyDarfCard.tsx
'use client';

import React, { useState } from 'react';
import { MonthlyTaxBreakdown } from '@/domain/finance/tax-calculator';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileCheck,
} from 'lucide-react';

interface MonthlyDarfCardProps {
  monthlyBreakdowns: MonthlyTaxBreakdown[];
  initialMonthIndex?: number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function MonthlyDarfCard({
  monthlyBreakdowns,
  initialMonthIndex = 10,
}: MonthlyDarfCardProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(initialMonthIndex);
  const [copiedDarf, setCopiedDarf] = useState<boolean>(false);

  const currentMonth =
    monthlyBreakdowns.find((m) => m.monthIndex === selectedMonthIndex) ||
    monthlyBreakdowns[monthlyBreakdowns.length - 1] ||
    monthlyBreakdowns[0];

  if (!currentMonth) return null;

  const monthName = MONTH_NAMES[currentMonth.monthIndex - 1];
  const hasDarf = currentMonth.payableDarfCents > 0;
  const isAccumulatedUnder10 = currentMonth.totalNetTaxDueCents > 0 && currentMonth.payableDarfCents === 0;

  // Fake standard barcode line for the DARF
  const darfBarcode = `85890000000-${Math.round(currentMonth.payableDarfCents / 100)} 06015202610-4 00000000000-0 00000000000-0`;

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(darfBarcode);
    setCopiedDarf(true);
    setTimeout(() => setCopiedDarf(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 flex items-center justify-center text-[#7C5CFF]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Apuração Mensal & Extrato de DARF
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20">
                Código 6015
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Selecione o mês para verificar volume de vendas, lucros tributáveis, deduções e guia para pagamento
            </p>
          </div>
        </div>
      </div>

      {/* Month Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {monthlyBreakdowns.map((m) => {
          const isSelected = m.monthIndex === selectedMonthIndex;
          const hasMonthDarf = m.payableDarfCents > 0;
          const hasTrades = m.tradesCount > 0;

          return (
            <button
              key={m.month}
              onClick={() => setSelectedMonthIndex(m.monthIndex)}
              className={`relative px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#7C5CFF] text-white shadow-[0_0_15px_rgba(124,92,255,0.35)]'
                  : 'bg-white/[0.04] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              <span>{MONTH_NAMES[m.monthIndex - 1].slice(0, 3)}</span>
              {hasMonthDarf && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
              {!hasMonthDarf && hasTrades && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly Operations Audit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Stock Sales & Exemption */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#A3A9BC] mb-1">
              <span>Vendas de Ações no Mês</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  currentMonth.isStockSalesExempt
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {currentMonth.isStockSalesExempt ? 'ISENTO (≤ R$ 20k)' : 'TRIBUTÁVEL (> R$ 20k)'}
              </span>
            </div>
            <div className="text-xl font-bold font-tabular text-[#F3F5FA]">
              R$ {(currentMonth.totalStockSalesCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#A3A9BC] mt-0.5 block">
              Teto da Receita Federal: R$ 20.000,00
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs">
            <div className="flex justify-between text-[11px] text-[#A3A9BC]">
              <span>Lucro Isento de Ações:</span>
              <span className="font-tabular font-bold text-emerald-400">
                +R$ {(currentMonth.stockExemptGainCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#A3A9BC] mt-1">
              <span>Lucro Tributável de Ações:</span>
              <span className="font-tabular font-bold text-[#F3F5FA]">
                R$ {(currentMonth.stockTaxableGainCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: FIIs and Compensation */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#A3A9BC] mb-1">
              <span>Fundos Imobiliários (FII)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30">
                Alíquota 20%
              </span>
            </div>
            <div className="text-xl font-bold font-tabular text-[#F3F5FA]">
              {currentMonth.fiiRealizedGainCents >= 0 ? '+' : ''}
              R$ {(currentMonth.fiiRealizedGainCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#A3A9BC] mt-0.5 block">
              FIIs NÃO possuem isenção de vendas
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs">
            <div className="flex justify-between text-[11px] text-[#A3A9BC]">
              <span>Prejuízo Compensado (Ações):</span>
              <span className="font-tabular text-amber-400">
                -R$ {(currentMonth.stockLossOffsetCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#A3A9BC] mt-1">
              <span>IRRF Retido (&quot;Dedo-duro&quot;):</span>
              <span className="font-tabular text-[#22D3EE]">
                -R$ {(currentMonth.withholdingTaxCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Column 3: Loss Carryover Status */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-[#A3A9BC] mb-1">
              <span>Prejuízos Restantes para o Futuro</span>
              <span className="text-[10px] text-[#A3A9BC]">Fim de {monthName}</span>
            </div>
            <div className="text-xl font-bold font-tabular text-amber-400">
              R$ {((currentMonth.stockLossCarryoverCents + currentMonth.fiiLossCarryoverCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-[#A3A9BC] mt-0.5 block">
              Segregação por classe da Receita
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs">
            <div className="flex justify-between text-[11px] text-[#A3A9BC]">
              <span>Prejuízo Ações / ETFs:</span>
              <span className="font-tabular text-[#F3F5FA]">
                R$ {(currentMonth.stockLossCarryoverCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-[#A3A9BC] mt-1">
              <span>Prejuízo FIIs / FIAGRO:</span>
              <span className="font-tabular text-[#F3F5FA]">
                R$ {(currentMonth.fiiLossCarryoverCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Official DARF Card / Status Notice */}
      {hasDarf ? (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-transparent relative overflow-hidden flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  DARF DEVIDO • CÓDIGO 6015
                </span>
                <h3 className="text-lg font-bold text-[#F3F5FA]">
                  Guia de Recolhimento de {monthName} / {currentMonth.year}
                </h3>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-[#A3A9BC] block">Vencimento Legal</span>
              <span className="text-sm font-bold font-tabular text-[#F3F5FA]">
                {currentMonth.darfDueDate} (Último dia útil)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-black/40 border border-white/[0.08]">
            <div>
              <span className="text-[10px] text-[#A3A9BC] block">Código da Receita</span>
              <span className="text-sm font-bold font-tabular text-[#F3F5FA]">6015</span>
            </div>
            <div>
              <span className="text-[10px] text-[#A3A9BC] block">Período de Apuração</span>
              <span className="text-sm font-bold font-tabular text-[#F3F5FA]">{currentMonth.month}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#A3A9BC] block">Imposto Bruto</span>
              <span className="text-sm font-bold font-tabular text-[#A3A9BC]">
                R$ {(currentMonth.totalGrossTaxDueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-300 font-medium block">Valor do Principal</span>
              <span className="text-lg font-bold font-tabular text-amber-400">
                R$ {(currentMonth.payableDarfCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Barcode line to pay */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-black/60 border border-white/[0.06]">
            <div className="flex items-center gap-2 overflow-hidden w-full sm:w-auto">
              <span className="text-xs text-[#A3A9BC] shrink-0 font-medium">Linha Digitável:</span>
              <code className="text-xs font-mono text-[#F3F5FA] truncate">
                {darfBarcode}
              </code>
            </div>

            <button
              onClick={handleCopyBarcode}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors shrink-0"
            >
              {copiedDarf ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedDarf ? 'Copiado!' : 'Copiar para Pagar no Banco'}</span>
            </button>
          </div>
        </div>
      ) : isAccumulatedUnder10 ? (
        <div className="p-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-[#F3F5FA] font-semibold mb-1">
              Imposto Apurado Inferior ao Limite Mínimo de R$ 10,00 da Receita Federal
            </strong>
            O imposto apurado neste mês foi de{' '}
            <strong className="font-tabular">
              R$ {(currentMonth.totalNetTaxDueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
            . Conforme a legislação tributária brasileira (art. 67 da Lei 9.430/1996), é vedada a emissão de DARF em valor inferior a R$ 10,00. Esse valor não vence agora e foi acumulado automaticamente para os meses subsequentes até que a soma atinja ou ultrapasse R$ 10,00.
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] flex items-start gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-[#F3F5FA] font-semibold mb-1">
              Mês 100% Isento — Nenhuma Guia DARF a Pagar em {monthName}
            </strong>
            {currentMonth.totalStockSalesCents > 0 ? (
              <span>
                Suas vendas de ações totalizaram R${' '}
                {(currentMonth.totalStockSalesCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, respeitando o teto de R$ 20.000,00. Os ganhos realizados estão protegidos pela isenção legal e deverão ser informados na ficha de Rendimentos Isentos da Declaração Anual.
              </span>
            ) : (
              <span>
                Não houve alienação de ativos tributáveis neste mês. Toda a sua custódia permanece com imposto diferido até a realização.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
