// src/app/aportes/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  PlusCircle,
  Sparkles,
  Calendar,
  Layers,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import { useUI } from '@/lib/theme-context';
import { ActionPlanEntry, ActionMonthOverride } from '@/domain/models/action-plan';
import { MonthlyActionCard } from '@/components/action/MonthlyActionCard';
import { NewPlanEntryModal } from '@/components/action/NewPlanEntryModal';
import { NewMonthOverrideModal } from '@/components/action/NewMonthOverrideModal';
import { ImpactExplorerCard } from '@/components/action/ImpactExplorerCard';
import { ReverseCalculatorCard } from '@/components/action/ReverseCalculatorCard';

interface TimelineMonth {
  yearMonth: string;
  monthLabel: string;
  isCurrentMonth: boolean;
  isPast: boolean;
  isFuture: boolean;
  plannedAmountCents: number;
  actualAmountCents: number;
  status: 'pending' | 'partial' | 'completed';
  gapCents: number;
  source: 'override' | 'plan';
  description?: string;
}

interface ActionPlanApiResponse {
  entries: ActionPlanEntry[];
  overrides: ActionMonthOverride[];
  activePlan: {
    plannedAmountCents: number;
    source: 'override' | 'plan';
    activeEntryId?: string;
    description?: string;
  };
  currentYearMonth: string;
  timeline: TimelineMonth[];
}

