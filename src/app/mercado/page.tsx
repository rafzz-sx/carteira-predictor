// src/app/mercado/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  Coins,
  Clock,
  Filter,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/formatters';
import { MacroIndicator, B3IndexQuote } from '@/lib/market-data';
import { ScreenerAsset } from '@/domain/models/screener';

interface MarketDataResponse {
  session: {
    isOpen: boolean;
    market: string;
    time: string;
    timezone: string;
    quoteDelayMinutes: number;
    notice: string;
  };
  macro: MacroIndicator[];
  indices: B3IndexQuote[];
  topMovers: {
    topGainers: ScreenerAsset[];
    topLosers: ScreenerAsset[];
    topDividends: ScreenerAsset[];
  };
}

export default function MercadoPage() {
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadMarket() {
      try {
        setLoading(true);
        const res = await fetch('/api/market');
        const resJson = await res.json();
        if (!res.ok) throw new Error(resJson.error || 'Falha ao buscar dados de mercado.');

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
    loadMarket();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#F3F5FA]">
              Mercado B3
            </h1>
            <Badge variant="market-open" size="sm">
              PREGÃO ABERTO
            </Badge>
            <Badge variant="delay" size="sm">
              ATRASO ~30 MIN
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#A3A9BC] mt-0.5">
            Visão panorâmica dos índices brasileiros, taxas macroeconômicas oficiais e destaques do pregão
          </p>
        </div>

        <Link href="/screener">
          <Button variant="primary" size="sm" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span>Abrir Screener B3</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {loading && !data ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-sm text-[#FF4D6D]">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Trading Session Status Banner */}
          <Card variant="glass" borderAccent="gain" className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#19D98B]/15 border border-[#19D98B]/30 text-[#19D98B]">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#F3F5FA]">
                    Sessão Regular B3 em Andamento
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#19D98B] animate-ping" />
                </div>
                <div className="text-xs text-[#A3A9BC] mt-0.5">
                  Horário de negociação: 10:00 às 17:00 (Brasília UTC-3) • Cotações com atraso regulamentar de ~30 minutos
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono self-start md:self-auto bg-black/40 px-3.5 py-2 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[#A3A9BC]">
                <Clock className="w-3.5 h-3.5 text-[#7C5CFF]" />
                <span>Última sinc: {data.session.time}</span>
              </div>
              <span className="text-white/20">|</span>
              <span className="text-[#19D98B] font-semibold">100% Mercado Nacional</span>
            </div>
          </Card>

          {/* Macro BR Panel (5 Macro Cards) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A3A9BC] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#7C5CFF]" />
                Indicadores Macroeconômicos Oficiais (Brasil)
              </span>
              <span className="text-[11px] text-[#70778C]">Banco Central & IBGE</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {data.macro.map((m) => (
                <Card
                  key={m.id}
                  variant="metric"
                  borderAccent="none"
                  className="p-3.5 flex flex-col justify-between gap-2 hover:border-white/[0.15] transition-all"
                >
                  <div className="text-[11px] font-medium text-[#A3A9BC] truncate" title={m.name}>
                    {m.name}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-[#F3F5FA] font-tabular">
                    {m.value}
                  </div>
                  <div className="text-[10px] text-[#70778C] truncate" title={m.period}>
                    {m.period}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Major B3 Indices (IBOV, IFIX, IDIV, SMLL, IMA-B) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#A3A9BC] uppercase tracking-wider flex items-center gap-1.5">
                <LineChart className="w-3.5 h-3.5 text-[#22D3EE]" />
                Principais Índices da B3
              </span>
              <span className="text-[11px] text-[#70778C]">Cotações com delay ~30 min</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.indices.map((idx) => {
                const isGain = idx.changePercent >= 0;
                return (
                  <Card
                    key={idx.symbol}
                    variant="glass"
                    borderAccent={isGain ? 'gain' : 'warning'}
                    className="p-4 flex flex-col justify-between gap-3 hover:scale-[1.01] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F3F5FA] font-mono">
                        {idx.symbol}
                      </span>
                      <Badge variant={isGain ? 'gain' : 'loss'} size="sm">
                        {isGain ? `+${idx.changePercent.toFixed(2)}%` : `${idx.changePercent.toFixed(2)}%`}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-[11px] text-[#A3A9BC] truncate" title={idx.name}>
                        {idx.name}
                      </div>
                      <div className="text-lg font-black text-[#F3F5FA] font-tabular mt-0.5">
                        {idx.points.toLocaleString('pt-BR')} <span className="text-xs font-normal text-[#A3A9BC]">pts</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#70778C] font-mono">
                      <span>Mín: {idx.low52w.toLocaleString('pt-BR')}</span>
                      <span>Máx: {idx.high52w.toLocaleString('pt-BR')}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* 3-Column Highlights Cockpit: Maiores Altas, Maiores Baixas, Maiores Dividend Yields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {/* Column 1: Top Gainers */}
            <Card variant="glass" borderAccent="gain" className="p-4 sm:p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#19D98B]/15 text-[#19D98B]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#F3F5FA]">
                      Maiores Altas B3
                    </h3>
                    <span className="text-[10px] text-[#A3A9BC]">Sessão de hoje</span>
                  </div>
                </div>
                <Badge variant="gain" size="sm">
                  EM ALTA
                </Badge>
              </div>

              <div className="flex flex-col divide-y divide-white/[0.04]">
                {data.topMovers.topGainers.map((asset) => (
                  <div key={asset.ticker} className="py-2.5 flex items-center justify-between hover:bg-white/[0.02] px-1 rounded-lg transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#F3F5FA]">
                          {asset.ticker}
                        </span>
                        <span className="text-[10px] text-[#70778C] font-sans truncate max-w-[100px]">
                          {asset.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A3A9BC] font-tabular">
                        {formatCurrency(asset.priceCents)}
                      </div>
                    </div>

                    <span className="font-mono font-bold text-xs text-[#19D98B] bg-[#19D98B]/10 px-2 py-0.5 rounded-md">
                      +{asset.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Column 2: Top Losers */}
            <Card variant="glass" borderAccent="none" className="p-4 sm:p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#FF4D6D]/15 text-[#FF4D6D]">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#F3F5FA]">
                      Maiores Baixas B3
                    </h3>
                    <span className="text-[10px] text-[#A3A9BC]">Sessão de hoje</span>
                  </div>
                </div>
                <Badge variant="loss" size="sm">
                  EM QUEDA
                </Badge>
              </div>

              <div className="flex flex-col divide-y divide-white/[0.04]">
                {data.topMovers.topLosers.map((asset) => (
                  <div key={asset.ticker} className="py-2.5 flex items-center justify-between hover:bg-white/[0.02] px-1 rounded-lg transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#F3F5FA]">
                          {asset.ticker}
                        </span>
                        <span className="text-[10px] text-[#70778C] font-sans truncate max-w-[100px]">
                          {asset.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A3A9BC] font-tabular">
                        {formatCurrency(asset.priceCents)}
                      </div>
                    </div>

                    <span className="font-mono font-bold text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 px-2 py-0.5 rounded-md">
                      {asset.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Column 3: Top Dividend Yields */}
            <Card variant="glass" borderAccent="brand" className="p-4 sm:p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#7C5CFF]/15 text-[#7C5CFF]">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#F3F5FA]">
                      Maiores Dividend Yields
                    </h3>
                    <span className="text-[10px] text-[#A3A9BC]">Últimos 12 meses</span>
                  </div>
                </div>
                <Badge variant="brand" size="sm">
                  PROVENTOS
                </Badge>
              </div>

              <div className="flex flex-col divide-y divide-white/[0.04]">
                {data.topMovers.topDividends.map((asset) => (
                  <div key={asset.ticker} className="py-2.5 flex items-center justify-between hover:bg-white/[0.02] px-1 rounded-lg transition-colors">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#F3F5FA]">
                          {asset.ticker}
                        </span>
                        <span className="text-[10px] text-[#70778C] font-sans truncate max-w-[100px]">
                          {asset.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A3A9BC] font-tabular">
                        {formatCurrency(asset.priceCents)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-0.5 rounded-md">
                        {asset.dividendYieldPct.toFixed(1)}% a.a.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Rule 0 Honest Disclaimer Card */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs text-[#70778C]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7C5CFF] shrink-0" />
              <span>
                Regra 0 de Honestidade: Cotações oficiais B3 com atraso de ~30 min. Dados marcados como <strong>DADOS DE EXEMPLO</strong> para validação de protótipo quantitativo. Esta ferramenta não constitui recomendação de investimento.
              </span>
            </div>
            <Link href="/como-calculamos" className="text-[#7C5CFF] hover:underline font-medium shrink-0 ml-4 hidden sm:inline">
              Metodologia & Dados
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
