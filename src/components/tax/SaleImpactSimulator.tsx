// src/components/tax/SaleImpactSimulator.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { TaxCalculator, AssetTaxCategory } from '@/domain/finance/tax-calculator';
import { Calculator, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

interface SaleImpactSimulatorProps {
  currentMonthSalesCents?: number;
  accumulatedLossCents?: number;
}

const PRESET_ASSETS = [
  { ticker: 'PETR4', assetType: 'stock' as AssetTaxCategory, name: 'Petrobras PN', defaultPrice: 38.42, defaultCost: 34.50 },
  { ticker: 'VALE3', assetType: 'stock' as AssetTaxCategory, name: 'Vale ON', defaultPrice: 62.80, defaultCost: 65.20 },
  { ticker: 'ITUB4', assetType: 'stock' as AssetTaxCategory, name: 'Itaú Unibanco PN', defaultPrice: 35.90, defaultCost: 32.10 },
  { ticker: 'WEGE3', assetType: 'stock' as AssetTaxCategory, name: 'WEG ON', defaultPrice: 52.10, defaultCost: 48.50 },
  { ticker: 'HGLG11', assetType: 'fii' as AssetTaxCategory, name: 'CSHG Logística FII', defaultPrice: 164.50, defaultCost: 158.20 },
  { ticker: 'KNCR11', assetType: 'fii' as AssetTaxCategory, name: 'Kinea Rendimentos FII', defaultPrice: 103.20, defaultCost: 101.40 },
  { ticker: 'JURO11', assetType: 'fiinfra' as AssetTaxCategory, name: 'Sparta Infra FI-Infra', defaultPrice: 101.50, defaultCost: 100.20 },
];

export function SaleImpactSimulator({
  currentMonthSalesCents = 382000, // R$ 3.820,00 already sold this month
  accumulatedLossCents = 0,
}: SaleImpactSimulatorProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('PETR4');
  const [quantity, setQuantity] = useState<number>(300);

  const asset = useMemo(() => {
    return PRESET_ASSETS.find((a) => a.ticker === selectedTicker) || PRESET_ASSETS[0];
  }, [selectedTicker]);

  const [unitPrice, setUnitPrice] = useState<number>(asset.defaultPrice);
  const [averageCost, setAverageCost] = useState<number>(asset.defaultCost);

  const handleSelectAsset = (ticker: string) => {
    const found = PRESET_ASSETS.find((a) => a.ticker === ticker);
    if (found) {
      setSelectedTicker(found.ticker);
      setUnitPrice(found.defaultPrice);
      setAverageCost(found.defaultCost);
    }
  };

  // Recalculate simulation live
  const simulation = useMemo(() => {
    return TaxCalculator.simulateSaleTaxImpact({
      ticker: asset.ticker,
      assetType: asset.assetType,
      quantityToSell: quantity,
      estimatedUnitPriceCents: Math.round(unitPrice * 100),
      averageCostCents: Math.round(averageCost * 100),
      monthCurrentSalesCents: currentMonthSalesCents,
      accumulatedLossCents,
    });
  }, [asset, quantity, unitPrice, averageCost, currentMonthSalesCents, accumulatedLossCents]);

  const isExempt = simulation.isExempt;
  const isLoss = simulation.realizedGainLossCents < 0;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Simulador Preventivo de Venda & Teto de R$ 20.000
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                Evite DARF Desnecessário
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Simule o impacto de alienação antes de executar a ordem na corretora e evite estourar a faixa de isenção
            </p>
          </div>
        </div>
      </div>

      {/* Preset Asset Selector Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
        {PRESET_ASSETS.map((a) => {
          const isSelected = a.ticker === selectedTicker;
          return (
            <button
              key={a.ticker}
              onClick={() => handleSelectAsset(a.ticker)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#22D3EE] text-black font-bold shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                  : 'bg-white/[0.04] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              {a.ticker} ({a.assetType.toUpperCase()})
            </button>
          );
        })}
      </div>

      {/* Inputs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-white/[0.06] bg-black/20">
        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Quantidade a Vender
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            min={1}
            step={10}
            className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-tabular text-[#F3F5FA] focus:outline-none focus:border-[#22D3EE]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Preço Estimado de Venda (R$)
          </label>
          <input
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Math.max(0.01, Number(e.target.value)))}
            step={0.10}
            className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-tabular text-[#F3F5FA] focus:outline-none focus:border-[#22D3EE]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-[#A3A9BC] mb-1.5">
            Preço Médio de Aquisição (R$)
          </label>
          <input
            type="number"
            value={averageCost}
            onChange={(e) => setAverageCost(Math.max(0.01, Number(e.target.value)))}
            step={0.10}
            className="w-full bg-[#141620] border border-white/[0.1] rounded-xl px-3 py-2 text-xs font-tabular text-[#F3F5FA] focus:outline-none focus:border-[#22D3EE]"
          />
        </div>
      </div>

      {/* Simulation Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total da Venda */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col gap-1">
          <span className="text-[11px] text-[#A3A9BC]">Volume Financeiro da Venda</span>
          <div className="text-xl font-bold font-tabular text-[#F3F5FA]">
            R$ {(simulation.saleTotalCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">
            Vendas acumuladas no mês: R$ {(simulation.projectedMonthlySalesCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Lucro / Prejuízo Realizado */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col gap-1">
          <span className="text-[11px] text-[#A3A9BC]">Ganho de Capital Realizado</span>
          <div
            className={`text-xl font-bold font-tabular ${
              isLoss ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isLoss ? '' : '+'}
            R$ {(simulation.realizedGainLossCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">
            {isLoss ? 'Prejuízo a compensar' : 'Lucro bruto apurado'}
          </span>
        </div>

        {/* Imposto / DARF Estimado */}
        <div
          className={`p-4 rounded-xl border flex flex-col gap-1 ${
            simulation.taxDueCents > 0
              ? 'border-amber-500/30 bg-amber-500/[0.05]'
              : 'border-emerald-500/25 bg-emerald-500/[0.03]'
          }`}
        >
          <span className="text-[11px] text-[#A3A9BC]">DARF Estimado a Pagar</span>
          <div
            className={`text-xl font-bold font-tabular ${
              simulation.taxDueCents > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {simulation.taxDueCents > 0
              ? `R$ ${(simulation.taxDueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : 'R$ 0,00 (ISENTO)'}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">
            {simulation.applicableTaxRatePercent > 0 ? `Alíquota ${simulation.applicableTaxRatePercent}%` : 'Sem tributação'}
          </span>
        </div>
      </div>

      {/* Advice Notice */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
          simulation.willExceedExemptionLimit
            ? 'border-amber-500/30 bg-amber-500/[0.05] text-amber-300'
            : isExempt
            ? 'border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300'
            : 'border-white/[0.08] bg-black/20 text-[#A3A9BC]'
        }`}
      >
        {simulation.willExceedExemptionLimit ? (
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
        ) : isExempt ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        ) : (
          <Sparkles className="w-5 h-5 shrink-0 text-[#22D3EE] mt-0.5" />
        )}
        <div className="leading-relaxed">
          <strong className="block text-[#F3F5FA] font-semibold mb-1">
            {simulation.willExceedExemptionLimit
              ? 'Aviso Fiscal: Venda Ultrapassará o Limite de Isenção!'
              : isExempt
              ? 'Excelente: Venda Totalmente Isenta de Imposto de Renda!'
              : 'Resultado da Simulação'}
          </strong>
          {simulation.adviceText}
        </div>
      </div>
    </div>
  );
}
