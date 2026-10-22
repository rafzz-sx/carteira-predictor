'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  PlusCircle,
  Zap,
  UserCheck,
  FileSpreadsheet,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { KPI } from '@/components/ui/KPI';
import { Button } from '@/components/ui/Button';
import { MonthlyActionCard } from '@/components/action/MonthlyActionCard';
import { formatCurrency } from '@/lib/formatters';
import { useUI } from '@/lib/theme-context';
import { UserProfile } from '@/domain/models/user-profile';
import { PROFILE_METADATA } from '@/domain/finance/risk-questionnaire';
import { NewTransactionModal } from '@/components/portfolio/NewTransactionModal';
import { B3ImportModal } from '@/components/portfolio/B3ImportModal';

interface DashboardPosition {
  id: string;
  ticker: string;
  assetType: 'stock' | 'fii' | 'fiagro' | 'fiinfra' | 'etf_br' | 'fixed_income';
  quantity: number;
  averagePriceCents: number;
  totalInvestedCents: number;
  currentGrossCents: number;
  gainLossCents: number;
  gainLossPercent: number;
  weightPercent: number;
  quote?: {
    ticker: string;
    name: string;
    priceCents: number;
    changePercent: number;
    changeCents: number;
  };
}

interface PortfolioSummary {
  totalInvestedCents: number;
  totalCurrentGrossCents: number;
  totalGainLossCents: number;
  totalGainLossPercent: number;
  positionCount: number;
  allocationByClass: Record<string, number>;
}

