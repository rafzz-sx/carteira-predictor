// src/app/api/screener/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/market-data';
import {
  filterScreenerAssets,
  sortScreenerAssets,
  ScreenerFilters,
  SCREENER_PRESETS,
  ScreenerPresetId,
} from '@/domain/models/screener';
import { BrazilianAssetType } from '@/domain/guards/brazilian-asset-guard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const presetId = (searchParams.get('presetId') as ScreenerPresetId) || 'all';
    const preset = SCREENER_PRESETS.find((p) => p.id === presetId);

    // Merge preset filters with explicit search params
    const rawAssetClass = searchParams.get('assetClass') || preset?.filters.assetClass || 'all';
    const searchQuery = searchParams.get('q') || '';
    const minDy = searchParams.get('minDy') ? Number(searchParams.get('minDy')) : preset?.filters.minDy;
    const maxDy = searchParams.get('maxDy') ? Number(searchParams.get('maxDy')) : preset?.filters.maxDy;
    const minPl = searchParams.get('minPl') ? Number(searchParams.get('minPl')) : preset?.filters.minPl;
    const maxPl = searchParams.get('maxPl') ? Number(searchParams.get('maxPl')) : preset?.filters.maxPl;
    const minPvp = searchParams.get('minPvp') ? Number(searchParams.get('minPvp')) : preset?.filters.minPvp;
    const maxPvp = searchParams.get('maxPvp') ? Number(searchParams.get('maxPvp')) : preset?.filters.maxPvp;
    const minRoe = searchParams.get('minRoe') ? Number(searchParams.get('minRoe')) : preset?.filters.minRoe;
    const maxNetDebtEbitda = searchParams.get('maxNetDebtEbitda')
      ? Number(searchParams.get('maxNetDebtEbitda'))
      : preset?.filters.maxNetDebtEbitda;
    const maxPhysicalVacancy = searchParams.get('maxPhysicalVacancy')
      ? Number(searchParams.get('maxPhysicalVacancy'))
      : preset?.filters.maxPhysicalVacancy;

    const sortBy = (searchParams.get('sortBy') as ScreenerFilters['sortBy']) || 'liquidity';
    const sortOrder = (searchParams.get('sortOrder') as ScreenerFilters['sortOrder']) || 'desc';

    const filters: ScreenerFilters = {
      assetClass: rawAssetClass as 'all' | BrazilianAssetType,
      searchQuery,
      minDy,
      maxDy,
      minPl,
      maxPl,
      minPvp,
      maxPvp,
      minRoe,
      maxNetDebtEbitda,
      maxPhysicalVacancy,
      presetId,
      sortBy,
      sortOrder,
    };

    const allAssets = MarketDataService.getScreenerAssets();
    const filtered = filterScreenerAssets(allAssets, filters);
    const sorted = sortScreenerAssets(filtered, sortBy, sortOrder);

    return NextResponse.json({
      totalCount: sorted.length,
      allCount: allAssets.length,
      presets: SCREENER_PRESETS,
      activePresetId: presetId,
      filters,
      assets: sorted,
      delayMinutes: 30,
      isExample: true,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error in screener API:', error);
    return NextResponse.json({ error: 'Falha ao executar screener de ativos' }, { status: 500 });
  }
}