export default function AportesPage() {
  const { userId } = useUI();
  const [data, setData] = useState<ActionPlanApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState<boolean>(false);

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;
    async function fetchPlan() {
      try {
        setLoading(true);
        const res = await fetch(`/api/action-plan?userId=${encodeURIComponent(userId)}`);
        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || 'Falha ao carregar dados do plano de ação');

        if (!isCancelled) {
          setData(resJson);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Erro inesperado.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    fetchPlan();
    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger, userId]);

  const handleDeleteItem = async (id: string, type: 'entry' | 'override') => {
    if (!confirm(`Deseja realmente remover esta ${type === 'override' ? 'ação extraordinária' : 'vigência'}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/action-plan?id=${encodeURIComponent(id)}&type=${type}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Erro ao remover item.');
        return;
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      alert('Falha na requisição de exclusão.');
    }
  };

  // Aggregated calculations for top hero
  const currentPlan = data?.activePlan;
  const currentMonthEntry = data?.timeline.find((t) => t.isCurrentMonth);

  // Total planned for whole year 2026 (sum of all months in 2026 from timeline)
  const totalPlanned2026Cents = data?.timeline
    .filter((t) => t.yearMonth.startsWith('2026'))
    .reduce((acc, curr) => acc + curr.plannedAmountCents, 0) || 0;

  const totalExecutedPastCents = data?.timeline
    .filter((t) => t.isPast)
    .reduce((acc, curr) => acc + curr.actualAmountCents, 0) || 0;

  const activeEntryDetails = data?.entries.find((e) => e.id === currentPlan?.activeEntryId);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Page Title & Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F3F5FA]">
              Plano de Ação
            </h1>
            <Badge variant="brand" size="sm">
              MENSAL B3
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#A3A9BC] mt-0.5">
            Planejamento quantitativo de compras regulares, vigências, reajustes e metas de longo prazo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOverrideModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-[#22D3EE]" />
            <span>+ Ajuste Pontual</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPlanModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nova Vigência</span>
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-sm text-[#FF4D6D] flex items-center justify-between">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => setRefreshTrigger((p) => p + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <>
          {/* Top Hero KPI Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: Monthly Action Card Component */}
            <MonthlyActionCard
              yearMonth={data.currentYearMonth}
              monthName="Outubro/2026"
              plannedAmountCents={currentPlan?.plannedAmountCents || 0}
              actualAmountCents={currentMonthEntry?.actualAmountCents || 0}
              status={currentMonthEntry?.status || 'pending'}
              effectiveSince={activeEntryDetails?.effectiveFrom ? `${activeEntryDetails.effectiveFrom}` : 'Jul/2026'}
              onEditPlan={() => setIsPlanModalOpen(true)}
            />

            {/* Card 2: Cumulative Annual Target */}
            <Card variant="metric" borderAccent="none" className="p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#22D3EE]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                    Total Planejado no Ano (2026)
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  12 MESES
                </Badge>
              </div>

              <div>
                <div className="text-xs text-[#A3A9BC]">Acúmulo planejado em 2026:</div>
                <div className="text-2xl font-bold text-[#F3F5FA] font-tabular maskable">
                  {formatCurrency(totalPlanned2026Cents)}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
                <span className="text-[#A3A9BC]">Executado até o momento:</span>
                <span className="font-semibold text-[#19D98B] font-tabular">
                  {formatCurrency(totalExecutedPastCents)}
                </span>
              </div>
            </Card>

            {/* Card 3: Active Adjustment Policy */}
            <Card variant="metric" borderAccent="none" className="p-5 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#7C5CFF]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                    Política Vigente
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  REAJUSTE ANUAL
                </Badge>
              </div>

              <div>
                <div className="text-xs text-[#A3A9BC]">Mecanismo de proteção de poder de compra:</div>
                <div className="text-lg font-bold text-[#F3F5FA] mt-0.5">
                  {activeEntryDetails?.annualAdjustmentType === 'ipca'
                    ? 'IPCA Anual (Inflação Oficial)'
                    : activeEntryDetails?.annualAdjustmentType === 'fixed_pct'
                    ? `Taxa Fixa +${(activeEntryDetails.annualAdjustmentPct || 0) / 100}% a.a.`
                    : 'Sem reajuste programado'}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
                <span className="text-[#A3A9BC]">Base regular:</span>
                <span className="font-mono text-[#F3F5FA]">
                  {formatCurrency(activeEntryDetails?.baseAmountCents || 0)}/mês
                </span>
              </div>
            </Card>
          </div>

          {/* 12-Month Visual Timeline Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7C5CFF]" />
                <h2 className="text-sm sm:text-base font-bold text-[#F3F5FA]">
                  Linha do Tempo de Ações (12 Meses Rolantes)
                </h2>
              </div>
              <span className="text-xs text-[#A3A9BC] hidden sm:inline">
                Acompanhamento contínuo de regularidade e disciplina
              </span>
            </div>

            {/* Horizontal Timeline Scroll */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="flex items-stretch gap-3 min-w-[980px]">
                {data.timeline.map((month) => {
                  const isCurrent = month.isCurrentMonth;
                  const isPast = month.isPast;
                  const isOverride = month.source === 'override';

                  return (
                    <div
                      key={month.yearMonth}
                      className={`flex-1 min-w-[130px] p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-[#7C5CFF]/15 border-[#7C5CFF] shadow-[0_0_18px_rgba(124,92,255,0.25)] ring-1 ring-[#7C5CFF]'
                          : isOverride
                          ? 'bg-[#22D3EE]/10 border-[#22D3EE]/40'
                          : isPast
                          ? 'bg-white/[0.02] border-white/[0.06] opacity-80'
                          : 'bg-white/[0.03] border-white/[0.08]'
                      }`}
                    >
                      {/* Top Label */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold font-mono ${
                            isCurrent ? 'text-[#7C5CFF]' : 'text-[#F3F5FA]'
                          }`}
                        >
                          {month.monthLabel}
                        </span>
                        {isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-[#7C5CFF] animate-pulse" title="Mês Corrente" />
                        ) : isPast ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#19D98B]" />
                        ) : null}
                      </div>

                      {/* Planned Amount */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-[#A3A9BC]">Planejado:</span>
                        <span className="text-sm font-bold text-[#F3F5FA] font-tabular maskable">
                          {formatCurrency(month.plannedAmountCents)}
                        </span>
                      </div>

                      {/* Status / Override Tag */}
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
                        {isOverride ? (
                          <span className="text-[#22D3EE] font-semibold truncate" title={month.description}>
                            Extra
                          </span>
                        ) : (
                          <span className="text-[#A3A9BC]">Regular</span>
                        )}

                        <span
                          className={`font-semibold ${
                            month.status === 'completed'
                              ? 'text-[#19D98B]'
                              : isCurrent
                              ? 'text-[#F5B83D]'
                              : 'text-[#70778C]'
                          }`}
                        >
                          {month.status === 'completed' ? 'Realizado' : isCurrent ? 'Pendente' : 'Futuro'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Quant Calculators (Explorador de Impacto & Calculadora Reversa) */}
          <div className="grid grid-cols-1 gap-6">
            <ImpactExplorerCard />
            <ReverseCalculatorCard currentPlannedMonthlyCents={currentPlan?.plannedAmountCents || 250000} />
          </div>

          {/* Tables: Vigências & Ajustes Pontuais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Table 1: Vigências Cadastradas */}
            <Card variant="glass" borderAccent="brand" className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#7C5CFF]" />
                  <h3 className="text-sm font-bold text-[#F3F5FA]">
                    Vigências do Plano de Ação
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPlanModalOpen(true)}
                  className="text-xs text-[#7C5CFF]"
                >
                  + Nova Vigência
                </Button>
              </div>

              {data.entries.length === 0 ? (
                <EmptyState
                  title="Nenhuma vigência cadastrada"
                  description="Adicione a primeira vigência para guiar suas compras mensais na B3."
                  actionLabel="Criar Vigência"
                  onAction={() => setIsPlanModalOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#A3A9BC]">
                        <th className="pb-2 font-semibold">Vigência</th>
                        <th className="pb-2 font-semibold">Valor Base</th>
                        <th className="pb-2 font-semibold">Reajuste</th>
                        <th className="pb-2 font-semibold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {data.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 font-mono text-[#F3F5FA]">
                            {entry.effectiveFrom}
                          </td>
                          <td className="py-2.5 font-semibold text-[#F3F5FA] font-tabular maskable">
                            {formatCurrency(entry.baseAmountCents)}/mês
                          </td>
                          <td className="py-2.5 text-[#A3A9BC]">
                            {entry.annualAdjustmentType === 'ipca'
                              ? 'IPCA'
                              : entry.annualAdjustmentType === 'fixed_pct'
                              ? `+${(entry.annualAdjustmentPct || 0) / 100}%`
                              : 'Sem reajuste'}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteItem(entry.id, 'entry')}
                              className="p-1 text-[#A3A9BC] hover:text-[#FF4D6D] transition-colors cursor-pointer"
                              title="Remover vigência"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Table 2: Ajustes Pontuais & 13º Salário */}
            <Card variant="glass" borderAccent="none" className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                  <h3 className="text-sm font-bold text-[#F3F5FA]">
                    Ajustes Pontuais & Ações Extraordinárias
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="text-xs text-[#22D3EE]"
                >
                  + Novo Ajuste
                </Button>
              </div>

              {data.overrides.length === 0 ? (
                <EmptyState
                  title="Nenhum ajuste extraordinário"
                  description="Use para programar aportes extras de 13º salário, bônus semestral ou pausas programadas."
                  actionLabel="Criar Ajuste"
                  onAction={() => setIsOverrideModalOpen(true)}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.08] text-[#A3A9BC]">
                        <th className="pb-2 font-semibold">Mês</th>
                        <th className="pb-2 font-semibold">Valor no Mês</th>
                        <th className="pb-2 font-semibold">Descrição</th>
                        <th className="pb-2 font-semibold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {data.overrides.map((ov) => (
                        <tr key={ov.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 font-mono text-[#F3F5FA]">
                            {ov.yearMonth}
                          </td>
                          <td className="py-2.5 font-semibold text-[#22D3EE] font-tabular maskable">
                            {formatCurrency(ov.overrideAmountCents)}
                          </td>
                          <td className="py-2.5 text-[#A3A9BC]">
                            {ov.description}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => handleDeleteItem(ov.id, 'override')}
                              className="p-1 text-[#A3A9BC] hover:text-[#FF4D6D] transition-colors cursor-pointer"
                              title="Remover ajuste"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}

      {/* Modals */}
      <NewPlanEntryModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />

      <NewMonthOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSuccess={() => setRefreshTrigger((p) => p + 1)}
      />
    </div>
  );
}