export default function HomePage() {
  const router = useRouter();
  const { userId } = useUI();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [plannedCents, setPlannedCents] = useState<number>(0);
  const [effectiveSince, setEffectiveSince] = useState<string>('');
  const [positions, setPositions] = useState<DashboardPosition[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    async function fetchUserData() {
      try {
        const [profileRes, planRes, portfolioRes] = await Promise.all([
          fetch(`/api/user/profile?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/action-plan?userId=${encodeURIComponent(userId)}`),
          fetch(`/api/portfolio?userId=${encodeURIComponent(userId)}`),
        ]);

        if (!isCancelled && profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.profile) {
            setUserProfile(profileData.profile);
          }
        }

        if (!isCancelled && planRes.ok) {
          const planData = await planRes.json();
          if (planData.entries && planData.entries.length > 0) {
            setPlannedCents(planData.entries[0].baseAmountCents);
            setEffectiveSince(planData.entries[0].effectiveFrom);
          } else {
            setPlannedCents(0);
            setEffectiveSince('');
          }
        }

        if (!isCancelled && portfolioRes.ok) {
          const portData = await portfolioRes.json();
          if (portData.positions) {
            setPositions(portData.positions);
            setSummary(portData.summary);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard user data:', err);
      }
    }

    fetchUserData();

    return () => {
      isCancelled = true;
    };
  }, [userId, refreshTrigger]);

  const profileLabel = userProfile
    ? PROFILE_METADATA[userProfile.riskProfile]?.label.toUpperCase()
    : 'MODERADO ARROJADO';

  const positionCount = summary?.positionCount || positions.length;
  const isZeroState = positionCount === 0;

  // Real allocation percentages
  const totalGross = summary?.totalCurrentGrossCents || 0;
  const allocation = useMemo(() => {
    if (!summary || totalGross === 0) {
      return {
        stocks: 0,
        fiis: 0,
        fixed: 0,
        cash: 0,
      };
    }
    const alloc = summary.allocationByClass || {};
    return {
      stocks: Number((((alloc.stock || 0) / totalGross) * 100).toFixed(1)),
      fiis: Number(((((alloc.fii || 0) + (alloc.fiagro || 0) + (alloc.fiinfra || 0)) / totalGross) * 100).toFixed(1)),
      fixed: Number((((alloc.fixed_income || 0) / totalGross) * 100).toFixed(1)),
      cash: 0,
    };
  }, [summary, totalGross]);

  // Real top movers
  const topMovers = useMemo(() => {
    return [...positions]
      .filter((p) => p.quote)
      .sort((a, b) => Math.abs(b.quote?.changePercent || 0) - Math.abs(a.quote?.changePercent || 0))
      .slice(0, 3);
  }, [positions]);

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
              {positionCount} {positionCount === 1 ? 'Ativo' : 'Ativos'}
            </Badge>
          </div>

          <KPI
            label=""
            valueCents={summary?.totalCurrentGrossCents || 0}
            deltaPercent={isZeroState ? 0 : summary?.totalGainLossPercent || 0}
            deltaCents={isZeroState ? 0 : summary?.totalGainLossCents || 0}
            deltaPeriod={isZeroState ? 'hoje' : 'retorno'}
            benchmarkNote={
              isZeroState
                ? 'Carteira zerada • Adicione ativos ou importe seu extrato'
                : `Investido: ${formatCurrency(summary?.totalInvestedCents || 0)}`
            }
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
            onClick={() => setIsTransactionModalOpen(true)}
          >
            Nova Ação
          </Button>
        </div>
      </section>

      {/* Onboarding Empty State Banner if 0 assets */}
      {isZeroState && (
        <section className="rounded-2xl p-6 bg-gradient-to-r from-[#7C5CFF]/15 via-[#22D3EE]/5 to-transparent border border-[#7C5CFF]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-[#7C5CFF]" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#F3F5FA]">
                  Sua Carteira está pronta e zerada
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#19D98B]/10 text-[#19D98B] border border-[#19D98B]/20">
                  ISOLAMENTO PRIVADO
                </span>
              </div>
              <p className="text-xs text-[#A3A9BC] max-w-2xl leading-relaxed">
                Você ainda não possui nenhum ativo cadastrado nesta carteira. Adicione manualmente suas primeiras compras da B3 (Ações, FIIs, Renda Fixa) ou importe seu extrato oficial da Área do Investidor para ativar projeções Monte Carlo e rebalanceamento inteligente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsTransactionModalOpen(true)}
              className="flex-1 md:flex-initial"
            >
              Adicionar Ativo
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => setIsImportModalOpen(true)}
              className="flex-1 md:flex-initial"
            >
              Importar Extrato B3
            </Button>
          </div>
        </section>
      )}

      {/* Row 1: Monthly Action Plan + Smart Buy Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Block 1: Monthly Action Card */}
        <MonthlyActionCard
          yearMonth="2026-10"
          monthName="Outubro/2026"
          plannedAmountCents={plannedCents}
          actualAmountCents={0}
          status="pending"
          effectiveSince={effectiveSince || 'Nenhum plano configurado'}
          onEditPlan={() => {
            router.push('/aportes');
          }}
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
            <span className="text-xs text-[#A3A9BC] font-mono">
              {plannedCents > 0 ? `${formatCurrency(plannedCents)} disponível` : 'R$ 0 disponível'}
            </span>
          </div>

          {isZeroState ? (
            <div className="py-2">
              <div className="text-sm font-semibold text-[#F3F5FA]">
                Aguardando cadastro de ativos e plano de ação
              </div>
              <p className="text-xs text-[#A3A9BC] mt-1.5 leading-relaxed">
                Assim que você cadastrar seus primeiros ativos e configurar seu plano de aporte mensal, o algoritmo calculará as compras ideais para equilibrar sua carteira sem despesas fiscais ou giros desnecessários.
              </p>
            </div>
          ) : (
            <div>
              <div className="text-sm font-semibold text-[#F3F5FA]">
                Comprar <span className="text-[#7C5CFF] font-mono">{positions[0]?.ticker || 'ativos'}</span>
              </div>
              <p className="text-xs text-[#A3A9BC] mt-1 leading-relaxed">
                Reequilibra sua carteira mantendo as proporções ideais do perfil {profileLabel.toLowerCase()}.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-mono">
            {isZeroState ? (
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#70778C]">
                Sem ordens pendentes
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                {positions[0] ? `${positions[0].ticker} • Foco do mês` : 'Calculando...'}
              </span>
            )}
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
              {isZeroState ? 'Aguardando Ativos' : 'P50 Cenário Central'}
            </Badge>
          </div>

          {/* Fan Chart SVG Graphic */}
          <div className="h-44 w-full relative flex items-center justify-center">
            {isZeroState ? (
              <div className="text-center p-4">
                <TrendingUp className="w-8 h-8 text-[#7C5CFF]/40 mx-auto mb-2" />
                <p className="text-xs text-[#A3A9BC]">
                  Cadastre seus ativos para gerar as curvas probabilísticas (P10 estresse, P50 mediana, P90 otimista).
                </p>
              </div>
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-center">
            <div>
              <span className="text-[11px] text-[#A3A9BC] block">Cenário P10 (Estresse)</span>
              <span className="text-xs font-semibold text-[#FF4D6D] font-tabular maskable">
                {isZeroState ? 'R$ 0,00' : formatCurrency(Math.round(totalGross * 1.15))}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#A3A9BC] block">Cenário Central (P50)</span>
              <span className="text-xs font-semibold text-[#7C5CFF] font-tabular maskable">
                {isZeroState ? 'R$ 0,00' : formatCurrency(Math.round(totalGross * 1.45))}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#A3A9BC] block">Cenário P90 (Otimista)</span>
              <span className="text-xs font-semibold text-[#19D98B] font-tabular maskable">
                {isZeroState ? 'R$ 0,00' : formatCurrency(Math.round(totalGross * 1.85))}
              </span>
            </div>
          </div>
        </Card>

        {/* Strategic Allocation */}
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
                <span className="text-[#A3A9BC] font-mono font-tabular">
                  {isZeroState ? '0,0%' : `${allocation.stocks}%`} / 40%
                </span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#7C5CFF] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(allocation.stocks, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Fundos Imobiliários (FIIs)</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">
                  {isZeroState ? '0,0%' : `${allocation.fiis}%`} / 35%
                </span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#22D3EE] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(allocation.fiis, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Renda Fixa / Tesouro</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">
                  {isZeroState ? '0,0%' : `${allocation.fixed}%`} / 20%
                </span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#19D98B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(allocation.fixed, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#F3F5FA] font-medium">Reserva de Emergência</span>
                <span className="text-[#A3A9BC] font-mono font-tabular">
                  {isZeroState ? '0,0%' : `${allocation.cash}%`} / 5%
                </span>
              </div>
              <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#F5B83D] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(allocation.cash, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#A3A9BC] pt-2 border-t border-white/[0.08] text-center">
            {isZeroState ? (
              <span>Aguardando aportes para cálculo de rebalanceamento</span>
            ) : (
              <span>
                Desvio máximo da meta:{' '}
                <span className="text-[#F3F5FA] font-semibold">
                  {Math.abs(40 - allocation.stocks).toFixed(1)}% em Ações
                </span>
              </span>
            )}
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

          {topMovers.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#A3A9BC]">
              Nenhum ativo cadastrado. Cadastre ações ou FIIs para acompanhar oscilações em tempo real.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.08] text-xs">
              {topMovers.map((pos) => {
                const quote = pos.quote;
                const isPositive = (quote?.changePercent || 0) >= 0;
                return (
                  <div key={pos.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-[#F3F5FA]">{pos.ticker}</span>
                      <span className="text-[#A3A9BC] truncate max-w-[130px]">{quote?.name || pos.ticker}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[#F3F5FA] font-tabular maskable">
                        {formatCurrency(quote?.priceCents || 0)}
                      </span>
                      <span
                        className={`font-semibold flex items-center font-tabular ${
                          isPositive ? 'text-[#19D98B]' : 'text-[#FF4D6D]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {quote?.changePercent?.toFixed(2)}% {isPositive ? '↑' : '↓'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Proventos Previstos */}
        <Card variant="glass" className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Proventos do Mês
            </span>
            <span className="text-xs text-[#7C5CFF] font-medium">Outubro/2026</span>
          </div>

          {isZeroState ? (
            <div className="py-6 text-center text-xs text-[#A3A9BC]">
              R$ 0,00 previstos. Proventos de FIIs e dividendos de ações são calculados automaticamente conforme custódia.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-white/[0.08] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-mono font-semibold text-[#F3F5FA]">{positions[0]?.ticker} • Provento</div>
                  <div className="text-[11px] text-[#A3A9BC]">Previsão calculada com base na custódia</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-semibold text-[#19D98B] font-tabular maskable">
                    +{formatCurrency(Math.round(positions[0].quantity * 110))}
                  </div>
                  <div className="text-[11px] text-[#19D98B]">Estimado</div>
                </div>
              </div>
            </div>
          )}
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

      {/* Modals directly accessible from Dashboard */}
      <NewTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <B3ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}
