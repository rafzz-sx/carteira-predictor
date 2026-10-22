'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight, PlusCircle, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { MethodologyDomain, AveragePriceStepInput, AveragePriceStepResult } from '@/domain/finance/methodology';
import { PositionState } from '@/domain/finance/portfolio-math';
import { formatCurrency } from '@/lib/formatters';

const PRESET_SCENARIOS: Record<string, { title: string; initial: PositionState; steps: AveragePriceStepInput[] }> = {
  classic: {
    title: 'Clássico: Duas Compras + Venda Parcial',
    initial: { ticker: 'VALE3', quantity: 100, averagePriceCents: 3000, totalInvestedCents: 300000 },
    steps: [
      { type: 'buy', quantity: 100, unitPriceCents: 4000, feesCents: 500, date: '15/02/2026' },
      { type: 'sell', quantity: 50, unitPriceCents: 5000, feesCents: 200, date: '28/02/2026' },
    ],
  },
  split: {
    title: 'Desdobramento (Split B3 1:2)',
    initial: { ticker: 'WEGE3', quantity: 100, averagePriceCents: 4000, totalInvestedCents: 400000 },
    steps: [
      { type: 'split', quantity: 0, ratio: 2, date: '10/03/2026' },
      { type: 'buy', quantity: 50, unitPriceCents: 2200, feesCents: 150, date: '25/03/2026' },
    ],
  },
  reverse_split: {
    title: 'Grupamento (Inplit B3 10:1)',
    initial: { ticker: 'OIBR3', quantity: 1000, averagePriceCents: 80, totalInvestedCents: 80000 },
    steps: [
      { type: 'reverse_split', quantity: 0, ratio: 10, date: '05/04/2026' },
    ],
  },
};

