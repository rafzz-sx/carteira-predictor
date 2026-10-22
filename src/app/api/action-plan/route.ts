// src/app/api/action-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import {
  ActionPlanEntry,
  ActionMonthOverride,
  AnnualAdjustmentType,
  resolveMonthlyActionPlan,
} from '@/domain/models/action-plan';

export const dynamic = 'force-dynamic';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;
    const actionRepo = RepositoryFactory.getActionPlanRepository();

    const entries = await actionRepo.listPlanEntries(userId);
    const overrides = await actionRepo.listOverrides(userId);

    const currentYearMonth = '2026-10'; // October 2026 current anchor
    const activePlan = resolveMonthlyActionPlan(currentYearMonth, entries, overrides);

    // Build 12-month rolling timeline (6 months back, current, 5 months ahead)
    // 2026-05 to 2027-04
    const timeline = [];
    const monthsNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
    ];

    const [anchorYear, anchorMonth] = currentYearMonth.split('-').map(Number);

    for (let offset = -5; offset <= 6; offset++) {
      const d = new Date(anchorYear, anchorMonth - 1 + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const ym = `${y}-${m}`;
      const monthLabel = `${monthsNames[d.getMonth()]}/${y}`;

      const resolved = resolveMonthlyActionPlan(ym, entries, overrides);

      // Check simulated actuals for past months
      let actualCents = 0;
      let status: 'pending' | 'partial' | 'completed' = 'pending';

      if (ym < currentYearMonth) {
        // Past months: simulated completed
        actualCents = resolved.plannedAmountCents;
        status = 'completed';
      } else if (ym === currentYearMonth) {
        // Current month: pending action
        actualCents = 0;
        status = 'pending';
      } else {
        // Future months: pending
        actualCents = 0;
        status = 'pending';
      }

      timeline.push({
        yearMonth: ym,
        monthLabel,
        isCurrentMonth: ym === currentYearMonth,
        isPast: ym < currentYearMonth,
        isFuture: ym > currentYearMonth,
        plannedAmountCents: resolved.plannedAmountCents,
        actualAmountCents: actualCents,
        status,
        gapCents: actualCents - resolved.plannedAmountCents,
        source: resolved.source,
        description: resolved.description,
      });
    }

    return NextResponse.json({
      entries,
      overrides,
      activePlan,
      currentYearMonth,
      timeline,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error('Error fetching action plan:', error);
    return NextResponse.json({ error: 'Falha ao buscar plano de ação' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || DEFAULT_USER_ID;
    const actionRepo = RepositoryFactory.getActionPlanRepository();

    if (body.type === 'override') {
      const override: ActionMonthOverride = {
        id: body.id || `override_${userId}_${body.yearMonth}`,
        userId,
        yearMonth: body.yearMonth,
        overrideAmountCents: Math.max(0, Number(body.overrideAmountCents) || 0),
        isOneOffDeposit: Boolean(body.isOneOffDeposit),
        description: body.description || 'Ajuste pontual',
      };
      await actionRepo.saveOverride(override);
      return NextResponse.json({ success: true, override });
    }

    // Default: Save plan entry
    const validAdjustments: AnnualAdjustmentType[] = ['none', 'fixed_pct', 'ipca'];
    const adjustmentType: AnnualAdjustmentType = validAdjustments.includes(body.annualAdjustmentType)
      ? body.annualAdjustmentType
      : 'none';

    const entry: ActionPlanEntry = {
      id: body.id || `plan_${userId}_${Date.now()}`,
      userId,
      effectiveFrom: body.effectiveFrom || '2026-10',
      baseAmountCents: Math.max(0, Number(body.baseAmountCents) || 0),
      annualAdjustmentType: adjustmentType,
      annualAdjustmentPct: body.annualAdjustmentPct ? Number(body.annualAdjustmentPct) : undefined,
      endDate: body.endDate || undefined,
      notes: body.notes || undefined,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await actionRepo.savePlanEntry(entry);

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error saving action plan:', error);
    return NextResponse.json({ error: 'Falha ao salvar plano de ação' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'entry'; // 'entry' or 'override'

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const actionRepo = RepositoryFactory.getActionPlanRepository();
    if (type === 'override') {
      await actionRepo.deleteOverride(id);
    } else {
      await actionRepo.deletePlanEntry(id);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting action plan item:', error);
    return NextResponse.json({ error: 'Falha ao remover item' }, { status: 500 });
  }
}
