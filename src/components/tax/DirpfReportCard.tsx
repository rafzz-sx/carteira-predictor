// src/components/tax/DirpfReportCard.tsx
'use client';

import React, { useState } from 'react';
import { DirpfAnnualSummary } from '@/domain/finance/tax-calculator';
import {
  FileSpreadsheet,
  Copy,
  Check,
  Sparkles,
  Info,
  DollarSign,
} from 'lucide-react';

interface DirpfReportCardProps {
  report: DirpfAnnualSummary;
}

export function DirpfReportCard({ report }: DirpfReportCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'bens' | 'isentos' | 'exclusivos'>('bens');
  const [copiedTicker, setCopiedTicker] = useState<string | null>(null);

  const handleCopyDiscrimination = (ticker: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicker(ticker);
    setTimeout(() => setCopiedTicker(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/80 backdrop-blur-xl p-5 sm:p-7 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 flex items-center justify-center text-[#22D3EE]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA] flex items-center gap-2">
              Informe para a Declaração Anual (DIRPF {report.taxYear + 1} / Ano-Base {report.taxYear})
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                Receita Federal
              </span>
            </h2>
            <p className="text-xs text-[#A3A9BC]">
              Dados estruturados para preenchimento direto no Programa Gerador da Declaração (PGD IRPF)
            </p>
          </div>
        </div>

        {/* Total Custo em 31/12 */}
        <div className="flex items-center gap-2 bg-black/30 border border-white/[0.06] px-3.5 py-1.5 rounded-xl">
          <span className="text-[11px] text-[#A3A9BC]">Custo Total em 31/12:</span>
          <span className="text-sm font-bold font-tabular text-[#22D3EE]">
            R$ {(report.totalAcquisitionCostCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Crucial RFB Rule Warning */}
      <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] flex items-start gap-3 text-xs text-amber-300">
        <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[#F3F5FA] font-semibold">Atenção Crítica para a Ficha Bens e Direitos:</strong>
          <p className="mt-0.5">
            A Receita Federal exige o <strong>Custo de Aquisição (Preço Médio × Quantidade)</strong> da sua custódia em 31/12. <strong>NUNCA</strong> lance a cotação de mercado de fechamento do ano! Informar cotação de mercado em Bens e Direitos gera inconsistência de variação patrimonial e risco de malha fina.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 select-none overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('bens')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'bens'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          Ficha Bens e Direitos ({report.bensEDireitos.length} itens)
        </button>

        <button
          onClick={() => setActiveSubTab('isentos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'isentos'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          Rendimentos Isentos & Não Tributáveis
        </button>

        <button
          onClick={() => setActiveSubTab('exclusivos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeSubTab === 'exclusivos'
              ? 'bg-[#7C5CFF] text-white shadow-[0_0_12px_rgba(124,92,255,0.3)]'
              : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
          }`}
        >
          Tributação Exclusiva (JCP)
        </button>
      </div>

      {/* Sub Tab 1: Bens e Direitos */}
      {activeSubTab === 'bens' && (
        <div className="flex flex-col gap-3">
          {report.bensEDireitos.map((item) => {
            const isCopied = copiedTicker === item.ticker;

            return (
              <div
                key={item.ticker}
                className="p-4 rounded-xl border border-white/[0.06] bg-black/20 hover:border-white/[0.1] transition-all flex flex-col gap-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-[#F3F5FA] font-tabular">
                      {item.ticker}
                    </span>
                    <span className="text-xs text-[#A3A9BC]">{item.companyName}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-[#A3A9BC] block">Custo de Aquisição em 31/12</span>
                      <span className="text-sm font-bold font-tabular text-[#22D3EE]">
                        R$ {(item.acquisitionCostCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyDiscrimination(item.ticker, item.discriminationText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs text-[#F3F5FA] transition-colors border border-white/[0.08]"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <div>
                    <span className="text-[10px] text-[#A3A9BC] block">Grupo</span>
                    <span className="text-[#F3F5FA] truncate block">{item.groupCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A3A9BC] block">Código / Subgrupo</span>
                    <span className="text-[#F3F5FA] truncate block">{item.subgroupCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A3A9BC] block">CNPJ Oficial</span>
                    <span className="font-mono text-[#F3F5FA] text-[11px]">{item.cnpj}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A3A9BC] block">Quantidade & PM</span>
                    <span className="font-tabular text-[#F3F5FA]">
                      {item.quantity} un • R$ {(item.averagePriceCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#A3A9BC] bg-black/40 p-2.5 rounded-lg font-mono border border-white/[0.04]">
                  {item.discriminationText}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub Tab 2: Rendimentos Isentos */}
      {activeSubTab === 'isentos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Lucros Isentos de Ações (Vendas ≤ R$ 20k)</span>
              </div>
              <span className="text-xs text-[#A3A9BC] block">
                Ficha Rendimentos Isentos • Tipo 20
              </span>
              <div className="text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(report.rendimentosIsentos.exemptStockCapitalGainsCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[11px] text-[#A3A9BC] mt-4 pt-3 border-t border-white/[0.06]">
              Ganhos líquidos apurados em alienações no mercado à vista de ações até o teto de R$ 20.000 mensais.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Dividendos de Ações Declarados</span>
              </div>
              <span className="text-xs text-[#A3A9BC] block">
                Ficha Rendimentos Isentos • Tipo 09
              </span>
              <div className="text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(report.rendimentosIsentos.stockDividendsCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[11px] text-[#A3A9BC] mt-4 pt-3 border-t border-white/[0.06]">
              Proventos distribuídos pelas companhias abertas brasileiras (isenção prevista na Lei 9.249/95).
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Rendimentos de Fundos Imobiliários (FII)</span>
              </div>
              <span className="text-xs text-[#A3A9BC] block">
                Ficha Rendimentos Isentos • Tipo 26 (Outros)
              </span>
              <div className="text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(report.rendimentosIsentos.fiiEarningsCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[11px] text-[#A3A9BC] mt-4 pt-3 border-t border-white/[0.06]">
              Rendimentos mensais distribuídos por FIIs com mais de 100 cotistas negociados em bolsa.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Rendimentos de FI-Infra (Lei 12.431/11)</span>
              </div>
              <span className="text-xs text-[#A3A9BC] block">
                Ficha Rendimentos Isentos • Tipo 26 (Outros)
              </span>
              <div className="text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(report.rendimentosIsentos.fiinfraEarningsCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <p className="text-[11px] text-[#A3A9BC] mt-4 pt-3 border-t border-white/[0.06]">
              Proventos e ganhos de capital de Fundos Incentivados de Infraestrutura.
            </p>
          </div>
        </div>
      )}

      {/* Sub Tab 3: Tributação Exclusiva */}
      {activeSubTab === 'exclusivos' && (
        <div className="p-5 rounded-xl border border-white/[0.06] bg-black/20 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#7C5CFF]">
                <DollarSign className="w-4 h-4" />
                <span>Juros sobre Capital Próprio (JCP) Líquidos</span>
              </div>
              <span className="text-xs text-[#A3A9BC] block mt-0.5">
                Ficha Rendimentos Sujeitos à Tributação Exclusiva / Definitiva • Tipo 10
              </span>
              <div className="text-2xl font-bold font-tabular text-[#F3F5FA] mt-2">
                R$ {(report.rendimentosExclusivos.jurosSobreCapitalProprioCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-[#A3A9BC] block">IRRF Retido na Fonte (15%)</span>
              <span className="text-sm font-bold font-tabular text-amber-400">
                R$ {(report.rendimentosExclusivos.jcpWithholdingTaxCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#A3A9BC] pt-3 border-t border-white/[0.06] leading-relaxed">
            O JCP é tributado exclusivamente na fonte à alíquota de 15%. O valor líquido creditado em sua conta da corretora deve ser informado nesta ficha e não gera imposto a pagar nem a restituir na declaração anual.
          </p>
        </div>
      )}
    </div>
  );
}