export function AveragePriceLab() {
  const [selectedPreset, setSelectedPreset] = useState<string>('classic');
  const [initialQty, setInitialQty] = useState<number>(100);
  const [initialPriceReais, setInitialPriceReais] = useState<number>(30.00);
  const [steps, setSteps] = useState<AveragePriceStepInput[]>(PRESET_SCENARIOS.classic.steps);

  // New operation modal/form states
  const [newOpType, setNewOpType] = useState<'buy' | 'sell' | 'split'>('buy');
  const [newQty, setNewQty] = useState<number>(50);
  const [newPriceReais, setNewPriceReais] = useState<number>(35.00);
  const [newFeesReais, setNewFeesReais] = useState<number>(3.50);
  const [newRatio, setNewRatio] = useState<number>(2);

  const initialPosition: PositionState = {
    ticker: 'VALE3',
    quantity: initialQty,
    averagePriceCents: Math.round(initialPriceReais * 100),
    totalInvestedCents: Math.round(initialQty * initialPriceReais * 100),
  };

  const results: AveragePriceStepResult[] = MethodologyDomain.traceAveragePriceSteps(
    'VALE3',
    initialPosition,
    steps
  );

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const p = PRESET_SCENARIOS[presetKey];
    setInitialQty(p.initial.quantity);
    setInitialPriceReais(p.initial.averagePriceCents / 100);
    setSteps(p.steps);
  };

  const handleAddStep = () => {
    if (newOpType === 'buy' || newOpType === 'sell') {
      if (newQty <= 0 || newPriceReais <= 0) return;
      const newStep: AveragePriceStepInput = {
        type: newOpType,
        quantity: newQty,
        unitPriceCents: Math.round(newPriceReais * 100),
        feesCents: Math.round(newFeesReais * 100),
        date: new Date().toLocaleDateString('pt-BR'),
      };
      setSteps([...steps, newStep]);
    } else if (newOpType === 'split') {
      const newStep: AveragePriceStepInput = {
        type: 'split',
        quantity: 0,
        ratio: newRatio,
        date: new Date().toLocaleDateString('pt-BR'),
      };
      setSteps([...steps, newStep]);
    }
  };

  const handleReset = () => {
    handleApplyPreset('classic');
  };

  return (
    <div className="space-y-6">
      {/* Mathematical Formula Card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C5CFF] mb-1">
              <Calculator className="w-4 h-4" />
              Fórmula Oficial da Receita Federal
            </div>
            <h2 className="text-xl font-bold text-[#F3F5FA]">
              Instrução Normativa RFB nº 1.585/2015 (Arts. 56 a 60)
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#19D98B]/10 border border-[#19D98B]/20 text-[#19D98B]">
            Ponderação Exclusiva por Compras
          </span>
        </div>

        {/* Latex-style formula display */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-center my-4 overflow-x-auto">
          <div className="text-sm sm:text-base font-mono text-[#22D3EE] inline-block tracking-wide">
            PM<sub>novo</sub> = &nbsp;
            <span className="inline-flex flex-col items-center align-middle">
              <span className="border-b border-[#22D3EE]/60 px-2 pb-0.5">
                (Q<sub>antiga</sub> × PM<sub>antigo</sub>) + (Q<sub>compra</sub> × P<sub>compra</sub>) + Custos
              </span>
              <span className="pt-0.5">
                Q<sub>antiga</sub> + Q<sub>compra</sub>
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#A3A9BC] mt-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="font-semibold text-[#F3F5FA] block">Na Venda Parcial:</span>
            O Preço Médio unitário <strong>permanece estritamente inalterado</strong>. A venda consome apenas a quantidade em custódia.
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1">
            <span className="font-semibold text-[#F3F5FA] block">Taxas de Corretagem & B3:</span>
            Aumentam o custo de aquisição na compra (elevando o PM) e deduzem a receita na venda (reduzindo o ganho tributável).
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Lab */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#F3F5FA]">Laboratório Interativo de Preço Médio</h3>
            <p className="text-xs text-[#A3A9BC]">
              Simule transações sucessivas e acompanhe o recálculo do PM em centavos inteiros com a memória de cálculo da Receita.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(PRESET_SCENARIOS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => handleApplyPreset(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPreset === key
                    ? 'bg-[#7C5CFF] text-white shadow-[0_0_10px_rgba(124,92,255,0.3)]'
                    : 'bg-white/[0.04] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.08]'
                }`}
              >
                {item.title}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-white/[0.04] text-[#A3A9BC] hover:text-white"
              title="Restaurar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Initial Custody Bar */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#7C5CFF]/15 to-transparent border border-[#7C5CFF]/30 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center text-[#7C5CFF] font-bold text-sm">
              VALE3
            </div>
            <div>
              <div className="text-xs text-[#A3A9BC]">Posição Inicial de Custódia</div>
              <div className="text-sm font-semibold text-[#F3F5FA]">
                {initialQty} cotas @ {formatCurrency(initialPosition.averagePriceCents)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-[#70778C] block text-[10px]">Custo Inicial</span>
              <span className="text-[#F3F5FA] font-medium">{formatCurrency(initialPosition.totalInvestedCents)}</span>
            </div>
            <div>
              <span className="text-[#70778C] block text-[10px]">Preço Médio Inicial</span>
              <span className="text-[#22D3EE] font-bold">{formatCurrency(initialPosition.averagePriceCents)}</span>
            </div>
          </div>
        </div>

        {/* Timeline of Steps */}
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#70778C]">
            Trilha Cronológica de Operações & Memória de Cálculo
          </h4>

          {results.map((res) => {
            const isBuy = res.operation.type === 'buy';
            const isSell = res.operation.type === 'sell';
            const isSplit = res.operation.type === 'split';

            return (
              <div
                key={res.stepIndex}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-mono text-[#F3F5FA]">
                      {res.stepIndex}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        isBuy
                          ? 'bg-[#19D98B]/15 text-[#19D98B] border border-[#19D98B]/30'
                          : isSell
                          ? 'bg-[#F5B83D]/15 text-[#F5B83D] border border-[#F5B83D]/30'
                          : isSplit
                          ? 'bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30'
                          : 'bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/30'
                      }`}
                    >
                      {isBuy ? 'Compra' : isSell ? 'Venda Parcial' : isSplit ? 'Desdobramento (Split)' : 'Grupamento'}
                    </span>
                    <span className="text-xs text-[#70778C]">{res.operation.date}</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-[#A3A9BC]">
                      Custódia: <strong className="text-[#F3F5FA]">{res.newState.quantity} cotas</strong>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#70778C]" />
                    <span className="text-[#A3A9BC]">
                      Novo PM: <strong className="text-[#22D3EE]">{formatCurrency(res.newState.averagePriceCents)}</strong>
                    </span>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="text-xs text-[#A3A9BC] leading-relaxed bg-black/30 p-3 rounded-lg border border-white/[0.04]">
                  <p>{res.mathExplanation}</p>
                  <p className="text-[11px] font-mono text-[#7C5CFF] mt-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    Fórmula aplicada: {res.formulaDescription}
                  </p>
                </div>

                {/* Sell profit highlight */}
                {isSell && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#19D98B]/10 border border-[#19D98B]/20 text-xs">
                    <span className="text-[#A3A9BC]">Resultado Realizado da Venda:</span>
                    <span className="font-mono font-bold text-[#19D98B]">
                      {res.realizedGainLossCents >= 0 ? '+' : ''}{formatCurrency(res.realizedGainLossCents)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Operation Form */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <h4 className="text-xs font-semibold text-[#F3F5FA] flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#7C5CFF]" />
            Adicionar Transação de Demonstração
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-[#70778C] block mb-1">Tipo de Ordem</label>
              <select
                value={newOpType}
                onChange={(e) => setNewOpType(e.target.value as 'buy' | 'sell' | 'split')}
                className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
              >
                <option value="buy">Compra</option>
                <option value="sell">Venda Parcial</option>
                <option value="split">Desdobramento (Split)</option>
              </select>
            </div>

            {newOpType !== 'split' ? (
              <>
                <div>
                  <label className="text-[11px] text-[#70778C] block mb-1">Quantidade</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#70778C] block mb-1">Preço Executado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPriceReais}
                    onChange={(e) => setNewPriceReais(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#70778C] block mb-1">Taxas B3 / Corretagem (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newFeesReais}
                    onChange={(e) => setNewFeesReais(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-3">
                <label className="text-[11px] text-[#70778C] block mb-1">Razão do Desdobramento (1 para X)</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={newRatio}
                  onChange={(e) => setNewRatio(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F3F5FA] focus:outline-none focus:border-[#7C5CFF]"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleAddStep}
            className="w-full py-2 rounded-lg bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white font-medium text-xs tracking-wide transition-all shadow-[0_0_12px_rgba(124,92,255,0.3)] mt-2"
          >
            Executar e Recalcular Preço Médio
          </button>
        </div>
      </div>

      {/* Critical RFB Rules Warning Callout */}
      <div className="rounded-xl border border-[#F5B83D]/30 bg-[#F5B83D]/5 p-5 backdrop-blur-md flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#F5B83D] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1 text-[#A3A9BC]">
          <h4 className="font-bold text-[#F3F5FA]">
            A Regra de Ouro da DIRPF: NUNCA Declare Cotação de Mercado em 31/12!
          </h4>
          <p>
            Na Ficha <strong>Bens e Direitos</strong> da Declaração de Ajuste Anual do IRPF, o investidor deve
            informar estritamente o <strong>Custo Histórico de Aquisição</strong> (<code className="text-[#22D3EE] font-mono">Quantidade em 31/12 × Preço Médio</code>).
          </p>
          <p className="text-[11px] text-[#70778C]">
            Lançar o valor de mercado (cotação do último pregão) gera distorção patrimonial aparente e é a principal
            causa de retenção de investidores em <strong>malha fina</strong> por acréscimo patrimonial a descoberto.
          </p>
        </div>
      </div>
    </div>
  );
}
