'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  PlusCircle,
  Zap,
  UserCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPI } from '@/components/ui/KPI';
import { Button } from '@/components/ui/Button';
import { MonthlyActionCard } from '@/components/action/MonthlyActionCard';
import { formatCurrency } from '@/lib/formatters';
import { UserProfile } from '@/domain/models/user-profile';
import { PROFILE_METADATA } from '@/domain/finance/risk-questionnaire';

export default function HomePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [plannedCents, setPlannedCents] = useState<number>(250000);
  const [effectiveSince, setEffectiveSince] = useState<string>('Julho/2026');

  useEffect(() => {
    async function fetchUserData() {
      try {
        const [profileRes, planRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/action-plan'),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile) {
            setUserProfile(profileData.profile);
          }
        }

        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.entries && planData.entries.length > 0) {
            setPlannedCents(planData.entries[0].baseAmountCents);
            setEffectiveSince(planData.entries[0].effectiveFrom);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard user data:', err);
      }
    }
    fetchUserData();
  }, []);

  const profileLabel = userProfile
    ? PROFILE_METADATA[userProfile.riskProfile]?.label.toUpperCase()
    : 'MODERADO ARROJADO';

  return (
    <div className="flex flex-col gap-6 max-w-full">
      {/* Hero Section: Consolidated Wealth & Quick Action */}
      <section className="rounded-2xl p-5 sm:p-7 bg-white/[0.035] backdrop-blur-md border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
              Patrimônio Consolidado
            </span>
            <Badge variant="asset-type" size="sm">
              12 Ativos
            </Badge>
            <span className="text-[11px] text-[#F5B83D] bg-[#F5B83D]/10 px-2 py-0.5 rounded font-medium border border-[#F5B83D]/20">
              DADOS DE EXEMPLO
            </span>
          </div>

          <KPI
            label=""
            valueCents={14892045}
            deltaPercent={0.96}
            deltaCents={142010}
            deltaPeriod="hoje"
            benchmarkNote="+18,42% em 12m (vs CDI 10,75%)"
            size="hero"
          />
        </div>

        {/* Profile and Action CTA */}
        <div className="flex items-center gap-4 self-start md:self-auto">
          <Link
            href="/perfil"
            className="flex flex-col items-start md:items-end text-left md:text-right group cursor-pointer"
            title="Clique para ver ou ajustar seu Perfil de Risco"
          >
            <span className="text-xs text-[#A3A9BC] group-hover:text-[#F3F5FA] flex items-center gap-1 transition-colors">
              <UserCheck className="w-3 h-3 text-[#7C5CFF]" />
              Perfil de Risco
            </span>
            <span className="text-sm font-semibold text-[#7C5CFF] group-hover:text-[#22D3EE] font-mono transition-colors">
              {profileLabel}
            </span>
          </Link>

          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => alert('Registrar nova ação na carteira')}
          >
            Nova Ação
          </Button>
        </div>
      </section>

      {/* Row 1: Monthly Action Plan + Smart Buy Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Block 1: Monthly Action Card */}
        <MonthlyActionCard
          yearMonth="2026-10"
          monthName="Outubro/2026"
          plannedAmountCents={plannedCents}
          actualAmountCents={0}
          status="pending"
          effectiveSince={effectiveSince}
          onEditPlan={() => alert('Ajustar plano de ação mensal')}
        />

        {/* Block 2: Smart Monthly Action (Ação Inteligente do Mês) */}
        <Card variant="metric" borderAccent="brand" className="p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#7C5CFF]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Ação Inteligente do Mês
              </span>
            </div>
            <span className="text-xs text-[#A3A9BC] font-mono">R$ 2.500 disponível</span>
          </div>

          <div>
            <div className="text-sm font-semibold text-[#F3F5FA]">
              Comprar <span className="text-[#7C5CFF] font-mono">HGLG11</span> e <span className="text-[#7C5CFF] font-mono">ITUB4</span>
            </div>
            <p className="text-xs text-[#A3A9BC] mt-1 leading-relaxed">
              Reequilibra FIIs de logística (subalocados em 3,2%) e reforça qualidade sem necessidade de giro ou vendas de ativos.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              8 cotas HGLG11 (~R$ 1.340)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
              32 ações ITUB4 (~R$ 1.150)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
            <span className="text-[#A3A9BC]">Regras fiscais e lotes respeitados</span>
            <Link href="/como-calculamos" className="text-[#7C5CFF] hover:underline font-semibold flex items-center gap-1">
              Ver cálculo detalhado <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Row 2: Projection Sparkline & Strategic Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Projection Teaser */}
        <Card variant="glass" className="p-5 lg:col-span-2 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Projeção Probabilística da Carteira
              </span>
              <div className="text-sm font-medium text-[#F3F5FA] mt-0.5">
                Simulação Monte Carlo Correlacionada (36 meses)
              </div>
            </div>
            <Badge variant="asset-type" size="sm">
              P50 Cenário Central
            </Badge>
          </div>

          {/* Fan Chart SVG Graphic */}
          <div className="h-44 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="p5p95Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.03" />
                </linearGradient>
                <linearGradient id="p25p75Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.10" />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="600" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="0" y1="130" x2="600" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

              <path d="M 0 110 Q 300 70 600 20 L 600 150 Q 300 135 0 110 Z" fill="url(#p5p95Grad)" />
              <path d="M 0 110 Q 300 85 600 45 L 600 130 Q 300 125 0 110 Z" fill="url(#p25p75Grad)" />
              <path d="M 0 110 Q 300 95 600 75" fill="none" stroke="#7C5CFF" strokeWidth="2.5" />
              <path d="M 0 110 Q 300 102 600 92" fill="none" stroke="#A3A9BC" strokeWidth="1.5" strokeDasharray="4" />
              <circle cx="0" cy="110" r="4" fill="#7C5CFF" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-center">
            <div>
              <span className="text-[11px] text-[#A3A9BC] block">Cenário P10 (Estresse)</span>
              <span className="text-xs font-semibold text-[#FF4D6D] font-tabular maskable">
                {formatCurrency(21540000)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#A3A9BC] block">Cenário Central (P50)</span>
              <span className="text-xs font-semibold text-[#7C5CFF] font-tabular maskable">
                {formatCurrency(27480000)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#A3A9BC] block">Cenário P90 (Otimista)</span>
              <span className="text-xs font-semibold text-[#19D98B] font-tabular maskable">
                {formatCurrency(34810000)}
              </span>
            </div>
          </div>
        </Card>

        {/* Strategic Allocation Donut */}
        <Card variant="glass" className="p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Alocação Estratégica
            </span>
            <span className="text-xs text-[#7C5CFF] font-medium">Meta Definida</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Ações Brasil</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">38,5% / 40%</span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-[#7C5CFF] h-full rounded-full" style={{ width: '38.5%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Fundos Imobiliários (FIIs)</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">31,8% / 35%</span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-[#22D3EE] h-full rounded-full" style={{ width: '31.8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Renda Fixa / Tesouro</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">24,2% / 20%</span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-[#19D98B] h-full rounded-full" style={{ width: '24.2%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Reserva de Emergência</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">5,5% / 5%</span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div className="bg-[#F5B83D] h-full rounded-full" style={{ width: '5.5%' }} />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#A3A9BC] pt-2 border-t border-white/[0.08] text-center">
            Desvio máximo da meta: <span className="text-[#F3F5FA] font-semibold">3,2% em FIIs</span>
          </div>
        </Card>
      </div>

      {/* Row 3: Movers Today & Upcoming Dividends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card variant="glass" className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Destaques da Carteira
            </span>
            <span className="text-xs text-[#70778C]">Hoje na B3</span>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.08] text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-[#F3F5FA]">VALE3</span>
                <span className="text-[#A3A9BC] truncate max-w-[130px]">Vale S.A.</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[#F3F5FA] font-tabular maskable">{formatCurrency(5840)}</span>
                <span className="font-semibold text-[#19D98B] flex items-center font-tabular">+2,45% ↑</span>
              </div>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-[#F3F5FA]">HGLG11</span>
                <span className="text-[#A3A9BC] truncate max-w-[130px]">CSHG Logística</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[#F3F5FA] font-tabular maskable">{formatCurrency(16780)}</span>
                <span className="font-semibold text-[#19D98B] flex items-center font-tabular">+0,82% ↑</span>
              </div>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-[#F3F5FA]">WEGE3</span>
                <span className="text-[#A3A9BC] truncate max-w-[130px]">WEG S.A.</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-[#F3F5FA] font-tabular maskable">{formatCurrency(5210)}</span>
                <span className="font-semibold text-[#FF4D6D] flex items-center font-tabular">−0,65% ↓</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Proventos Previstos */}
        <Card variant="glass" className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Proventos do Mês
            </span>
            <span className="text-xs text-[#7C5CFF] font-medium">Outubro/2026</span>
          </div>

          <div className="flex flex-col divide-y divide-white/[0.08] text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-mono font-semibold text-[#F3F5FA]">HGLG11 • Rendimento</div>
                <div className="text-[11px] text-[#A3A9BC]">Pago em 14/10 • R$ 1,10 / cota</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-semibold text-[#19D98B] font-tabular maskable">+{formatCurrency(22000)}</div>
                <div className="text-[11px] text-[#19D98B]">Recebido</div>
              </div>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-mono font-semibold text-[#F3F5FA]">ITUB4 • JCP</div>
                <div className="text-[11px] text-[#A3A9BC]">Previsão 31/10 • R$ 0,28 / ação</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-semibold text-[#F3F5FA] font-tabular maskable">+{formatCurrency(14560)}</div>
                <div className="text-[11px] text-[#A3A9BC]">A receber (líq.)</div>
              </div>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-mono font-semibold text-[#F3F5FA]">KNCR11 • Rendimento</div>
                <div className="text-[11px] text-[#A3A9BC]">Previsão 12/11 • R$ 1,02 / cota</div>
              </div>
              <div className="text-right font-mono">
                <div className="font-semibold text-[#F3F5FA] font-tabular maskable">+{formatCurrency(18360)}</div>
                <div className="text-[11px] text-[#A3A9BC]">A receber</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mandatory Disclaimer Footer */}
      <footer className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-[#A3A9BC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-[#70778C]">
          <strong>Aviso Legal:</strong> Simulação baseada em dados históricos e premissas matemáticas. O Carteira Predictor é uma ferramenta analítica e educativa. Não constitui previsão de mercado, garantia de rentabilidade nem recomendação de investimento.
        </p>
        <Link href="/como-calculamos" className="text-[#7C5CFF] hover:underline text-[11px] shrink-0 font-medium">
          Como calculamos →
        </Link>
      </footer>
    </div>
  );
}
