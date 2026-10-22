'use client';

import React from 'react';
import { HeartHandshake, Lock, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export function HonestyManifesto() {
  const commitments = [
    {
      icon: Clock,
      title: 'Regra 0: Cotações Transparentes com ~30 Minutos de Atraso',
      description:
        'A B3 cobra taxas elevadas por feeds de cotações em tempo real de nível 2. Para manter a plataforma 100% gratuita para o investidor brasileiro, utilizamos cotações oficiais com defasagem regulatória de ~30 minutos durante o pregão. Jamais simulamos um "falso tempo real" ou inventamos dados.',
    },
    {
      icon: Lock,
      title: 'Local-First: Seus Dados Financeiros Pertencem a Você',
      description:
        'Seus investimentos, preços médios e histórico de ordens não são vendidos para terceiros nem usados para perfilamento comercial. O Carteira Predictor opera prioritariamente no seu navegador e banco de dados isolado.',
    },
    {
      icon: Sparkles,
      title: 'Sem Venda de Ilusões ou Fórmulas Mágicas',
      description:
        'Não prometemos enriquecimento rápido nem lucros garantidos em renda variável. Nossos simuladores de Monte Carlo exibem com transparência os cenários de crise (drawdowns severos como COVID-19 e Joesley Day), incentivando uma alocação prudente e de longo prazo.',
    },
    {
      icon: CheckCircle2,
      title: '100% Gratuito Sem Cartão de Crédito',
      description:
        'Todas as funcionalidades analíticas, exportadores de DIRPF, simuladores de Marcação a Mercado e comparadores de títulos estão disponíveis sem paywalls, assinaturas ocultas ou exigência de dados de pagamento.',
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-6 backdrop-blur-md">
      <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-[#F5B83D] mb-2">
        <HeartHandshake className="w-4 h-4" />
        Manifesto Ético & Integridade
      </div>
      <h3 className="text-xl font-bold text-[#F3F5FA] mb-4">
        O Compromisso do Carteira Predictor com o Investidor Brasileiro
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {commitments.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F3F5FA]">
                <Icon className="w-4 h-4 text-[#7C5CFF] shrink-0" />
                <span>{item.title}</span>
              </div>
              <p className="text-xs text-[#A3A9BC] leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
