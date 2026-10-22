'use client';

import React, { useState } from 'react';
import { Shield, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { MethodologyDomain } from '@/domain/finance/methodology';
import { formatCurrency } from '@/lib/formatters';

export function FixedIncomeMathExplainer() {
  // MtM simulator states
  const [duration, setDuration] = useState<number>(5.2);
  const [rateShockBps, setRateShockBps] = useState<number>(-150); // -1.50%
  const basePriceCents = 100000; // R$ 1.000,00 base
  const convexity = 35.0;

  // Gross-up states
  const [exemptRate, setExemptRate] = useState<number>(10.5);
  const [holdingDays, setHoldingDays] = useState<number>(750); // > 720d (15%)

  const mtmResult = MethodologyDomain.calculateMtMSensitivity(
    basePriceCents,
    duration,
    convexity,
    rateShockBps
  );

  const grossUpResult = MethodologyDomain.calculateTaxEquivalence(exemptRate, holdingDays);

  return (
    <div className="space-y-6">
      {/* MtM Formulation Card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#19D98B] mb-1">
              <Shield className="w-4 h-4" />
              Precificação no Mercado Secundário
            </div>
            <h2 className="text-xl font-bold text-[#F3F5FA]">
              Marcação a Mercado (MtM): Duration Modificada & Convexidade
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#19D98B]/10 border border-[#19D98B]/20 text-[#19D98B]">
            Sensibilidade de Taxa
          </span>
        </div>

        {/* Formula */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-center my-4 overflow-x-auto">
          <div className="text-sm sm:text-base font-mono text-[#F3F5FA] inline-block tracking-wide">
            <span className="text-[#22D3EE]">\Delta P / P</span> &approx;&nbsp;
            <span className="text-[#FF5C5C]">-D<sub>mod</sub> &times; \Delta y</span>
            &nbsp;+&nbsp;
            <span className="text-[#19D98B]">&frac12; &times; C &times; (\Delta y)&sup2;</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#A3A9BC]">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="font-semibold text-[#FF5C5C] block">Componente Linear (Duration):</span>
            A relação é <strong>inversamente proporcional</strong>: quando a taxa cai no mercado, o preço unitário (PU) do título sobe. Quando a taxa sobe, o PU cai.
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="font-semibold text-[#19D98B] block">Convexidade (Curvatura Favorável):</span>
            O termo quadrático é <strong>sempre positivo</strong>. O título valoriza mais na queda das taxas do que desvaloriza em uma alta simétrica de juros.
          </div>
        </div>
      </div>

      {/* Interactive MtM Sensitivity Lab */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-[#F3F5FA] mb-1">Simulador Didático de Choque de Juros (MtM)</h3>
        <p className="text-xs text-[#A3A9BC] mb-6">
          Ajuste a Duration e o choque de juros na Curva DI para ver a decomposição entre Duration e Convexidade.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#A3A9BC]">Duration Modificada:</span>
                <span className="font-mono font-semibold text-[#F3F5FA]">{duration.toFixed(1)} anos</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="0.1"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full accent-[#7C5CFF]"
              />
              <div className="flex justify-between text-[10px] text-[#70778C]">
                <span>1 ano (Curto)</span>
                <span>6 anos (Médio)</span>
                <span>12 anos (Tesouro IPCA+ Longo)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#A3A9BC]">Choque de Taxa no DI (Δy):</span>
                <span className={`font-mono font-bold ${rateShockBps < 0 ? 'text-[#19D98B]' : 'text-[#FF5C5C]'}`}>
                  {rateShockBps > 0 ? '+' : ''}{(rateShockBps / 100).toFixed(2)}% ({rateShockBps > 0 ? '+' : ''}{rateShockBps} bps)
                </span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="25"
                value={rateShockBps}
                onChange={(e) => setRateShockBps(parseInt(e.target.value))}
                className="w-full accent-[#22D3EE]"
              />
              <div className="flex justify-between text-[10px] text-[#70778C]">
                <span>-3,00% (Corte agressivo)</span>
                <span>0 bps</span>
                <span>+3,00% (Choque de alta)</span>
              </div>
            </div>
          </div>

          {/* Results decomposition */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs text-[#A3A9BC]">Variação Total do PU:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-sm">
                {mtmResult.isAgio ? (
                  <span className="text-[#19D98B] flex items-center gap-0.5">
                    <ArrowUpRight className="w-4 h-4" />
                    +{mtmResult.priceDeltaPercent}% (Ágio)
                  </span>
                ) : (
                  <span className="text-[#FF5C5C] flex items-center gap-0.5">
                    <ArrowDownRight className="w-4 h-4" />
                    {mtmResult.priceDeltaPercent}% (Deságio)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 py-3 text-xs font-mono">
              <div className="flex justify-between text-[#A3A9BC]">
                <span>Componente Duration:</span>
                <span className={mtmResult.durationComponentPercent >= 0 ? 'text-[#19D98B]' : 'text-[#FF5C5C]'}>
                  {mtmResult.durationComponentPercent >= 0 ? '+' : ''}{mtmResult.durationComponentPercent}%
                </span>
              </div>
              <div className="flex justify-between text-[#A3A9BC]">
                <span>Componente Convexidade (+):</span>
                <span className="text-[#19D98B]">+{mtmResult.convexityComponentPercent}%</span>
              </div>
              <div className="flex justify-between text-[#F3F5FA] font-bold pt-2 border-t border-white/[0.06]">
                <span>Novo PU Estimado:</span>
                <span className="text-[#22D3EE]">{formatCurrency(mtmResult.simulatedPriceCents)}</span>
              </div>
            </div>

            <div className="text-[11px] text-[#70778C] pt-2 border-t border-white/[0.06]">
              Preço de compra base: R$ 1.000,00. Convexidade modelada: 35,0 anos².
            </div>
          </div>
        </div>

        {/* Golden rule callout */}
        <div className="p-3.5 rounded-xl bg-[#19D98B]/10 border border-[#19D98B]/20 flex items-start gap-2.5 text-xs text-[#A3A9BC]">
          <CheckCircle2 className="w-4 h-4 text-[#19D98B] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#F3F5FA]">Garantia Pétrea no Vencimento do Título:</strong> As oscilações
            de Marcação a Mercado refletem apenas o preço de saída antecipada no mercado secundário. Se o investidor
            carregar o título público até o vencimento contratado, receberá <strong>100% da taxa pactuada</strong>,
            independente da volatilidade temporária.
          </div>
        </div>
      </div>

      {/* Gross-up Equivalence Card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-lg font-bold text-[#F3F5FA]">Equivalência Tributária (Gross-up)</h3>
            <p className="text-xs text-[#A3A9BC]">
              Compare instrumentos isentos (LCI, LCA, CRI, CRA, Debêntures Incentivadas) com CDBs tributados.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30">
            Fórmula Anbima
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-[11px] text-[#70778C] block mb-1">Taxa Isenta (% a.a.)</label>
            <input
              type="number"
              step="0.1"
              value={exemptRate}
              onChange={(e) => setExemptRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] text-[#70778C] block mb-1">Prazo do Investimento</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Até 180d (22,5%)', days: 120 },
                { label: '181-360d (20,0%)', days: 250 },
                { label: '361-720d (17,5%)', days: 450 },
                { label: '> 720d (15,0%)', days: 750 },
              ].map((bracket) => (
                <button
                  key={bracket.days}
                  onClick={() => setHoldingDays(bracket.days)}
                  className={`p-2 rounded-lg text-[11px] font-medium transition-all ${
                    holdingDays === bracket.days
                      ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.3)]'
                      : 'bg-white/[0.04] text-[#A3A9BC] hover:text-[#F3F5FA]'
                  }`}
                >
                  {bracket.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#A3A9BC] block">
              Uma LCI/LCA isenta rendendo <strong>{exemptRate}% a.a.</strong> equivale a um CDB de:
            </span>
            <div className="text-2xl font-bold font-mono text-[#19D98B] mt-1">
              {grossUpResult.grossRateEquivalentPercent}% a.a. Bruto
            </div>
          </div>

          <div className="text-right text-xs font-mono">
            <span className="text-[#70778C] block text-[10px]">Alíquota de IR Poupada</span>
            <span className="text-[#F5B83D] font-bold text-sm">{grossUpResult.irRatePercent}%</span>
            <span className="text-[#70778C] block text-[10px] mt-1">Vantagem Tributária Bruta</span>
            <span className="text-[#22D3EE] font-semibold">+{grossUpResult.taxDifferencePercent}% a.a.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
