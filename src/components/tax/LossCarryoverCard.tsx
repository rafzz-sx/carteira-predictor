// src/components/tax/LossCarryoverCard.tsx
'use client';

import React from 'react';
import { TrendingDown, ShieldCheck, Info } from 'lucide-react';

interface LossCarryoverCardProps {
  stockLossCents?: number;
  fiiLossCents?: number;
  dayTradeLossCents?: number;
}

export function LossCarryoverCard({
  stockLossCents = 0,
  fiiLossCents = 0,
  dayTradeLossCents = 0,
}: LossCarryoverCardProps) {
  const totalLoss = stockLossCents + fiiLossCents + dayTradeLossCents;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Controle de Prejuízos Acumulados a Compensar
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Segregação RFB
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Prejuízos não prescrevem e podem abater 100% dos lucros futuros dentro da mesma classe de ativo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/30 border border-white/[0.06] px-3.5 py-1.5 rounded-xl">
          <span className="text-[11px] text-[#A3A9BC]">Total a Compensar:</span>
          <span className="text-sm font-bold font-tabular text-amber-400">
            R$ {(totalLoss / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 3 Segregated Asset Classes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class 1: Ações Comuns & ETFs */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#F3F5FA] font-bold">Ações & ETFs (Operações Comuns)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/[0.06] text-[#A3A9BC]">
                15% IR
              </span>
            </div>
            <div className="text-2xl font-bold font-tabular text-[#F3F5FA]">
              R$ {(stockLossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#A3A9BC] mt-1.5">
              Abate lucros futuros de vendas de ações acima de R$ 20k e de ETFs nacionais (BOVA11, SMAL11).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Compensação automática ativa</span>
          </div>
        </div>

        {/* Class 2: FIIs & FIAGRO */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#F3F5FA] font-bold">Fundos Imobiliários & FIAGRO</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30">
                20% IR
              </span>
            </div>
            <div className="text-2xl font-bold font-tabular text-[#F3F5FA]">
              R$ {(fiiLossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#A3A9BC] mt-1.5">
              Abate lucros futuros exclusivamente de alienação de cotas de FIIs e FIAGRO.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Compensação automática ativa</span>
          </div>
        </div>

        {/* Class 3: Day Trade */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#F3F5FA] font-bold">Operações de Day Trade</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                20% IR
              </span>
            </div>
            <div className="text-2xl font-bold font-tabular text-[#F3F5FA]">
              R$ {(dayTradeLossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-[#A3A9BC] mt-1.5">
              Prejuízos de operações iniciadas e encerradas no mesmo dia só abatem ganhos de Day Trade.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 text-[11px] text-[#A3A9BC]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Sem operações intraday</span>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="p-4 rounded-xl border border-white/[0.06] bg-black/30 flex items-start gap-3 text-xs text-[#A3A9BC]">
        <Info className="w-4 h-4 shrink-0 text-[#22D3EE] mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#F3F5FA] font-semibold">Regra de Ouro da Receita Federal:</strong>
          <p className="mt-0.5">
            Para manter o direito de compensar prejuízos acumulados nos anos seguintes, você <strong>DEVE</strong> informá-los no quadro de Renda Variável da Declaração Anual de Ajuste (DIRPF) do ano correspondente, preenchendo o saldo negativo no mês de Dezembro. Prejuízos de FII não podem abater lucro de Ações e vice-versa.
          </p>
        </div>
      </div>
    </div>
  );
}
