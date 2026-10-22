'use client';

import React, { useState } from 'react';
import { Cpu, Play, Zap } from 'lucide-react';
import { runMonteCarloSimulation } from '@/domain/finance/scenario-simulator';
import { formatCurrency } from '@/lib/formatters';

export function MonteCarloExplainer() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    executionTimeMs: number;
    trajectoriesCount: number;
    p10Cents: number;
    p50Cents: number;
    p90Cents: number;
    investedCents: number;
  } | null>(null);

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setTimeout(() => {
      const startTime = performance.now();
      
      const simulation = runMonteCarloSimulation({
        initialPortfolioCents: 10000000, // R$ 100.000,00
        monthlyActionCents: 200000,      // R$ 2.000,00 / mês
        years: 20,
        iterations: 1000,
        annualRealReturnPct: 6.5,       // IPCA + 6.5% a.a.
        annualVolatilityPct: 14.0,      // 14% a.a.
        sustainableDividendYieldPct: 6.0,
        seed: 42,
      });

      const endTime = performance.now();
      const lastPoint = simulation.timeline[simulation.timeline.length - 1];

      setBenchmarkResult({
        executionTimeMs: Number((endTime - startTime).toFixed(1)),
        trajectoriesCount: 1000,
        p10Cents: lastPoint.p10Cents,
        p50Cents: lastPoint.p50Cents,
        p90Cents: lastPoint.p90Cents,
        investedCents: lastPoint.totalInvestedCents,
      });
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Stochastic Model Card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22D3EE] mb-1">
              <Cpu className="w-4 h-4" />
              Modelagem Matemática Estocástica
            </div>
            <h2 className="text-xl font-bold text-[#F3F5FA]">
              Movimento Browniano Geométrico com Reinvestimento de Proventos
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#22D3EE]/10 border border-[#22D3EE]/20 text-[#22D3EE]">
            1.000 Trajetórias Independentes
          </span>
        </div>

        {/* Mathematical formulation */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-center my-4 overflow-x-auto">
          <div className="text-sm sm:text-base font-mono text-[#7C5CFF] inline-block tracking-wide">
            S<sub>t</sub> = S<sub>t-1</sub> × exp
            <span className="text-[#22D3EE]">
              [ (μ - ½σ²)Δt + σ√Δt · Z ]
            </span>
            &nbsp;+ Ação<sub>t</sub>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#A3A9BC] mt-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="font-mono text-[#F3F5FA] block font-semibold">Z ~ N(0, 1)</span>
            Gerado pelo algoritmo de <strong>Box-Muller</strong> a partir de pares uniformes independentes.
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="font-mono text-[#F3F5FA] block font-semibold">SeededRNG</span>
            Semente pseudo-aleatória determinística que permite reprodução e auditoria exata dos resultados.
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="font-mono text-[#F3F5FA] block font-semibold">Reinvestimento DY</span>
            Proventos (dividendos e juros sobre capital próprio) são reinvestidos compondo o efeito bola de neve.
          </div>
        </div>
      </div>

      {/* Percentiles Interpretation & Cones */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-[#F3F5FA] mb-2">Cones de Incerteza & Percentis Estatísticos</h3>
        <p className="text-xs text-[#A3A9BC] mb-6">
          Em vez de prometer uma projeção linear irreal, o simulador decompõe a probabilidade em 5 faixas rigorosas de dispersão:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#FF5C5C]">P10</span>
              <span className="text-[10px] text-[#70778C]">Adverso</span>
            </div>
            <span className="text-xs font-semibold text-[#F3F5FA]">Estresse Severo</span>
            <p className="text-[11px] text-[#A3A9BC] mt-1 leading-snug">
              90% das trajetórias superam este valor. Representa crises prolongadas e recessões severas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#F5B83D]">P25</span>
              <span className="text-[10px] text-[#70778C]">Cauteloso</span>
            </div>
            <span className="text-xs font-semibold text-[#F3F5FA]">Conservador</span>
            <p className="text-[11px] text-[#A3A9BC] mt-1 leading-snug">
              Cenário abaixo da média histórica, com volatilidade desfavorável e retornos moderados.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/30 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#7C5CFF]">P50</span>
              <span className="text-[10px] text-[#7C5CFF] font-semibold">Mediana</span>
            </div>
            <span className="text-xs font-semibold text-white">Probabilidade Máxima</span>
            <p className="text-[11px] text-[#A3A9BC] mt-1 leading-snug">
              O ponto central das 1.000 trajetórias. Metade fica acima e metade abaixo. Caso base de planejamento.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#22D3EE]">P75</span>
              <span className="text-[10px] text-[#70778C]">Otimista</span>
            </div>
            <span className="text-xs font-semibold text-[#F3F5FA]">Favorável</span>
            <p className="text-[11px] text-[#A3A9BC] mt-1 leading-snug">
              Ciclos de expansão econômica brasileira e queda estrutural da taxa básica Selic.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#19D98B]">P90</span>
              <span className="text-[10px] text-[#70778C]">Super Bull</span>
            </div>
            <span className="text-xs font-semibold text-[#F3F5FA]">Excepcional</span>
            <p className="text-[11px] text-[#A3A9BC] mt-1 leading-snug">
              Apenas 10% dos cenários superam este valor. Ralis históricos e múltiplos em expansão.
            </p>
          </div>
        </div>
      </div>

      {/* Live Benchmark Execution Engine */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#F5B83D]" />
              Auditoria de Desempenho em Tempo Real
            </h3>
            <p className="text-xs text-[#A3A9BC]">
              Dispare a execução instantânea de 1.000 trajetórias estocásticas de 20 anos na sua máquina.
            </p>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C5CFF] to-[#22D3EE] text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:opacity-90 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunning ? 'Calculando...' : 'Rodar 1.000 Trajetórias'}</span>
          </button>
        </div>

        {benchmarkResult ? (
          <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#19D98B] animate-pulse" />
                <span className="text-[#F3F5FA] font-medium">1.000 Trajetórias Simuladas</span>
              </div>
              <div className="text-xs font-mono text-[#19D98B] bg-[#19D98B]/10 px-3 py-1 rounded-full border border-[#19D98B]/20">
                Tempo de Execução: <strong>{benchmarkResult.executionTimeMs} ms</strong> (Meta &lt; 30ms)
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <span className="text-[10px] text-[#70778C] block uppercase">Total Aportado</span>
                <span className="text-[#F3F5FA] font-semibold text-sm">
                  {formatCurrency(benchmarkResult.investedCents)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#FF5C5C] block uppercase">P10 (Estresse 20a)</span>
                <span className="text-[#FF5C5C] font-semibold text-sm">
                  {formatCurrency(benchmarkResult.p10Cents)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#7C5CFF] block uppercase">P50 (Mediana 20a)</span>
                <span className="text-[#7C5CFF] font-bold text-sm">
                  {formatCurrency(benchmarkResult.p50Cents)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#19D98B] block uppercase">P90 (Otimista 20a)</span>
                <span className="text-[#19D98B] font-semibold text-sm">
                  {formatCurrency(benchmarkResult.p90Cents)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-black/20 border border-dashed border-white/[0.08] text-center text-xs text-[#70778C]">
            Clique no botão acima para medir o tempo exato de cálculo do algoritmo Box-Muller em tempo real.
          </div>
        )}
      </div>
    </div>
  );
}
