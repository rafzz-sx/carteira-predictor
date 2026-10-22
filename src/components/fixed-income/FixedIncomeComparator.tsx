'use client';
import React, { useState, useMemo } from 'react';
import { FixedIncomeService, InvestmentComparisonItem } from '@/domain/finance/fixed-income';
import { Scale, Sparkles } from 'lucide-react';

interface FixedIncomeComparatorProps {
  initialComparison?: InvestmentComparisonItem[];
}

export function FixedIncomeComparator({ initialComparison }: FixedIncomeComparatorProps) {
  const [amountInput, setAmountInput] = useState<number>(10000);
  const [termMonths, setTermMonths] = useState<number>(24);

  // Recalculate comparison live
  const items = useMemo(() => {
    if (initialComparison && amountInput === 10000 && termMonths === 24) {
      return initialComparison;
    }
    return FixedIncomeService.compareInstruments({
      amountCents: amountInput * 100,
      termMonths,
      currentCdiPercent: 10.65,
      currentIpcaPercent: 4.42,
    });
  }, [amountInput, termMonths, initialComparison]);

  const maxNetProfit = Math.max(...items.map((i) => i.netProfitCents), 1);
  const termDays = Math.round(termMonths * 30.416);
  const currentTaxRate = FixedIncomeService.getRegressiveTaxRate(termDays);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Comparador de Rentabilidade Líquida
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Líquido de IR
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Compare Tesouro Direto vs CDB vs LCI/LCA Isenta vs Debênture com a Tabela Regressiva da Receita Federal
            </p>
          </div>
        </div>

        {/* Quick Term Selector Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[6, 12, 24, 36, 60].map((m) => (
            <button
              key={m}
              onClick={() => setTermMonths(m)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                termMonths === m
                  ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                  : 'bg-white/[0.05] text-[#A3A9BC] hover:bg-white/[0.1] border border-white/[0.08]'
              }`}
            >
              {m < 12 ? `${m} meses` : `${m / 12} ${m / 12 === 1 ? 'ano' : 'anos'}`}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-white/[0.06] bg-black/20">
        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Valor a Simular (R$)
          </label>
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(Math.max(100, Number(e.target.value)))}
            step={1000}
            min={100}
            className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-tabular text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Prazo de Aplicação
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={termMonths}
              onChange={(e) => setTermMonths(Math.max(1, Number(e.target.value)))}
              min={1}
              max={120}
              className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-tabular text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
            />
            <span className="text-xs text-[#A3A9BC] shrink-0">meses ({termDays} dias)</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Alíquota de IRPF Vigente
          </label>
          <div className="flex items-center justify-between px-3 py-2 bg-[#141620] border border-white/[0.1] rounded-xl text-xs font-tabular">
            <span className="text-[#F3F5FA] font-bold">{currentTaxRate.toFixed(1)}%</span>
            <span className="text-[10px] text-[#A3A9BC]">
              {termDays <= 180
                ? 'Até 180 dias (22,5%)'
                : termDays <= 360
                ? '181 a 360 dias (20,0%)'
                : termDays <= 720
                ? '361 a 720 dias (17,5%)'
                : 'Acima de 720 dias (15,0%)'}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Items Ranking */}
      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const isTop = index === 0;
          const ratio = (item.netProfitCents / maxNetProfit) * 100;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                isTop
                  ? 'border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.06)]'
                  : 'border-white/[0.06] bg-black/20 hover:border-white/[0.1]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Title & Issuer */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                      isTop
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/[0.08] text-[#A3A9BC]'
                    }`}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#F3F5FA]">{item.title}</h4>
                      {item.isTaxExempt && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Isento de IR
                        </span>
                      )}
                      {item.hasFgc && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
                          FGC
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-[#A3A9BC]">
                        {item.badge}
                      </span>
                    </div>
                    <span className="text-xs text-[#A3A9BC] mt-0.5 block">
                      {item.issuerOrCategory}
                    </span>
                  </div>
                </div>

                {/* Right: Net Returns & Gross-up */}
                <div className="flex items-end md:items-center gap-6 justify-between md:justify-end">
                  {/* Gross-up equivalence */}
                  {item.isTaxExempt && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-[#A3A9BC] block">Equivalente em CDB</span>
                      <span className="text-xs font-bold font-tabular text-[#22D3EE]">
                        {item.equivalentGrossPercent.toFixed(1)}% do CDI
                      </span>
                    </div>
                  )}

                  {/* IR tax */}
                  <div className="text-right">
                    <span className="text-[10px] text-[#A3A9BC] block">IR retido</span>
                    <span className="text-xs font-tabular text-[#A3A9BC]">
                      {item.isTaxExempt
                        ? 'R$ 0,00 (0%)'
                        : `R$ ${(item.taxAmountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${item.taxRatePercent}%)`}
                    </span>
                  </div>

                  {/* Net Profit & Total */}
                  <div className="text-right min-w-[130px]">
                    <span className="text-[10px] text-[#A3A9BC] block">Rendimento Líquido</span>
                    <div className="text-base font-bold font-tabular text-emerald-400">
                      +R$ {(item.netProfitCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] font-tabular text-[#F3F5FA] font-medium">
                      Total: R$ {(item.netAmountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Performance Bar */}
              <div className="mt-3 w-full bg-white/[0.05] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTop ? 'bg-emerald-400' : 'bg-[#7C5CFF]/70'
                  }`}
                  style={{ width: `${Math.max(5, ratio)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gross-Up explanation card */}
      <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex items-start gap-3 text-xs text-[#A3A9BC]">
        <Sparkles className="w-4 h-4 shrink-0 text-[#7C5CFF] mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#F3F5FA] font-semibold">Como funciona a Equivalência Tributária (Gross-up)?</strong>
          <p className="mt-0.5">
            Títulos isentos de IR (como LCI, LCA e Debêntures Incentivadas) entregam 100% do rendimento líquido na sua conta. Para um prazo de {termMonths} meses (alíquota de {currentTaxRate}% de IR), uma LCI a 92% do CDI rende na verdade o mesmo que um CDB pagando{' '}
            <strong className="text-[#22D3EE] font-tabular font-bold">
              {FixedIncomeService.calculateEquivalentGrossRate(92, termDays).toFixed(1)}% do CDI
            </strong>
            !
          </p>
        </div>
      </div>
    </div>
  );
}
