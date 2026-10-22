'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Shield,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit2,
  Save,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, parseCurrencyToCents } from '@/lib/formatters';
import { useUI } from '@/lib/theme-context';
import { UserProfile, InvestorRiskProfile } from '@/domain/models/user-profile';
import { PROFILE_ALLOCATIONS, PROFILE_METADATA } from '@/domain/finance/risk-questionnaire';

export default function ProfilePage() {
  const { privacyMode } = useUI();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [actionPlanBase, setActionPlanBase] = useState<number>(250000);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit mode for financial parameters
  const [isEditingFinances, setIsEditingFinances] = useState<boolean>(false);
  const [incomeStr, setIncomeStr] = useState<string>('');
  const [expensesStr, setExpensesStr] = useState<string>('');
  const [horizonYears, setHorizonYears] = useState<number>(10);
  const [emergencyMonths, setEmergencyMonths] = useState<number>(6);

  // Fetch active profile on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setIncomeStr(data.profile.monthlyNetIncomeCents ? (data.profile.monthlyNetIncomeCents / 100).toString() : '12000');
          setExpensesStr(data.profile.monthlyExpensesCents ? (data.profile.monthlyExpensesCents / 100).toString() : '6000');
          setHorizonYears(data.profile.horizonYears || 10);
          setEmergencyMonths(data.profile.emergencyFundMonths || 6);
        }

        // Fetch action plan
        const planRes = await fetch('/api/action-plan');
        const planData = await planRes.json();
        if (planData.entries && planData.entries.length > 0) {
          setActionPlanBase(planData.entries[0].baseAmountCents);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveFinances = async () => {
    if (!profile) return;
    setSaving(true);
    setSuccessMessage(null);

    try {
      const expensesCents = parseCurrencyToCents(expensesStr);
      const incomeCents = parseCurrencyToCents(incomeStr);
      const emergencyCents = expensesCents * emergencyMonths;

      const updatedProfile: UserProfile = {
        ...profile,
        monthlyExpensesCents: expensesCents,
        monthlyNetIncomeCents: incomeCents,
        horizonYears,
        emergencyFundMonths: emergencyMonths,
        emergencyFundCents: emergencyCents,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (!res.ok) throw new Error('Falha ao atualizar parâmetros.');

      setProfile(updatedProfile);
      setIsEditingFinances(false);
      setSuccessMessage('Parâmetros financeiros atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar parâmetros.');
    } finally {
      setSaving(false);
    }
  };

  const handleManualProfileChange = async (newProfile: InvestorRiskProfile) => {
    if (!profile) return;
    setSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        riskProfile: newProfile,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (res.ok) {
        setProfile(updatedProfile);
        setSuccessMessage(`Perfil alterado manualmente para ${PROFILE_METADATA[newProfile].label}.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 flex flex-col gap-6">
        <Skeleton variant="rect" className="h-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Skeleton variant="rect" className="h-64" />
          <Skeleton variant="rect" className="h-64" />
        </div>
      </div>
    );
  }

  const currentAllocation = PROFILE_ALLOCATIONS[profile.riskProfile];
  const meta = PROFILE_METADATA[profile.riskProfile];
  const calculatedEmergencyCents = (profile.monthlyExpensesCents || 600000) * (profile.emergencyFundMonths || 6);

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <UserCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Configurações de Estratégia
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F3F5FA] mt-1">
            Perfil do Investidor B3
          </h1>
        </div>

        <Link href="/onboarding">
          <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="w-4 h-4" />}>
            Refazer Questionário
          </Button>
        </Link>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#19D98B]/10 border border-[#19D98B]/30 text-xs text-[#19D98B] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Profile & Risk Gauge Card */}
      <Card variant="glass" borderAccent="brand" className="p-6 sm:p-7 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
                Perfil de Risco Vigente
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#F3F5FA] font-mono">
                  {meta.label.toUpperCase()}
                </h2>
                <Badge variant="brand" size="sm">
                  Score {profile.riskScore}/100
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['conservador', 'moderado', 'arrojado', 'agressivo'] as InvestorRiskProfile[]).map((p) => (
              <button
                key={p}
                onClick={() => handleManualProfileChange(p)}
                disabled={saving}
                className={`px-3 py-1.5 rounded-xl border text-xs capitalize font-medium transition-all ${
                  profile.riskProfile === p
                    ? 'bg-[#7C5CFF] text-white border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                    : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Risk meter */}
        <div className="flex flex-col gap-2">
          <div className="w-full h-3 rounded-full bg-white/[0.08] relative overflow-hidden flex">
            <div className="h-full bg-[#19D98B] w-1/4" title="Conservador (0-25)" />
            <div className="h-full bg-[#22D3EE] w-3/10" title="Moderado (26-55)" />
            <div className="h-full bg-[#7C5CFF] w-1/4" title="Arrojado (56-80)" />
            <div className="h-full bg-[#FF4D6D] w-1/5" title="Agressivo (81-100)" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#70778C]">
            <span>Conservador (0-25)</span>
            <span>Moderado (26-55)</span>
            <span>Arrojado (56-80)</span>
            <span>Agressivo (81-100)</span>
          </div>
        </div>

        {/* Profile Summary */}
        <p className="text-xs sm:text-sm text-[#A3A9BC] leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/[0.06]">
          {meta.summary}
        </p>

        {/* Target Allocation Grid */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Alocação Alvo Sugerida pela Estratégia
            </span>
            <span className="text-xs text-[#22D3EE] font-mono">100% Brasil B3</span>
          </div>

          <div className="w-full h-3.5 rounded-xl overflow-hidden flex bg-white/[0.06] border border-white/[0.08]">
            <div style={{ width: `${currentAllocation.fixedIncomePct}%` }} className="bg-[#19D98B] h-full" />
            <div style={{ width: `${currentAllocation.fiisPct}%` }} className="bg-[#22D3EE] h-full" />
            <div style={{ width: `${currentAllocation.equitiesPct}%` }} className="bg-[#7C5CFF] h-full" />
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <span className="text-[#19D98B] font-mono font-bold text-base">
                {currentAllocation.fixedIncomePct}%
              </span>
              <span className="text-[#A3A9BC] text-xs">Renda Fixa</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <span className="text-[#22D3EE] font-mono font-bold text-base">
                {currentAllocation.fiisPct}%
              </span>
              <span className="text-[#A3A9BC] text-xs">FIIs / FIAGRO</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col">
              <span className="text-[#7C5CFF] font-mono font-bold text-base">
                {currentAllocation.equitiesPct}%
              </span>
              <span className="text-[#A3A9BC] text-xs">Ações B3</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Financial Foundation & Active Action Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Financial Foundation & Emergency Fund */}
        <Card variant="glass" className="p-6 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#22D3EE]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Fundação & Reserva de Emergência
              </h2>
            </div>
            <button
              onClick={() => setIsEditingFinances(!isEditingFinances)}
              className="text-xs text-[#7C5CFF] hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingFinances ? 'Cancelar' : 'Editar'}</span>
            </button>
          </div>

          {isEditingFinances ? (
            <div className="flex flex-col gap-3">
              <Input
                label="Renda Líquida Mensal"
                prefixText="R$"
                value={incomeStr}
                onChange={(e) => setIncomeStr(e.target.value)}
              />
              <Input
                label="Custo de Vida Mensal"
                prefixText="R$"
                value={expensesStr}
                onChange={(e) => setExpensesStr(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#A3A9BC]">
                  Meses de Reserva Recomendada
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEmergencyMonths(m)}
                      className={`p-2 rounded-lg border text-xs font-mono ${
                        emergencyMonths === m
                          ? 'bg-[#7C5CFF] text-white border-[#7C5CFF]'
                          : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC]'
                      }`}
                    >
                      {m} meses
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveFinances}
                disabled={saving}
                className="mt-2"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-[#A3A9BC]">Meta da Reserva ({profile.emergencyFundMonths} meses)</span>
                <span className="font-mono font-bold text-sm text-[#22D3EE]">
                  {formatCurrency(calculatedEmergencyCents, { privacyMode })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-[#A3A9BC]">Custo de Vida Mensal</span>
                <span className="font-mono text-xs text-[#F3F5FA]">
                  {formatCurrency(profile.monthlyExpensesCents || 0, { privacyMode })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-[#A3A9BC]">Renda Líquida Declarada</span>
                <span className="font-mono text-xs text-[#F3F5FA]">
                  {formatCurrency(profile.monthlyNetIncomeCents || 0, { privacyMode })}
                </span>
              </div>
            </div>
          )}

          <div className="text-[11px] text-[#70778C] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
            <span>Mantenha sua reserva em instrumentos de liquidez D+0 (Tesouro Selic ou CDB DI).</span>
          </div>
        </Card>

        {/* Card 2: Plano de Ação Vigente */}
        <Card variant="glass" className="p-6 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#7C5CFF]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Plano de Ação Mensal Vigente
              </h2>
            </div>
            <Link href="/aportes" className="text-xs text-[#7C5CFF] hover:underline flex items-center gap-1">
              <span>Gerenciar Plano</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#A3A9BC]">Ação Base Mensal</span>
                <div className="text-xl font-bold font-mono text-[#F3F5FA]">
                  {formatCurrency(actionPlanBase, { privacyMode })}
                </div>
              </div>
              <Badge variant="brand" size="sm">
                Vigente
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs text-[#A3A9BC]">Horizonte de Investimento</span>
              <span className="font-mono text-xs text-[#F3F5FA] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#7C5CFF]" />
                {profile.horizonYears} anos
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs text-[#A3A9BC]">Objetivo Principal</span>
              <span className="text-xs text-[#F3F5FA] truncate max-w-[200px]" title={profile.primaryGoal}>
                {profile.primaryGoal || 'Construção de Patrimônio'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-[#70778C]">
            Você pode ajustar o valor, programar aumentos anuais ou incluir meses especiais (ex: 13º salário) na aba{' '}
            <Link href="/aportes" className="text-[#7C5CFF] hover:underline">
              Plano de Ação
            </Link>.
          </div>
        </Card>
      </div>

      {/* Transparency & Methodology Box */}
      <Card variant="glass" className="p-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#A3A9BC]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
            Como Calculamos Seu Perfil de Risco
          </h3>
        </div>
        <p className="text-xs text-[#A3A9BC] leading-relaxed">
          Nosso modelo quantitativo pondera 5 dimensões estratégicas: capacidade de absorção de perdas (peso 25%),
          horizonte temporal (peso 20%), objetivo de rentabilidade (peso 20%), tolerância declarada a oscilações anuais (peso 20%)
          e experiência de mercado na B3 (peso 15%). Projeções são simulações estatísticas e não constituem garantia de rentabilidade futura.
        </p>
      </Card>
    </div>
  );
}
