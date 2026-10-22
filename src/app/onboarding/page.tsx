'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shield,
  TrendingUp,
  Wallet,
  Clock,
  AlertTriangle,
  Sparkles,
  Zap,
  Edit3,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatCurrency, parseCurrencyToCents } from '@/lib/formatters';
import {
  calculateRiskScore,
  RISK_QUESTIONS,
  PROFILE_ALLOCATIONS,
  PROFILE_METADATA,
} from '@/domain/finance/risk-questionnaire';
import { InvestorRiskProfile } from '@/domain/models/user-profile';
import { AnnualAdjustmentType } from '@/domain/models/action-plan';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1: Capital & Personal Finance
  const [initialCapitalStr, setInitialCapitalStr] = useState<string>('50000');
  const [monthlyIncomeStr, setMonthlyIncomeStr] = useState<string>('12000');
  const [monthlyExpensesStr, setMonthlyExpensesStr] = useState<string>('6000');

  // Step 2: Goal & Horizon
  const [primaryGoal, setPrimaryGoal] = useState<string>('Construção de Patrimônio no Longo Prazo');
  const [horizonYears, setHorizonYears] = useState<number>(10);

  // Step 3: Monthly Action Plan
  const [monthlyActionStr, setMonthlyActionStr] = useState<string>('2500');
  const [adjustmentType, setAdjustmentType] = useState<AnnualAdjustmentType>('ipca');
  const [preferredDay, setPreferredDay] = useState<number>(5);

  // Step 4: Scenario-based Risk Questionnaire
  const [answers, setAnswers] = useState<Record<string, string>>({
    primary_goal: 'goal_balanced_growth',
    investment_horizon: 'horizon_long',
    market_drop_reaction: 'drop_buy_more',
    b3_experience: 'exp_advanced',
    volatility_tolerance: 'vol_medium',
  });

  // Step 5: Manual Override Modal / State
  const [manualOverrideProfile, setManualOverrideProfile] = useState<InvestorRiskProfile | null>(null);
  const [showOverridePicker, setShowOverridePicker] = useState<boolean>(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic calculation of risk profile
  const evaluation = calculateRiskScore(answers);
  const activeProfile: InvestorRiskProfile = manualOverrideProfile || evaluation.profile;
  const activeAllocation = PROFILE_ALLOCATIONS[activeProfile];
  const activeMeta = PROFILE_METADATA[activeProfile];

  // Derived financial values
  const expensesCents = parseCurrencyToCents(monthlyExpensesStr);
  const recommendedEmergencyCents = expensesCents * 6; // 6 months of living expenses

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const cap = parseCurrencyToCents(initialCapitalStr);
      if (cap < 0) {
        newErrors.initialCapital = 'O valor inicial não pode ser negativo.';
      }
    }

    if (step === 3) {
      const act = parseCurrencyToCents(monthlyActionStr);
      if (act <= 0) {
        newErrors.monthlyAction = 'Informe um valor para sua Ação mensal planejada (ex: R$ 500,00).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const userId = 'demo-user-1';
      const initialCapitalCents = parseCurrencyToCents(initialCapitalStr);
      const monthlyIncomeCents = parseCurrencyToCents(monthlyIncomeStr);
      const monthlyExpensesCents = parseCurrencyToCents(monthlyExpensesStr);
      const baseActionCents = parseCurrencyToCents(monthlyActionStr);

      // 1. Save User Profile via API
      const profileRes = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email: 'investidor@carteirapredictor.com.br',
          name: 'Investidor B3',
          riskProfile: activeProfile,
          riskScore: evaluation.score,
          horizonYears,
          emergencyFundMonths: 6,
          emergencyFundCents: recommendedEmergencyCents,
          monthlyExpensesCents,
          monthlyNetIncomeCents: monthlyIncomeCents,
          primaryGoal,
          privacyMode: false,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Falha ao salvar dados de perfil.');
      }

      // 2. Initialize First Action Plan Entry via API
      const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const actionRes = await fetch('/api/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          effectiveFrom: currentYearMonth,
          baseAmountCents: baseActionCents,
          annualAdjustmentType: adjustmentType,
          annualAdjustmentPct: adjustmentType === 'fixed_pct' ? 500 : undefined,
          notes: `Plano inicial configurado no onboarding. Dia preferido: ${preferredDay}. Capital inicial: ${formatCurrency(initialCapitalCents)}.`,
        }),
      });

      if (!actionRes.ok) {
        throw new Error('Falha ao inicializar o Plano de Ação.');
      }

      // 3. Success -> redirect to cockpit
      router.push('/');
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : 'Erro ao processar onboarding.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 flex flex-col gap-8">
      {/* Top Header & Progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30">
              CONFIGURAÇÃO INICIAL
            </span>
            <span className="text-xs text-[#A3A9BC]">Passo {currentStep} de 5</span>
          </div>
          <span className="text-xs font-mono text-[#A3A9BC]">
            {Math.round((currentStep / 5) * 100)}% concluído
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#7C5CFF] to-[#22D3EE] transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Contents */}
      {currentStep === 1 && (
        <Card variant="glass" className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
                Patrimônio & Finanças Pessoais
              </h1>
              <p className="text-xs sm:text-sm text-[#A3A9BC] mt-1 leading-relaxed">
                Informe sua base financeira atual. Seus dados ficam protegidos e nunca são compartilhados.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="sm:col-span-2">
              <Input
                label="Patrimônio Total Disponível para Investir"
                prefixText="R$"
                value={initialCapitalStr}
                onChange={(e) => setInitialCapitalStr(e.target.value)}
                helperText="Total que você já possui em Tesouro, CDBs, FIIs ou Ações (ou que planeja iniciar)."
                error={errors.initialCapital}
                placeholder="50.000,00"
              />
            </div>

            <Input
              label="Renda Líquida Mensal Aproximada"
              prefixText="R$"
              value={monthlyIncomeStr}
              onChange={(e) => setMonthlyIncomeStr(e.target.value)}
              helperText="Soma de salário líquido, pró-labore e proventos habituais."
              placeholder="12.000,00"
            />

            <Input
              label="Custo de Vida Mensal Médio"
              prefixText="R$"
              value={monthlyExpensesStr}
              onChange={(e) => setMonthlyExpensesStr(e.target.value)}
              helperText="Gastos fixos essenciais (moradia, saúde, alimentação, etc.)."
              placeholder="6.000,00"
            />
          </div>

          {/* Emergency Fund Helper Callout */}
          <div className="p-4 rounded-xl bg-[#22D3EE]/5 border border-[#22D3EE]/20 flex items-start gap-3 text-xs">
            <Shield className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[#22D3EE]">
                Cálculo Automático de Reserva de Emergência
              </span>
              <p className="text-[#A3A9BC] leading-relaxed">
                Com base no seu custo de vida de{' '}
                <strong className="text-[#F3F5FA] font-mono">{formatCurrency(expensesCents)}/mês</strong>,
                sua reserva recomendada de 6 meses é de{' '}
                <strong className="text-[#22D3EE] font-mono">{formatCurrency(recommendedEmergencyCents)}</strong>{' '}
                em ativos de liquidez imediata (ex: Tesouro Selic ou CDB DI 100%).
              </p>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card variant="glass" className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
                Objetivo & Horizonte Temporal
              </h1>
              <p className="text-xs sm:text-sm text-[#A3A9BC] mt-1 leading-relaxed">
                Qual é a finalidade principal do seu capital na B3 e Renda Fixa?
              </p>
            </div>
          </div>

          {/* Goal selection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {[
              {
                id: 'Preservação de Capital e Reserva',
                title: 'Preservação de Capital',
                desc: 'Foco total em segurança, proteção contra a inflação e liquidez sem oscilações bruscas.',
                icon: Shield,
              },
              {
                id: 'Renda Passiva Mensal com Dividendos',
                title: 'Renda Mensal com Dividendos',
                desc: 'Construir fluxo contínuo e crescente de proventos isentos de FIIs e dividendos de empresas.',
                icon: Wallet,
              },
              {
                id: 'Construção de Patrimônio no Longo Prazo',
                title: 'Construção Equilibrada',
                desc: 'Valorização de capital combinada com reinvestimento contínuo de proventos para efeito bola de neve.',
                icon: TrendingUp,
              },
              {
                id: 'Multiplicação Acelerada de Capital',
                title: 'Multiplicação de Capital',
                desc: 'Buscar retornos superiores na B3 aceitando maiores oscilações e ciclos adversos.',
                icon: Zap,
              },
            ].map((item) => {
              const isSelected = primaryGoal === item.id;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => setPrimaryGoal(item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-[#7C5CFF]/15 border-[#7C5CFF] shadow-[0_0_15px_rgba(124,92,255,0.2)]'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#7C5CFF]' : 'text-[#A3A9BC]'}`} />
                      <span className="font-semibold text-sm text-[#F3F5FA]">{item.title}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#7C5CFF]" />}
                  </div>
                  <p className="text-xs text-[#A3A9BC] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Horizon Selection */}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#7C5CFF]" />
              <label className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Horizonte de Investimento
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Curto (< 2 anos)', years: 2 },
                { label: 'Médio (2 a 5 anos)', years: 5 },
                { label: 'Longo (5 a 10 anos)', years: 10 },
                { label: 'Muito Longo (> 10 anos)', years: 20 },
              ].map((opt) => {
                const isSelected = horizonYears === opt.years;
                return (
                  <button
                    key={opt.years}
                    type="button"
                    onClick={() => setHorizonYears(opt.years)}
                    className={`p-3 rounded-xl border text-center text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#7C5CFF] text-white border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                        : 'bg-white/[0.03] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.06]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card variant="glass" className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
                Plano de Ação Mensal Inicial
              </h1>
              <p className="text-xs sm:text-sm text-[#A3A9BC] mt-1 leading-relaxed">
                Defina o valor e as preferências para suas <strong>Ações</strong> mensais regulares na B3.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="sm:col-span-2">
              <Input
                label="Capacidade Mensal de Ação Planejada"
                prefixText="R$"
                value={monthlyActionStr}
                onChange={(e) => setMonthlyActionStr(e.target.value)}
                helperText="Valor que você direcionará todo mês para novas compras (ex: R$ 2.500,00)."
                error={errors.monthlyAction}
                placeholder="2.500,00"
              />
            </div>

            {/* Adjustment Type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#A3A9BC]">
                Reajuste Anual do Plano de Ação
              </label>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'ipca', label: 'Reajuste pela Inflação (IPCA)', desc: 'Preserva o poder de compra da sua Ação.' },
                  { id: 'fixed_pct', label: 'Aumento Fixo de 5% ao ano', desc: 'Acompanha o crescimento esperado da sua renda.' },
                  { id: 'none', label: 'Sem reajuste automático', desc: 'Mantém o valor nominal fixo até que você altere.' },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => setAdjustmentType(item.id as AnnualAdjustmentType)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      adjustmentType === item.id
                        ? 'bg-[#7C5CFF]/15 border-[#7C5CFF]'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="adjustmentType"
                      checked={adjustmentType === item.id}
                      onChange={() => setAdjustmentType(item.id as AnnualAdjustmentType)}
                      className="mt-1 accent-[#7C5CFF]"
                    />
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-[#F3F5FA]">{item.label}</span>
                      <span className="text-[#A3A9BC] text-[11px]">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Day of the Month */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#A3A9BC]">
                Dia Preferido no Mês para Executar a Ação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { day: 5, label: 'Dia 05' },
                  { day: 10, label: 'Dia 10' },
                  { day: 20, label: 'Dia 20' },
                ].map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setPreferredDay(d.day)}
                    className={`p-3 rounded-xl border text-center text-xs font-mono transition-all ${
                      preferredDay === d.day
                        ? 'bg-[#7C5CFF] text-white border-[#7C5CFF]'
                        : 'bg-white/[0.03] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#70778C] mt-1">
                O assistente notificará as melhores oportunidades de compra da B3 próximas ao dia selecionado.
              </p>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 4 && (
        <div className="flex flex-col gap-5">
          <Card variant="glass" className="p-6 sm:p-8 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
                  Cenários Reais & Tolerância a Risco B3
                </h1>
                <p className="text-xs sm:text-sm text-[#A3A9BC] mt-1 leading-relaxed">
                  Perguntas objetivas de reação emocional e técnica a quedas reais de mercado.
                </p>
              </div>
            </div>
          </Card>

          {/* Render Questionnaire Questions */}
          {RISK_QUESTIONS.slice(2).map((q, idx) => (
            <Card key={q.id} variant="glass" className="p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="asset-type" size="sm">
                    Questão {idx + 1}
                  </Badge>
                  <h2 className="text-sm sm:text-base font-bold text-[#F3F5FA]">{q.title}</h2>
                </div>
                <p className="text-xs text-[#A3A9BC]">{q.subtitle}</p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionSelect(q.id, opt.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-[#7C5CFF]/15 border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.18)]'
                          : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.18] hover:bg-white/[0.05]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(q.id, opt.id)}
                        className="mt-1 accent-[#7C5CFF]"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs sm:text-sm font-semibold text-[#F3F5FA]">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="text-xs text-[#A3A9BC] leading-relaxed">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {currentStep === 5 && (
        <div className="flex flex-col gap-6">
          {/* Result Card */}
          <Card variant="glass" borderAccent="brand" className="p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#7C5CFF]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
                    Diagnóstico Quantitativo Concluído
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3F5FA] font-mono">
                      {activeMeta.label.toUpperCase()}
                    </h1>
                    {manualOverrideProfile && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#F5B83D]/15 text-[#F5B83D] border border-[#F5B83D]/30">
                        Ajuste Manual
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="flex flex-col sm:items-end">
                <span className="text-xs text-[#A3A9BC]">Score Quantitativo de Risco</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[#7C5CFF] font-mono">
                    {evaluation.score}
                  </span>
                  <span className="text-xs text-[#70778C] font-mono">/ 100</span>
                </div>
              </div>
            </div>

            {/* Score Range Gauge */}
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

            {/* Summary Explanation */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-[#A3A9BC] leading-relaxed">
              <strong className="text-[#F3F5FA]">Síntese do Perfil: </strong>
              {activeMeta.summary}
            </div>

            {/* Decision Factors */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Por que você recebeu esta recomendação?
              </span>
              <ul className="grid grid-cols-1 gap-2 text-xs text-[#A3A9BC]">
                {evaluation.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#19D98B] shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Target Allocation Bar */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                  Alocação Alvo Sugerida
                </span>
                <span className="text-xs text-[#22D3EE] font-mono">100% Mercado Nacional B3</span>
              </div>

              {/* Allocation bar */}
              <div className="w-full h-4 rounded-xl overflow-hidden flex bg-white/[0.06] border border-white/[0.08]">
                <div
                  style={{ width: `${activeAllocation.fixedIncomePct}%` }}
                  className="bg-[#19D98B] h-full"
                  title={`Renda Fixa: ${activeAllocation.fixedIncomePct}%`}
                />
                <div
                  style={{ width: `${activeAllocation.fiisPct}%` }}
                  className="bg-[#22D3EE] h-full"
                  title={`FIIs / FIAGRO: ${activeAllocation.fiisPct}%`}
                />
                <div
                  style={{ width: `${activeAllocation.equitiesPct}%` }}
                  className="bg-[#7C5CFF] h-full"
                  title={`Ações B3: ${activeAllocation.equitiesPct}%`}
                />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col">
                  <span className="text-[#19D98B] font-mono font-bold text-sm">
                    {activeAllocation.fixedIncomePct}%
                  </span>
                  <span className="text-[#A3A9BC] text-[11px]">Renda Fixa</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col">
                  <span className="text-[#22D3EE] font-mono font-bold text-sm">
                    {activeAllocation.fiisPct}%
                  </span>
                  <span className="text-[#A3A9BC] text-[11px]">FIIs / FIAGRO</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col">
                  <span className="text-[#7C5CFF] font-mono font-bold text-sm">
                    {activeAllocation.equitiesPct}%
                  </span>
                  <span className="text-[#A3A9BC] text-[11px]">Ações B3</span>
                </div>
              </div>

              <p className="text-xs text-[#70778C] leading-relaxed">
                {activeAllocation.description}
              </p>
            </div>

            {/* Manual Override Action */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowOverridePicker(!showOverridePicker)}
                className="text-xs text-[#7C5CFF] hover:text-[#7C5CFF]/80 flex items-center gap-1.5 self-start font-medium"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {showOverridePicker ? 'Fechar ajuste manual' : 'Desejo alterar meu perfil manualmente'}
                </span>
              </button>

              {showOverridePicker && (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-[#7C5CFF]/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#F5B83D]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Atenção: A alteração manual prevalecerá sobre as respostas do questionário.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['conservador', 'moderado', 'arrojado', 'agressivo'] as InvestorRiskProfile[]).map(
                      (p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setManualOverrideProfile(p)}
                          className={`p-2.5 rounded-xl border text-xs capitalize font-medium transition-all ${
                            activeProfile === p
                              ? 'bg-[#7C5CFF] text-white border-[#7C5CFF]'
                              : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA]'
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-xs text-[#FF4D6D]">
                {submitError}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {currentStep > 1 ? (
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handlePrev}
            disabled={isSubmitting}
          >
            Voltar
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <Button
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={handleNext}
          >
            Avançar
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            rightIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handleFinishOnboarding}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando Perfil...' : 'Salvar e Abrir Cockpit'}
          </Button>
        )}
      </div>
    </div>
  );
}
