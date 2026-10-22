// src/app/screener/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/formatters';
import {
  ScreenerAsset,
  ScreenerPresetId,
  SCREENER_PRESETS,
  filterScreenerAssets,
  sortScreenerAssets,
} from '@/domain/models/screener';
import { BrazilianAssetType } from '@/domain/guards/brazilian-asset-guard';
import { NewTransactionModal } from '@/components/portfolio/NewTransactionModal';

export default function ScreenerPage() {
  const [assets, setAssets] = useState<ScreenerAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [activePreset, setActivePreset] = useState<ScreenerPresetId>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Advanced numeric filters
  const [minDy, setMinDy] = useState<string>('');
  const [maxPl, setMaxPl] = useState<string>('');
  const [maxPvp, setMaxPvp] = useState<string>('');
  const [minRoe, setMinRoe] = useState<string>('');

  // Sort state
  const [sortBy, setSortBy] = useState<'dy' | 'pl' | 'pvp' | 'roe' | 'liquidity' | 'ticker'>('liquidity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [selectedTickerForBuy, setSelectedTickerForBuy] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/screener');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Falha ao carregar ativos.');

        if (!isCancelled) {
          setAssets(json.assets || []);
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
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Preset selection
  const handleSelectPreset = (presetId: ScreenerPresetId) => {
    setActivePreset(presetId);
    const p = SCREENER_PRESETS.find((pr) => pr.id === presetId);
    if (!p) return;

    if (p.filters.assetClass) {
      setSelectedClass(p.filters.assetClass);
    } else {
      setSelectedClass('all');
    }

    setMinDy(p.filters.minDy !== undefined ? p.filters.minDy.toString() : '');
    setMaxPl(p.filters.maxPl !== undefined ? p.filters.maxPl.toString() : '');
    setMaxPvp(p.filters.maxPvp !== undefined ? p.filters.maxPvp.toString() : '');
    setMinRoe(p.filters.minRoe !== undefined ? p.filters.minRoe.toString() : '');
  };

  const handleResetFilters = () => {
    setActivePreset('all');
    setSearchQuery('');
    setSelectedClass('all');
    setMinDy('');
    setMaxPl('');
    setMaxPvp('');
    setMinRoe('');
    setSortBy('liquidity');
    setSortOrder('desc');
  };

  // Filter and sort assets
  const filteredAndSortedAssets = useMemo(() => {
    const filters = {
      assetClass: selectedClass as 'all' | BrazilianAssetType,
      searchQuery: searchQuery.trim(),
      minDy: minDy ? Number(minDy) : undefined,
      maxPl: maxPl ? Number(maxPl) : undefined,
      maxPvp: maxPvp ? Number(maxPvp) : undefined,
      minRoe: minRoe ? Number(minRoe) : undefined,
    };

    const filtered = filterScreenerAssets(assets, filters);
    return sortScreenerAssets(filtered, sortBy, sortOrder);
  }, [assets, selectedClass, searchQuery, minDy, maxPl, maxPvp, minRoe, sortBy, sortOrder]);

  const handleSort = (field: 'dy' | 'pl' | 'pvp' | 'roe' | 'liquidity' | 'ticker') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleOpenBuy = (ticker: string) => {
    setSelectedTickerForBuy(ticker);
    setIsBuyModalOpen(true);
  };

  const getAssetClassBadge = (assetClass: BrazilianAssetType) => {
    switch (assetClass) {
      case 'stock':
        return <Badge variant="brand" size="sm">AÇÃO</Badge>;
      case 'fii':
        return <Badge variant="neutral" size="sm">FII</Badge>;
      case 'fiagro':
        return <Badge variant="neutral" size="sm">FIAGRO</Badge>;
      case 'fiinfra':
        return <Badge variant="neutral" size="sm">FI-INFRA</Badge>;
      case 'etf_br':
        return <Badge variant="neutral" size="sm">ETF B3</Badge>;
      default:
        return <Badge variant="neutral" size="sm">ATIVO</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F3F5FA]">
              Screener de Oportunidades B3
            </h1>
            <Badge variant="brand" size="sm">
              100% ATIVOS BRASILEIROS
            </Badge>
            <Badge variant="delay" size="sm">
              ATRASO ~30 MIN
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#A3A9BC] mt-0.5">
            Varredura quantitativa e fundamentalista de ações, FIIs, FIAGRO e ETFs nacionais
          </p>
        </div>

        <div className="text-xs text-[#A3A9BC] bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.06] flex items-center gap-2 self-start sm:self-auto font-mono">
          <ShieldCheck className="w-4 h-4 text-[#19D98B]" />
          <span>Guarda B3 Ativa: Bloqueio estrito de BDRs e Cripto</span>
        </div>
      </div>

      {/* Preset Strategy Chips Bar */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#A3A9BC] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
          Estratégias Quantitativas Prontas:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {SCREENER_PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#7C5CFF] text-white shadow-[0_0_15px_rgba(124,92,255,0.35)] scale-[1.02]'
                    : 'bg-white/[0.03] border border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.06]'
                }`}
              >
                <span>{p.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-white/[0.06] text-[#A3A9BC]'
                  }`}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Search Card */}
      <Card variant="glass" borderAccent="none" className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Main Row: Search, Class Tabs, Advanced Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#A3A9BC] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ticker, nome ou setor (ex: BBAS3, Galpões, Petróleo)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-[#F3F5FA] placeholder-[#70778C] focus:outline-none focus:border-[#7C5CFF] transition-all"
            />
          </div>

          {/* Class Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'stock', label: 'Ações' },
              { id: 'fii', label: 'FIIs' },
              { id: 'fiagro', label: 'FIAGRO' },
              { id: 'fiinfra', label: 'FI-Infra' },
              { id: 'etf_br', label: 'ETFs B3' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedClass(tab.id)}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                  selectedClass === tab.id
                    ? 'bg-white/[0.12] text-[#F3F5FA] font-bold border border-white/[0.15]'
                    : 'text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Advanced toggle & Reset */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Ocultar Filtros' : 'Filtros Avançados'}</span>
            </Button>

            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.06] transition-colors"
              title="Redefinir filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="pt-3 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in duration-200">
            <Input
              label="DY Mínimo (% a.a.)"
              suffixText="%"
              placeholder="Ex: 6"
              value={minDy}
              onChange={(e) => setMinDy(e.target.value)}
            />
            <Input
              label="P/L Máximo (Ações)"
              suffixText="x"
              placeholder="Ex: 10"
              value={maxPl}
              onChange={(e) => setMaxPl(e.target.value)}
            />
            <Input
              label="P/VP Máximo"
              suffixText="x"
              placeholder="Ex: 1.0"
              value={maxPvp}
              onChange={(e) => setMaxPvp(e.target.value)}
            />
            <Input
              label="ROE Mínimo (%)"
              suffixText="%"
              placeholder="Ex: 15"
              value={minRoe}
              onChange={(e) => setMinRoe(e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-[#A3A9BC] px-1">
        <span>
          Exibindo <strong>{filteredAndSortedAssets.length}</strong> de {assets.length} ativos brasileiros
        </span>
        <span className="font-mono">
          Ordenado por:{' '}
          <strong className="text-[#F3F5FA] uppercase">
            {sortBy} ({sortOrder})
          </strong>
        </span>
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-sm text-[#FF4D6D]">
          {error}
        </div>
      ) : filteredAndSortedAssets.length === 0 ? (
        <EmptyState
          title="Nenhum ativo encontrado com estes critérios"
          description="Tente relaxar os filtros quantitativos ou selecione a estratégia 'Todos os Ativos'."
          actionLabel="Redefinir Filtros"
          onAction={handleResetFilters}
        />
      ) : (
        <Card variant="glass" borderAccent="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#A3A9BC] bg-white/[0.02]">
                  <th
                    className="p-3.5 font-semibold cursor-pointer hover:text-[#F3F5FA]"
                    onClick={() => handleSort('ticker')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Ativo B3</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5 font-semibold">Setor / Segmento</th>
                  <th className="p-3.5 font-semibold">Cotação Atual</th>
                  <th
                    className="p-3.5 font-semibold cursor-pointer hover:text-[#F3F5FA]"
                    onClick={() => handleSort('dy')}
                  >
                    <div className="flex items-center gap-1">
                      <span>DY 12m</span>
                      <ArrowUpDown className="w-3 h-3 text-[#7C5CFF]" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 font-semibold cursor-pointer hover:text-[#F3F5FA]"
                    onClick={() => handleSort('pvp')}
                  >
                    <div className="flex items-center gap-1">
                      <span>P/VP</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 font-semibold cursor-pointer hover:text-[#F3F5FA]"
                    onClick={() => handleSort('pl')}
                  >
                    <div className="flex items-center gap-1">
                      <span>P/L</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 font-semibold cursor-pointer hover:text-[#F3F5FA]"
                    onClick={() => handleSort('roe')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ROE / Vac.</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 font-semibold text-right cursor-pointer hover:text-[#F3F5FA]"
                    onClick={() => handleSort('liquidity')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Liq. Diária</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3.5 font-semibold text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredAndSortedAssets.map((asset) => {
                  const isGain = asset.changePercent >= 0;
                  return (
                    <tr
                      key={asset.ticker}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Ticker & Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#F3F5FA]">
                            {asset.ticker}
                          </span>
                          {getAssetClassBadge(asset.assetClass)}
                        </div>
                        <div className="text-[11px] text-[#70778C] truncate max-w-[150px]">
                          {asset.name}
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="p-3.5 text-[#A3A9BC]">
                        <div>{asset.sector}</div>
                        {asset.segment && (
                          <div className="text-[10px] text-[#70778C]">{asset.segment}</div>
                        )}
                      </td>

                      {/* Price & Change */}
                      <td className="p-3.5 font-tabular">
                        <div className="font-bold text-[#F3F5FA]">
                          {formatCurrency(asset.priceCents)}
                        </div>
                        <div
                          className={`text-[10px] font-mono font-semibold ${
                            isGain ? 'text-[#19D98B]' : 'text-[#FF4D6D]'
                          }`}
                        >
                          {isGain ? `+${asset.changePercent.toFixed(2)}%` : `${asset.changePercent.toFixed(2)}%`}
                        </div>
                      </td>

                      {/* Dividend Yield */}
                      <td className="p-3.5 font-tabular">
                        <span
                          className={`font-mono font-bold ${
                            asset.dividendYieldPct >= 8.0
                              ? 'text-[#19D98B]'
                              : asset.dividendYieldPct >= 5.0
                              ? 'text-[#7C5CFF]'
                              : 'text-[#A3A9BC]'
                          }`}
                        >
                          {asset.dividendYieldPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* P/VP */}
                      <td className="p-3.5 font-tabular font-mono">
                        <span
                          className={
                            asset.pvp < 1.0
                              ? 'text-[#19D98B] font-semibold'
                              : asset.pvp <= 1.5
                              ? 'text-[#F3F5FA]'
                              : 'text-[#A3A9BC]'
                          }
                        >
                          {asset.pvp.toFixed(2)}x
                        </span>
                      </td>

                      {/* P/L */}
                      <td className="p-3.5 font-tabular font-mono text-[#A3A9BC]">
                        {asset.pl !== undefined ? (
                          <span className={asset.pl < 8.0 ? 'text-[#19D98B] font-semibold' : ''}>
                            {asset.pl.toFixed(1)}x
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* ROE or Vacancy */}
                      <td className="p-3.5 font-tabular font-mono">
                        {asset.roePct !== undefined ? (
                          <span
                            className={
                              asset.roePct >= 20.0
                                ? 'text-[#19D98B] font-semibold'
                                : 'text-[#F3F5FA]'
                            }
                          >
                            ROE {asset.roePct.toFixed(1)}%
                          </span>
                        ) : asset.physicalVacancyPct !== undefined ? (
                          <span className="text-[#A3A9BC]">
                            Vac. {asset.physicalVacancyPct.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Liquidity */}
                      <td className="p-3.5 font-tabular text-right text-[#A3A9BC]">
                        {formatCurrency(asset.dailyLiquidityCents, { compact: true })}/dia
                      </td>

                      {/* CTA Action */}
                      <td className="p-3.5 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenBuy(asset.ticker)}
                          className="text-xs text-[#7C5CFF] hover:bg-[#7C5CFF]/15 px-2.5 py-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" />
                          <span>Comprar</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Transaction Modal (Buy) */}
      <NewTransactionModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onSuccess={() => setIsBuyModalOpen(false)}
        initialTicker={selectedTickerForBuy}
      />
    </div>
  );
}
