// src/components/fixed-income/FgcCoverageThermometer.tsx
'use client';

import React from 'react';
import { FgcAnalysisResult } from '@/domain/finance/fixed-income';
import { ShieldCheck, AlertTriangle, Landmark, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface FgcCoverageThermometerProps {
  fgcAnalysis: FgcAnalysisResult;
}

export function FgcCoverageThermometer({ fgcAnalysis }: FgcCoverageThermometerProps) {
  const {
    totalPrivateCreditCents,
    totalSovereignTreasuryCents,
    totalCoveredByFgcCents,
    totalExcessAboveFgcCents,
    globalFgcUtilizationPercent,
    issuers,
    isFullyProtected,
    recommendations,
  } = fgcAnalysis;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isFullyProtected
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
            }`}
          >
            {isFullyProtected ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Termômetro de Cobertura do FGC
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isFullyProtected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {isFullyProtected ? '100% Protegido' : 'Excedente em Risco'}
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Monitor de conformidade com os limites do Fundo Garantidor de Créditos (R$ 250 mil por banco e R$ 1 milhão global)
            </p>
          </div>
        </div>

        {/* Global Ceiling & Private Credit Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-black/30 border border-white/[0.06] px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-[#A3A9BC]">Crédito Privado:</span>
            <span className="text-xs font-bold font-tabular text-[#F3F5FA]">
              R$ {(totalPrivateCreditCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-white/[0.06] px-3 py-1.5 rounded-xl">
            <span className="text-[11px] text-[#A3A9BC]">Teto Global R$ 1M:</span>
            <span className="text-xs font-bold font-tabular text-[#22D3EE]">
              {globalFgcUtilizationPercent}% utilizado
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Coberto FGC */}
        <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col gap-1">
          <span className="text-[11px] text-[#A3A9BC] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Total Coberto pelo FGC
          </span>
          <div className="text-xl font-bold font-tabular text-emerald-400">
            R$ {(totalCoveredByFgcCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">CDBs, LCIs e LCAs protegidos</span>
        </div>

        {/* Excedente Descoberto */}
        <div
          className={`p-4 rounded-xl border flex flex-col gap-1 ${
            totalExcessAboveFgcCents > 0
              ? 'border-amber-500/30 bg-amber-500/[0.05]'
              : 'border-white/[0.06] bg-black/20'
          }`}
        >
          <span className="text-[11px] text-[#A3A9BC] flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${totalExcessAboveFgcCents > 0 ? 'text-amber-400' : 'text-[#A3A9BC]'}`} />
            Excedente Acima do Teto
          </span>
          <div
            className={`text-xl font-bold font-tabular ${
              totalExcessAboveFgcCents > 0 ? 'text-amber-400' : 'text-[#F3F5FA]'
            }`}
          >
            R$ {(totalExcessAboveFgcCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">
            {totalExcessAboveFgcCents > 0 ? 'Sem garantia se a instituição falir' : 'Nenhum valor desprotegido'}
          </span>
        </div>

        {/* Garantia Soberana Tesouro */}
        <div className="p-4 rounded-xl border border-[#22D3EE]/20 bg-[#22D3EE]/[0.03] flex flex-col gap-1">
          <span className="text-[11px] text-[#22D3EE] flex items-center gap-1.5 font-medium">
            <Landmark className="w-3.5 h-3.5" />
            Garantia Soberana da União
          </span>
          <div className="text-xl font-bold font-tabular text-[#22D3EE]">
            R$ {(totalSovereignTreasuryCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#A3A9BC]">Tesouro Direto (Sem teto de R$ 250k)</span>
        </div>
      </div>

      {/* Issuers Breakdown List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-[#A3A9BC] uppercase tracking-wider">
          Posições por Conglomerado Financeiro (Limite: R$ 250.000 por emissor)
        </h3>

        {issuers.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#A3A9BC] bg-black/20 rounded-xl">
            Nenhum instrumento de crédito bancário privado detectado na custódia.
          </div>
        ) : (
          issuers.map((issuer) => {
            const isDanger = issuer.status === 'danger';
            const isWarning = issuer.status === 'warning';

            return (
              <div
                key={issuer.issuer}
                className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col gap-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F3F5FA]">{issuer.issuer}</span>
                    <span className="text-xs text-[#A3A9BC]">
                      ({issuer.instrumentsCount} {issuer.instrumentsCount === 1 ? 'título' : 'títulos'})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-[#A3A9BC] block">Total alocado</span>
                      <span className="text-xs font-bold font-tabular text-[#F3F5FA]">
                        R$ {(issuer.totalInvestedCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                        isDanger
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {issuer.coverageRatioPercent}% do teto
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDanger
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, issuer.coverageRatioPercent)}%` }}
                  />
                </div>

                {/* Extra warning message if exceeded */}
                {isDanger && (
                  <span className="text-[11px] text-rose-400 font-medium">
                    ⚠️ Atenção: R$ {(issuer.excessCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} excedem o teto do FGC e estão descobertos em caso de liquidação bancária.
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Recommendations & Sovereign Note */}
      <div className="flex flex-col gap-2">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-white/[0.06] bg-black/30 flex items-start gap-2.5 text-xs text-[#A3A9BC]"
          >
            <Info className="w-4 h-4 shrink-0 text-[#22D3EE] mt-0.5" />
            <span>{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
