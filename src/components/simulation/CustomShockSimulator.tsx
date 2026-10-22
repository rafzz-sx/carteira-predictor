// src/components/simulation/CustomShockSimulator.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/formatters';
import {
  PortfolioAssetInput,
  simulateCustomScenario,
  CustomShockParameters,
} from '@/domain/finance/scenario-simulator';

interface CustomShockSimulatorProps {
  positions: PortfolioAssetInput[];
  className?: string;
}

export function CustomShockSimulator({ positions, className = '' }: CustomShockSimulatorProps) {
  const [ibovShockPct, setIbovShockPct] = useState<number>(-10);
  const [ifixShockPct, setIfixShockPct] = useState<number>(-5);
  const [selicShockBps, setSelicShockBps] = useState<number>(200);
  const [ipcaShockPct, setIpcaShockPct] = useState<number>(1.5);

  const shocks: CustomShockParameters = useMemo(
    () => ({
      ibovShockPct,
      ifixShockPct,
      selicShockBps,
      ipcaShockPct,
    }),
    [ibovShockPct, ifixShockPct, selicShockBps, ipcaShockPct]
  );

  const simulation = useMemo(
    () => simulateCustomScenario(positions, shocks),
    [positions, shocks]
  );

  const isLoss = simulation.deltaAmountCents < 0;

  const handleReset = () => {
    setIbovShockPct(0);
    setIfixShockPct(0);
    setSelicShockBps(0);
    setIpcaShockPct(0);
  };

  return (
    <Card variant="glass" borderAccent="none" className={`p-5 sm:p-6 flex flex-col gap-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F3F5FA]">
                Simulador Customizado de Choques Macroeconômicos
              </h3>
              <Badge variant="neutral" size="sm">
                SENSIBILIDADE
              </Badge>
            </div>
            <p className="text-xs text-[#A3A9BC]">
              Ajuste as variáveis e teste a resistência da sua carteira a cenários hipotéticos
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.06] transition-colors self-start sm:self-auto flex items-center gap-1.5 text-xs cursor-pointer"
          title="Zerar choques"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Zerar</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Slider 1: Ibov */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Choque no Ibovespa:</span>
            <span
              className={`font-mono font-bold ${
                ibovShockPct >= 0 ? 'text-[#19D98B]' : 'text-[#FF4D6D]'
              }`}
            >
              {ibovShockPct > 0 ? `+${ibovShockPct}%` : `${ibovShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="30"
            step="1"
            value={ibovShockPct}
            onChange={(e) => setIbovShockPct(Number(e.target.value))}
            className="w-full accent-[#7C5CFF] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#70778C]">
            <span>-30%</span>
            <span>0%</span>
            <span>+30%</span>
          </div>
        </div>

        {/* Slider 2: IFIX */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Choque no IFIX:</span>
            <span
              className={`font-mono font-bold ${
                ifixShockPct >= 0 ? 'text-[#19D98B]' : 'text-[#FF4D6D]'
              }`}
            >
              {ifixShockPct > 0 ? `+${ifixShockPct}%` : `${ifixShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={ifixShockPct}
            onChange={(e) => setIfixShockPct(Number(e.target.value))}
            className="w-full accent-[#22D3EE] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#70778C]">
            <span>-20%</span>
            <span>0%</span>
            <span>+20%</span>
          </div>
        </div>

        {/* Slider 3: Selic Shock */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Choque na Selic (bps):</span>
            <span className="font-mono font-bold text-[#F3F5FA]">
              {selicShockBps > 0 ? `+${selicShockBps}` : `${selicShockBps}`} bps
            </span>
          </div>
          <input
            type="range"
            min="-400"
            max="600"
            step="25"
            value={selicShockBps}
            onChange={(e) => setSelicShockBps(Number(e.target.value))}
            className="w-full accent-[#F5B83D] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#70778C]">
            <span>-400 bps</span>
            <span>0 bps</span>
            <span>+600 bps</span>
          </div>
        </div>

        {/* Slider 4: IPCA Shock */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Desvio na Inflação IPCA:</span>
            <span className="font-mono font-bold text-[#F3F5FA]">
              {ipcaShockPct > 0 ? `+${ipcaShockPct}%` : `${ipcaShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-3"
            max="5"
            step="0.5"
            value={ipcaShockPct}
            onChange={(e) => setIpcaShockPct(Number(e.target.value))}
            className="w-full accent-[#7C5CFF] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#70778C]">
            <span>-3%</span>
            <span>0%</span>
            <span>+5%</span>
          </div>
        </div>
      </div>

      {/* Outcome Card */}
      <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#A3A9BC]">Resultado estimado para este choque combinado:</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span
              className={`text-2xl font-black font-tabular maskable ${
                isLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
              }`}
            >
              {isLoss ? '' : '+'}
              {formatCurrency(simulation.deltaAmountCents)}
            </span>
            <span
              className={`text-sm font-mono font-bold ${
                isLoss ? 'text-[#FF4D6D]' : 'text-[#19D98B]'
              }`}
            >
              ({isLoss ? '' : '+'}
              {simulation.deltaPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="text-xs text-[#A3A9BC] font-mono self-start sm:self-auto bg-white/[0.04] px-3.5 py-2 rounded-lg">
          Patrimônio simulado: <strong className="text-[#F3F5FA]">{formatCurrency(simulation.simulatedTotalCents)}</strong>
        </div>
      </div>
    </Card>
  );
}
