// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/lib/repositories/repository-factory';
import { UserProfile, InvestorRiskProfile } from '@/domain/models/user-profile';

const DEFAULT_USER_ID = 'demo-user-1';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || DEFAULT_USER_ID;

    const userRepo = RepositoryFactory.getUserRepository();
    const profile = await userRepo.getProfile(userId);

    if (!profile) {
      // Default initial profile for demonstration or initial onboarding state
      const defaultProfile: UserProfile = {
        id: userId,
        email: 'investidor@carteirapredictor.com.br',
        name: 'Investidor B3',
        riskProfile: 'moderado',
        riskScore: 50,
        horizonYears: 10,
        emergencyFundMonths: 6,
        emergencyFundCents: 3000000, // R$ 30.000,00
        monthlyExpensesCents: 500000, // R$ 5.000,00
        monthlyNetIncomeCents: 1200000, // R$ 12.000,00
        primaryGoal: 'Construção de Patrimônio no Longo Prazo',
        privacyMode: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ exists: false, profile: defaultProfile });
    }

    return NextResponse.json({ exists: true, profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar perfil do investidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.id || DEFAULT_USER_ID;

    // Validate risk profile
    const validProfiles: InvestorRiskProfile[] = ['conservador', 'moderado', 'arrojado', 'agressivo'];
    if (!validProfiles.includes(body.riskProfile)) {
      return NextResponse.json(
        { error: 'Perfil de risco inválido' },
        { status: 400 }
      );
    }

    const profile: UserProfile = {
      id: userId,
      email: body.email || 'investidor@carteirapredictor.com.br',
      name: body.name || 'Investidor B3',
      riskProfile: body.riskProfile,
      riskScore: Math.min(100, Math.max(0, Number(body.riskScore) || 50)),
      horizonYears: Math.max(1, Number(body.horizonYears) || 5),
      emergencyFundMonths: Math.max(0, Number(body.emergencyFundMonths) || 6),
      emergencyFundCents: Math.max(0, Number(body.emergencyFundCents) || 0),
      monthlyExpensesCents: body.monthlyExpensesCents ? Math.max(0, Number(body.monthlyExpensesCents)) : undefined,
      monthlyNetIncomeCents: body.monthlyNetIncomeCents ? Math.max(0, Number(body.monthlyNetIncomeCents)) : undefined,
      primaryGoal: body.primaryGoal || undefined,
      privacyMode: Boolean(body.privacyMode),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userRepo = RepositoryFactory.getUserRepository();
    await userRepo.saveProfile(profile);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error saving user profile:', error);
    return NextResponse.json(
      { error: 'Falha ao salvar perfil do investidor' },
      { status: 500 }
    );
  }
}
