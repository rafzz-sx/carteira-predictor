'use client';

import React from 'react';
import { FileText, AlertCircle, Check, X, ShieldAlert, BookOpen } from 'lucide-react';

export function TaxRulesGuide() {
  const assetTaxTable = [
    {
      category: 'Ações Comuns (Swing Trade)',
      taxRate: '15%',
      monthlyExemption: 'R$ 20.000,00 / mês',
      isExemptPossible: true,
      lossCarryover: 'Compensa apenas Ações Comuns',
      sourceTax: '0,005% ("Dedo-duro")',
      legalRef: 'Lei nº 11.033/04',
    },
    {
      category: 'Fundos Imobiliários (FII)',
      taxRate: '20%',
      monthlyExemption: 'NÃO HÁ ISENÇÃO',
      isExemptPossible: false,
      lossCarryover: 'Compensa estritamente FIIs',
      sourceTax: 'Não retido na alienação',
      legalRef: 'Lei nº 8.668/93',
    },
    {
      category: 'FIAGRO (Cadeias Agro)',
      taxRate: '20%',
      monthlyExemption: 'NÃO HÁ ISENÇÃO',
      isExemptPossible: false,
      lossCarryover: 'Compensa apenas FIAGRO/FII',
      sourceTax: 'Não retido na alienação',
      legalRef: 'Lei nº 14.130/21',
    },
    {
      category: 'FI-Infra (Infraestrutura)',
      taxRate: '0% (100% Isento)',
      monthlyExemption: 'Isenção Integral',
      isExemptPossible: true,
      lossCarryover: 'Não gera tributo a compensar',
      sourceTax: 'Isento',
      legalRef: 'Lei nº 12.431/11',
    },
    {
      category: 'ETFs Nacionais (BOVA11, etc.)',
      taxRate: '15%',
      monthlyExemption: 'NÃO HÁ ISENÇÃO',
      isExemptPossible: false,
      lossCarryover: 'Compensa outros ETFs RV',
      sourceTax: '0,005% na venda',
      legalRef: 'Lei nº 13.043/14',
    },
    {
      category: 'Day Trade (Qualquer Ativo)',
      taxRate: '20%',
      monthlyExemption: 'NÃO HÁ ISENÇÃO',
      isExemptPossible: false,
      lossCarryover: 'Compensa apenas Day Trade',
      sourceTax: '1,0% ("Dedo-duro" Day Trade)',
      legalRef: 'IN RFB nº 1.585/15',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Comparative Tax Matrix */}
      <div className="rounded-xl border border-white/[0.08] bg-[#07080C]/80 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5B83D] mb-1">
              <FileText className="w-4 h-4" />
              Tributação Oficial B3 & Receita Federal
            </div>
            <h2 className="text-xl font-bold text-[#F3F5FA]">
              Matriz Comparativa de Alíquotas, Isenções e DARF 6015
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#F5B83D]/10 border border-[#F5B83D]/20 text-[#F5B83D]">
            Código DARF 6015
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[#70778C] uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Classe de Ativo B3</th>
                <th className="py-3 px-3">Alíquota Ganho</th>
                <th className="py-3 px-3">Isenção R$ 20k/mês?</th>
                <th className="py-3 px-3">Regra de Compensação</th>
                <th className="py-3 px-3">Retenção Fonte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {assetTaxTable.map((row) => (
                <tr key={row.category} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-semibold text-[#F3F5FA]">
                    {row.category}
                    <span className="block text-[10px] text-[#70778C] font-normal">{row.legalRef}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#22D3EE]">
                    {row.taxRate}
                  </td>
                  <td className="py-3 px-3">
                    {row.isExemptPossible ? (
                      <span className="inline-flex items-center gap-1 text-[#19D98B] font-medium">
                        <Check className="w-3.5 h-3.5" />
                        {row.monthlyExemption}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#FF5C5C] font-mono text-[11px]">
                        <X className="w-3.5 h-3.5" />
                        {row.monthlyExemption}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[#A3A9BC]">
                    {row.lossCarryover}
                  </td>
                  <td className="py-3 px-3 font-mono text-[#70778C]">
                    {row.sourceTax}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 Pillars of Tax Rigor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: R$ 20k Exemption */}
        <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#19D98B]">
            <BookOpen className="w-4 h-4" />
            1. O Teto de R$ 20.000/mês para Ações
          </div>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            Se a <strong>soma bruta de todas as vendas de ações</strong> no mês for igual ou inferior a R$ 20.000,00,
            todo o lucro apurado é 100% isento de Imposto de Renda. Se somar R$ 20.000,01, o imposto de 15% incide
            sobre <strong>todo o lucro do mês</strong> (e não apenas sobre o excedente).
          </p>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-[#70778C]">
            Atenção: Vendas de FIIs, FIAGRO e ETFs NÃO entram na conta dos R$ 20.000 e nunca são isentas.
          </div>
        </div>

        {/* Pillar 2: R$ 10 DARF Min Rule */}
        <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#22D3EE]">
            <ShieldAlert className="w-4 h-4" />
            2. Regra dos R$ 10,00 Mínimos (Lei 9.430/96, art. 67)
          </div>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            A Receita Federal proíbe o recolhimento de DARF com valor inferior a R$ 10,00.
            Se o imposto devido no mês for de R$ 7,50, você <strong>não paga nada agora</strong>.
            O valor fica retido na contabilidade do sistema e será somado aos impostos dos meses seguintes
            até atingir ou ultrapassar R$ 10,00.
          </p>
          <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-[11px] text-[#70778C]">
            Vencimento do DARF 6015: Sempre no último dia útil do mês seguinte à operação.
          </div>
        </div>

        {/* Pillar 3: Segregated Loss Carryover */}
        <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#F5B83D]">
            <AlertCircle className="w-4 h-4" />
            3. Segregação Estrita de Prejuízos Anteriores
          </div>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            Prejuízos passados podem ser abatidos indefinidamente de lucros futuros, desde que respeitem as classes
            estritas da Receita:
          </p>
          <ul className="text-xs text-[#A3A9BC] space-y-1 list-disc list-inside">
            <li>Prejuízo de Ações Swing Trade abatem apenas lucros de Ações Swing Trade.</li>
            <li>Prejuízos de FII abatem exclusivamente lucros de FIIs.</li>
            <li>Prejuízos de Day Trade abatem apenas lucros de Day Trade.</li>
          </ul>
        </div>

        {/* Pillar 4: DIRPF Historical Cost Basis */}
        <div className="p-5 rounded-xl border border-white/[0.08] bg-[#07080C]/80 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7C5CFF]">
            <FileText className="w-4 h-4" />
            4. Ficha Bens e Direitos: Custo Histórico de Aquisição
          </div>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            O informe DIRPF gerado pelo Carteira Predictor calcula exatamente a posição exigida pelo programa da Receita:
            <code className="text-[#22D3EE] font-mono block mt-1">Custo = Quantidade em 31/12 × Preço Médio</code>
          </p>
          <p className="text-xs text-[#A3A9BC] leading-relaxed">
            A valorização de mercado não é tributada nem lançada na ficha Bens e Direitos até que o ativo seja
            efetivamente vendido no mercado.
          </p>
        </div>
      </div>
    </div>
  );
}
