'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  PlusCircle,
  FileSpreadsheet,
  PieChart,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KPI } from '@/components/ui/KPI';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatPercent } from '@/lib/formatters';
import { useUI } from '@/lib/theme-context';
import { PortfolioPosition } from '@/domain/models/portfolio';
import { MarketQuote } from '@/lib/market-data';
import { NewTransactionModal } from '@/components/portfolio/NewTransactionModal';
import { B3ImportModal } from '@/components/portfolio/B3ImportModal';

interface EnrichedPosition extends PortfolioPosition {
  quote: MarketQuote;
  currentGrossCents: number;
  gainLossCents: number;
  gainLossPercent: number;
  weightPercent: number;
}

interface PortfolioSummary {
  totalInvestedCents: number;
  totalCurrentGrossCents: number;
  totalGainLossCents: number;
  totalGainLossPercent: number;
  positionCount: number;
  allocationByClass: Record<string, number>;
}

export default function CarteiraPage() {
  const { privacyMode } = useUI();
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [selectedTickerForAction, setSelectedTickerForAction] = useState<string>('');

  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;
    async function loadPortfolio() {
      try {
        const res = await fetch('/api/portfolio');
        const data = await res.json();
        if (!isCancelled && data.positions) {
          setPositions(data.positions);
          setSummary(data.summary);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    loadPortfolio();
    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  // Filtered positions
  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      // Tab filter
      if (activeTab === 'stock' && pos.assetType !== 'stock') return false;
      if (activeTab === 'fii' && pos.assetType !== 'fii' && pos.assetType !== 'fiagro' && pos.assetType !== 'fiinfra') return false;
      if (activeTab === 'etf' && pos.assetType !== 'etf_br') return false;
      if (activeTab === 'fixed' && pos.assetType !== 'fixed_income') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toUpperCase();
        return pos.ticker.toUpperCase().includes(query);
      }

      return true;
    });
  }, [positions, activeTab, searchQuery]);

  const handleOpenTransactionForTicker = (ticker: string) => {
    setSelectedTickerForAction(ticker);
    setIsTransactionModalOpen(true);
  };

  const handleOpenNewTransaction = () => {
    setSelectedTickerForAction('');
    setIsTransactionModalOpen(true);
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case 'stock':
        return 'Ação B3';
      case 'fii':
        return 'FII Tijolo/Papel';
      case 'fiagro':
        return 'FIAGRO';
      case 'fiinfra':
        return 'FI-Infra';
      case 'etf_br':
        return 'ETF Nacional';
      case 'fixed_income':
        return 'Renda Fixa';
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-full">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <Briefcase className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
              Minha Custódia B3
            </span>
            <span className="text-[11px] text-[#F5B83D] bg-[#F5B83D]/10 px-2 py-0.5 rounded font-medium border border-[#F5B83D]/20">
              DADOS DE EXEMPLO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F3F5FA] mt-1">
            Minha Carteira de Investimentos
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-[#22D3EE]" />}
            onClick={() => setIsImportModalOpen(true)}
          >
            Importar Extrato B3
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenNewTransaction}
          >
            Nova Ação / Transação
          </Button>
        </div>
      </div>

      {/* KPI Hero Section */}
      <section className="rounded-2xl p-5 sm:p-7 bg-white/[0.035] backdrop-blur-md border border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Gross Value */}
        <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-white/[0.08] pb-4 md:pb-0 md:pr-6">
          <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
            Patrimônio Consolidado
          </span>
          <KPI
            label=""
            valueCents={summary?.totalCurrentGrossCents || 0}
            deltaPercent={summary?.totalGainLossPercent || 0}
            deltaCents={summary?.totalGainLossCents || 0}
            deltaPeriod="total"
            size="hero"
          />
        </div>

        {/* Total Cost Basis */}
        <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-white/[0.08] pb-4 md:pb-0 md:pr-6 justify-center">
          <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
            Total Investido (Custo PM)
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#F3F5FA]">
            {formatCurrency(summary?.totalInvestedCents || 0, { privacyMode })}
          </div>
          <span className="text-xs text-[#70778C]">
            Apurado pela média ponderada da Receita Federal
          </span>
        </div>

        {/* Profitability Status */}
        <div className="flex flex-col gap-1 justify-center">
          <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
            Lucro / Prejuízo da Carteira
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono ${
                (summary?.totalGainLossCents || 0) >= 0 ? 'text-[#19D98B]' : 'text-[#FF4D6D]'
              }`}
            >
              {formatCurrency(summary?.totalGainLossCents || 0, { privacyMode, showSign: true })}
            </span>
            <Badge variant={(summary?.totalGainLossCents || 0) >= 0 ? 'gain' : 'loss'} size="sm">
              {formatPercent(summary?.totalGainLossPercent || 0, { showSign: true })}
            </Badge>
          </div>
          <span className="text-xs text-[#70778C]">
            Marcação a mercado (~30 min de atraso oficial)
          </span>
        </div>
      </section>

      {/* Asset Allocation Breakdown Banner */}
      {summary && summary.totalCurrentGrossCents > 0 && (
        <Card variant="glass" className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#7C5CFF]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                Composição por Classe de Ativos
              </span>
            </div>
            <span className="text-xs text-[#22D3EE] font-mono">100% Mercado Nacional B3</span>
          </div>

          <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/[0.06] border border-white/[0.08]">
            <div
              style={{
                width: `${((summary.allocationByClass.fixed_income || 0) / summary.totalCurrentGrossCents) * 100}%`,
              }}
              className="bg-[#19D98B] h-full"
              title="Renda Fixa"
            />
            <div
              style={{
                width: `${(((summary.allocationByClass.fii || 0) + (summary.allocationByClass.fiagro || 0) + (summary.allocationByClass.fiinfra || 0)) / summary.totalCurrentGrossCents) * 100}%`,
              }}
              className="bg-[#22D3EE] h-full"
              title="FIIs e FIAGRO"
            />
            <div
              style={{
                width: `${(((summary.allocationByClass.stock || 0) + (summary.allocationByClass.etf_br || 0)) / summary.totalCurrentGrossCents) * 100}%`,
              }}
              className="bg-[#7C5CFF] h-full"
              title="Ações e ETFs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFF]" />
              <span className="text-[#A3A9BC]">Ações B3:</span>
              <span className="font-mono font-bold text-[#F3F5FA]">
                {formatCurrency(summary.allocationByClass.stock || 0, { privacyMode, compact: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />
              <span className="text-[#A3A9BC]">FIIs / FIAGRO:</span>
              <span className="font-mono font-bold text-[#F3F5FA]">
                {formatCurrency(
                  (summary.allocationByClass.fii || 0) +
                    (summary.allocationByClass.fiagro || 0) +
                    (summary.allocationByClass.fiinfra || 0),
                  { privacyMode, compact: true }
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#19D98B]" />
              <span className="text-[#A3A9BC]">Renda Fixa:</span>
              <span className="font-mono font-bold text-[#F3F5FA]">
                {formatCurrency(summary.allocationByClass.fixed_income || 0, { privacyMode, compact: true })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5B83D]" />
              <span className="text-[#A3A9BC]">ETFs B3:</span>
              <span className="font-mono font-bold text-[#F3F5FA]">
                {formatCurrency(summary.allocationByClass.etf_br || 0, { privacyMode, compact: true })}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todos os Ativos' },
            { id: 'stock', label: 'Ações' },
            { id: 'fii', label: 'FIIs / FIAGRO' },
            { id: 'etf', label: 'ETFs B3' },
            { id: 'fixed', label: 'Renda Fixa' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#7C5CFF] text-white border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.25)]'
                  : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.05]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <Input
            placeholder="Buscar por ticker (ex: PETR4, HGLG11)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Positions Table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton variant="rect" className="h-12 w-full" />
          <Skeleton variant="rect" className="h-16 w-full" />
          <Skeleton variant="rect" className="h-16 w-full" />
          <Skeleton variant="rect" className="h-16 w-full" />
        </div>
      ) : filteredPositions.length === 0 ? (
        <EmptyState
          title="Nenhum ativo encontrado"
          description="Você ainda não possui posições cadastradas ou o filtro atual não retornou resultados."
          actionLabel="Nova Ação / Transação"
          onAction={handleOpenNewTransaction}
        />
      ) : (
        <Card variant="glass" className="overflow-hidden border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[#A3A9BC] uppercase font-semibold text-[11px] tracking-wider select-none">
                  <th className="py-3 px-4">Ativo</th>
                  <th className="py-3 px-3 text-right">Custódia</th>
                  <th className="py-3 px-3 text-right">Preço Médio (PM)</th>
                  <th className="py-3 px-3 text-right">Cotação Atual</th>
                  <th className="py-3 px-3 text-right">Total Investido</th>
                  <th className="py-3 px-3 text-right">Saldo Atual</th>
                  <th className="py-3 px-3 text-right">Lucro / Prejuízo</th>
                  <th className="py-3 px-3 text-right">Peso</th>
                  <th className="py-3 px-4 text-center">Operar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredPositions.map((pos) => {
                  const isPositive = pos.gainLossCents >= 0;
                  return (
                    <tr
                      key={pos.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Ticker & Asset Class */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.10] flex items-center justify-center font-mono font-bold text-xs text-[#F3F5FA] group-hover:border-[#7C5CFF]/50 transition-colors">
                            {pos.ticker.slice(0, 4)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold font-mono text-sm text-[#F3F5FA]">
                              {pos.ticker}
                            </span>
                            <span className="text-[11px] text-[#A3A9BC]">
                              {getAssetTypeLabel(pos.assetType)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Custody Quantity */}
                      <td className="py-3.5 px-3 text-right font-mono text-[#F3F5FA]">
                        {pos.quantity.toLocaleString('pt-BR')}
                      </td>

                      {/* Average Price (PM) */}
                      <td className="py-3.5 px-3 text-right font-mono text-[#A3A9BC]">
                        {formatCurrency(pos.averagePriceCents, { privacyMode })}
                      </td>

                      {/* Current Quote with delay indicator */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[#F3F5FA] font-semibold">
                            {formatCurrency(pos.quote.priceCents, { privacyMode })}
                          </span>
                          <span
                            className={`text-[10px] font-mono ${
                              pos.quote.changePercent >= 0 ? 'text-[#19D98B]' : 'text-[#FF4D6D]'
                            }`}
                          >
                            {formatPercent(pos.quote.changePercent, { showSign: true })}
                          </span>
                        </div>
                      </td>

                      {/* Total Invested */}
                      <td className="py-3.5 px-3 text-right font-mono text-[#A3A9BC]">
                        {formatCurrency(pos.totalInvestedCents, { privacyMode })}
                      </td>

                      {/* Current Gross Balance */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#F3F5FA]">
                        {formatCurrency(pos.currentGrossCents, { privacyMode })}
                      </td>

                      {/* Gain / Loss */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className={`font-semibold ${isPositive ? 'text-[#19D98B]' : 'text-[#FF4D6D]'}`}>
                            {formatCurrency(pos.gainLossCents, { privacyMode, showSign: true })}
                          </span>
                          <span className={`text-[10px] ${isPositive ? 'text-[#19D98B]' : 'text-[#FF4D6D]'}`}>
                            {formatPercent(pos.gainLossPercent, { showSign: true })}
                          </span>
                        </div>
                      </td>

                      {/* Weight % */}
                      <td className="py-3.5 px-3 text-right font-mono text-[#A3A9BC]">
                        {pos.weightPercent}%
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenTransactionForTicker(pos.ticker)}
                          className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-[#7C5CFF]/20 hover:border-[#7C5CFF]/50 text-xs text-[#A3A9BC] hover:text-[#F3F5FA] transition-all"
                          title={`Registrar transação para ${pos.ticker}`}
                        >
                          Ação
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <NewTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
        initialTicker={selectedTickerForAction}
      />

      <B3ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
}
