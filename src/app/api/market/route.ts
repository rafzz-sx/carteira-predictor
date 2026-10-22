// src/app/api/market/route.ts
import { NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data';

export async function GET() {
  try {
    const macro = MarketDataService.getMacroIndicators();
    const indices = MarketDataService.getMajorIndices();
    const movers = MarketDataService.getTopMovers();

    return NextResponse.json({
      session: {
        isOpen: true,
        market: 'B3 - Brasil, Bolsa, Balcão',
        time: '17:05:00',
        timezone: 'America/Sao_Paulo (UTC-3)',
        quoteDelayMinutes: 30,
        notice: 'Cotações com atraso regulamentar de ~30 min. Dados marcados como DADOS DE EXEMPLO.',
      },
      macro,
      indices,
      topMovers: movers,
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json({ error: 'Falha ao buscar dados de mercado B3' }, { status: 500 });
  }
}
