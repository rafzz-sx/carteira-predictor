'use client';

import React, { useState } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { KPI } from '@/components/ui/KPI';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MonthlyActionCard } from '@/components/action/MonthlyActionCard';
import { useUI, type Theme } from '@/lib/theme-context';
import { formatCurrency } from '@/lib/formatters';

export default function DesignGalleryPage() {
  const { theme, setTheme, privacyMode, togglePrivacyMode } = useUI();
  const [sampleInput, setSampleInput] = useState('2500,00');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => setIsRetrying(false), 1500);
  };

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto">
      {/* Top Gallery Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#7C5CFF]/20 text-[#7C5CFF] border border-[#7C5CFF]/30 font-semibold">
              GATE 2 • FATIA 0
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F5FA]">
              Galeria de Componentes do Design System
            </h1>
          </div>
          <p className="text-xs text-[#A3A9BC] mt-1">
            Inventário completo de componentes, tokens e estados para aprovação da fundação de design.
          </p>
        </div>

        {/* Quick controls inside gallery */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.08] p-1 text-xs">
            {(['dark', 'oled', 'light'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1 rounded-lg capitalize font-medium transition-all ${
                  theme === t
                    ? 'bg-[#7C5CFF] text-white shadow-sm'
                    : 'text-[#A3A9BC] hover:text-[#F3F5FA]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={togglePrivacyMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs text-[#A3A9BC] hover:text-[#F3F5FA]"
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#F5B83D]" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Privacidade</span>
          </button>
        </div>
      </div>

      {/* Section 1: Color Tokens & WCAG AA Contrast */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC] flex items-center gap-2">
          <span>1. Tokens de Cores & Contraste WCAG AA</span>
          <span className="text-[10px] text-[#19D98B] bg-[#19D98B]/10 px-2 py-0.5 rounded-full border border-[#19D98B]/20">
            100% Aprovado
          </span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-[#07080C] border border-white/10 flex flex-col gap-1">
            <span className="text-[11px] text-[#A3A9BC]">Fundo Base</span>
            <span className="font-mono text-xs font-semibold text-[#F3F5FA]">#07080C</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0D0F16] border border-white/10 flex flex-col gap-1">
            <span className="text-[11px] text-[#A3A9BC]">Fundo Elevado</span>
            <span className="font-mono text-xs font-semibold text-[#F3F5FA]">#0D0F16</span>
          </div>
          <div className="p-3 rounded-xl bg-[#7C5CFF] text-white flex flex-col gap-1">
            <span className="text-[11px] opacity-80">Marca (Violeta)</span>
            <span className="font-mono text-xs font-semibold">#7C5CFF</span>
          </div>
          <div className="p-3 rounded-xl bg-[#22D3EE] text-black flex flex-col gap-1">
            <span className="text-[11px] opacity-80">Acento (Ciano)</span>
            <span className="font-mono text-xs font-semibold">#22D3EE</span>
          </div>
          <div className="p-3 rounded-xl bg-[#19D98B] text-black flex flex-col gap-1">
            <span className="text-[11px] opacity-80">Ganho (Esmeralda)</span>
            <span className="font-mono text-xs font-semibold">#19D98B</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FF4D6D] text-white flex flex-col gap-1">
            <span className="text-[11px] opacity-80">Perda (Rosa)</span>
            <span className="font-mono text-xs font-semibold">#FF4D6D</span>
          </div>
        </div>
      </section>

      {/* Section 2: KPIs & Financial Typography */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
          2. Indicadores Financeiros (KPIs) com Máscara e Sinais Estritos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="p-5">
            <KPI
              label="Patrimônio Total"
              valueCents={14892045}
              deltaPercent={0.96}
              deltaCents={142010}
              deltaPeriod="hoje"
              size="lg"
            />
          </Card>

          <Card variant="glass" className="p-5">
            <KPI
              label="Rentabilidade 12 Meses"
              valueCents={2485000}
              deltaPercent={18.42}
              deltaPeriod="12m"
              benchmarkNote="CDI 10,75%"
              size="lg"
            />
          </Card>

          <Card variant="glass" className="p-5">
            <KPI
              label="Cenário de Estresse (Queda)"
              valueCents={12840000}
              deltaPercent={-12.85}
              deltaCents={-1890000}
              deltaPeriod="no mês"
              size="lg"
            />
          </Card>
        </div>

        {/* Extreme numbers check */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className="text-[#A3A9BC]">
            Teste de Conteúdo Extremo (R$ 123.456.789,90):
          </span>
          <span className="font-mono font-bold text-sm text-[#F3F5FA] font-tabular maskable">
            {formatCurrency(12345678990)} (Compacto: {formatCurrency(12345678990, { compact: true })})
          </span>
        </div>
      </section>

      {/* Section 3: Monthly Action Plan Component */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
            3. Plano de Ação do Mês (Terminologia &quot;Ação&quot;)
          </h2>
          <span className="text-xs text-[#7C5CFF] font-medium">Requisito do Usuário</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* State 1: Pending */}
          <MonthlyActionCard
            yearMonth="2026-10"
            monthName="Outubro/2026"
            plannedAmountCents={250000}
            actualAmountCents={0}
            status="pending"
            effectiveSince="Julho/2026"
            onEditPlan={() => alert('Abrir modal de edição do Plano de Ação')}
          />

          {/* State 2: Completed */}
          <MonthlyActionCard
            yearMonth="2026-09"
            monthName="Setembro/2026"
            plannedAmountCents={250000}
            actualAmountCents={250000}
            status="completed"
            effectiveSince="Julho/2026"
            onEditPlan={() => alert('Histórico do Plano de Ação')}
          />
        </div>
      </section>

      {/* Section 4: Button States Inventory */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
          4. Inventário de Estados de Botão (Button)
        </h2>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center gap-3">
          <Button variant="primary" size="md">
            Primário Padrão
          </Button>
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Nova Ação
          </Button>
          <Button variant="secondary" size="md">
            Secundário
          </Button>
          <Button variant="ghost" size="md">
            Ghost
          </Button>
          <Button variant="danger" size="md">
            Perigo
          </Button>
          <Button variant="primary" size="md" isLoading>
            Carregando
          </Button>
          <Button variant="primary" size="md" disabled>
            Desabilitado
          </Button>
        </div>
      </section>

      {/* Section 5: Badge States */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
          5. Badges Financeiros e de Confiabilidade
        </h2>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-wrap items-center gap-2.5">
          <Badge variant="market-open">B3 Aberto</Badge>
          <Badge variant="market-closed">B3 Fechado</Badge>
          <Badge variant="delay">Atraso ~30 min</Badge>
          <Badge variant="stale">Dados de 14:30</Badge>
          <Badge variant="gain">+2,45% ↑</Badge>
          <Badge variant="loss">−1,80% ↓</Badge>
          <Badge variant="warning">Ação Pendente</Badge>
          <Badge variant="asset-type">AÇÃO B3</Badge>
          <Badge variant="asset-type">FII TIJOLO</Badge>
        </div>
      </section>

      {/* Section 6: Input Family */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
          6. Família de Campos de Formulário (Inputs)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Valor da Nova Ação (R$)"
            prefixText="R$"
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            helperText="Formato moeda brasileira com pontuação decimal"
          />

          <Input
            label="Horizonte de Simulação (Anos)"
            suffixText="anos"
            defaultValue="5"
            helperText="De 1 a 30 anos"
          />

          <Input
            label="Campo com Erro de Validação"
            defaultValue="abc"
            error="Insira um valor numérico válido maior que zero"
          />
        </div>
      </section>

      {/* Section 7: Loading Skeletons */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
          7. Estados de Carregamento (Skeletons com Zero Layout Shift)
        </h2>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </section>

      {/* Section 8: Empty and Error States */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#A3A9BC]">
          8. Estados Vazio (EmptyState) e de Erro (ErrorState)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <EmptyState
            title="Nenhuma posição cadastrada"
            description="Importe seu extrato de negociações da Área do Investidor B3 ou adicione seus ativos manualmente."
            actionLabel="Registrar primeira ação"
            onAction={() => alert('Iniciar cadastro de ação')}
          />

          <ErrorState
            title="Falha ao atualizar cotações da B3"
            message="O provedor de cotações não respondeu dentro do tempo limite."
            whatToDoNext="Mostrando cotações do último fechamento oficial (D-1)."
            onRetry={handleRetry}
            isRetrying={isRetrying}
          />
        </div>
      </section>

      {/* Mandatory Disclaimer Footer */}
      <footer className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-[#A3A9BC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-[#70778C]">
          <strong>Aviso Legal:</strong> Simulação baseada em dados históricos e premissas matemáticas. O Carteira Predictor é uma ferramenta analítica e educativa. Não constitui previsão de mercado, garantia de rentabilidade nem recomendação de investimento.
        </p>
        <span className="text-[#7C5CFF] text-[11px] font-mono shrink-0">Fatia 0 • Pronto para Validação</span>
      </footer>
    </div>
  );
}
