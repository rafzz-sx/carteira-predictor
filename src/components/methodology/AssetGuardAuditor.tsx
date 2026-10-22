'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Search } from 'lucide-react';
import { MethodologyDomain } from '@/domain/finance/methodology';

export function AssetGuardAuditor() {
  const [tickerQuery, setTickerQuery] = useState<string>('VALE3');

  const auditResult = MethodologyDomain.auditTicker(tickerQuery);

  const sampleChips = [
    { ticker: 'VALE3', type: 'allow', label: 'VALE3 (Ação ON)' },
    { ticker: 'ITUB4', type: 'allow', label: 'ITUB4 (Ação PN)' },
    { ticker: 'HGLG11', type: 'allow', label: 'HGLG11 (FII Tijolo)' },
    { ticker: 'VGIA11', type: 'allow', label: 'VGIA11 (FIAGRO)' },
    { ticker: 'JURO11', type: 'allow', label: 'JURO11 (FI-Infra)' },
    { ticker: 'BOVA11', type: 'allow', label: 'BOVA11 (ETF B3)' },
    { ticker: 'TESOURO IPCA+ 2035', type: 'allow', label: 'Tesouro IPCA+' },
    { ticker: 'AAPL34', type: 'deny', label: 'AAPL34 (BDR)' },
    { ticker: 'IVVB11', type: 'deny', label: 'IVVB11 (ETF EUA)' },
    { ticker: 'HASH11', type: 'deny', label: 'HASH11 (Cripto)' },
    { ticker: 'BTC', type: 'deny', label: 'Bitcoin' },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Auditor Header */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C5CFF] mb-1">
              <ShieldCheck className="w-4 h-4" />
              Guarda Estrita de Ativos Brasileiros
            </div>
            <h2 className="text-xl font-bold text-[#F3F5FA]">
              Validador de Conformidade em Tempo Real (BrazilianAssetGuard)
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
            100% Brasil
          </span>
        </div>

        <p className="text-xs text-[#A3A9BC] mb-6">
          O <strong>Carteira Predictor</strong> possui um módulo de conformidade algorítmica (<code className="text-[#22D3EE] font-mono">BrazilianAssetGuard</code>)
          que atua como uma barreira de segurança, bloqueando tickers estrangeiros, BDRs e criptoativos na entrada de dados e na importação de notas de corretagem.
        </p>

        {/* Live Search & Test */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#F3F5FA] block mb-1.5">
              Auditar Qualquer Ticker ou Ativo:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#70778C] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tickerQuery}
                onChange={(e) => setTickerQuery(e.target.value)}
                placeholder="Ex: PETR4, MXRF11, AAPL34, IVVB11, TESOURO..."
                className="w-full bg-black/60 border border-white/[0.12] rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-[#F3F5FA] uppercase focus:outline-none focus:border-[#7C5CFF] transition-all"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-[#70778C] block">Exemplos rápidos para teste:</span>
            <div className="flex flex-wrap gap-1.5">
              {sampleChips.map((chip) => (
                <button
                  key={chip.ticker}
                  onClick={() => setTickerQuery(chip.ticker)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                    tickerQuery.toUpperCase() === chip.ticker.toUpperCase()
                      ? chip.type === 'allow'
                        ? 'bg-[#19D98B] text-black font-bold shadow-[0_0_10px_rgba(25,217,139,0.4)]'
                        : 'bg-[#FF5C5C] text-white font-bold shadow-[0_0_10px_rgba(255,92,92,0.4)]'
                      : chip.type === 'allow'
                      ? 'bg-[#19D98B]/10 text-[#19D98B] hover:bg-[#19D98B]/20 border border-[#19D98B]/20'
                      : 'bg-[#FF5C5C]/10 text-[#FF5C5C] hover:bg-[#FF5C5C]/20 border border-[#FF5C5C]/20'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Audit Result Box */}
          <div
            className={`p-5 rounded-xl border transition-all ${
              auditResult.isAllowed
                ? 'bg-[#19D98B]/5 border-[#19D98B]/30'
                : 'bg-[#FF5C5C]/5 border-[#FF5C5C]/30'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {auditResult.isAllowed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#19D98B]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#FF5C5C]" />
                )}
                <span className="font-mono text-base font-bold text-[#F3F5FA]">
                  {tickerQuery.trim().toUpperCase() || '(Vazio)'}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    auditResult.isAllowed
                      ? 'bg-[#19D98B]/20 text-[#19D98B]'
                      : 'bg-[#FF5C5C]/20 text-[#FF5C5C]'
                  }`}
                >
                  {auditResult.isAllowed ? 'Permitido no Cockpit' : 'Bloqueado na Entrada'}
                </span>
              </div>

              <span className="text-xs font-mono text-[#A3A9BC]">
                Categoria: <strong className="text-[#F3F5FA]">{auditResult.regulatoryCategory}</strong>
              </span>
            </div>

            <p className="text-xs text-[#A3A9BC] leading-relaxed">
              {auditResult.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Rationale: Why 100% Brazil? */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <span className="text-xs font-bold text-[#19D98B] block uppercase tracking-wider">
            1. Conformidade Fiscal Precisa
          </span>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            Ao restringir a carteira aos ativos B3 e Tesouro Nacional, garantimos que 100% dos relatórios tributários,
            isenções de R$ 20.000,00 e informes da DIRPF estejam estritamente alinhados à Instrução Normativa da Receita Federal.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <span className="text-xs font-bold text-[#22D3EE] block uppercase tracking-wider">
            2. Sem Bitributação Oculta
          </span>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            Ativos no exterior retêm 30% na fonte (IRS americano) sobre proventos antes do envio ao Brasil.
            Na B3, dividendos de ações e proventos de FIIs/FIAGRO contam com isenção integral para pessoas físicas.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <span className="text-xs font-bold text-[#7C5CFF] block uppercase tracking-wider">
            3. Efeito Bola de Neve Doméstico
          </span>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            Foco no reinvestimento eficiente de proventos mensais no setor produtivo nacional, infraestrutura brasileira
            e títulos com o maior juro real do mundo com risco soberano.
          </p>
        </div>
      </div>
    </div>
  );
}
