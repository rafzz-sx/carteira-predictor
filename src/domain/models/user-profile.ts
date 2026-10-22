// src/domain/models/user-profile.ts

export type InvestorRiskProfile = 'conservador' | 'moderado' | 'arrojado' | 'agressivo';

export interface UserProfile {
  id: string; // User ID
  email: string;
  name?: string;
  riskProfile: InvestorRiskProfile;
  riskScore: number; // 0 to 100
  horizonYears: number;
  emergencyFundMonths: number;
  emergencyFundCents: number;
  monthlyExpensesCents?: number;
  monthlyNetIncomeCents?: number;
  primaryGoal?: string;
  privacyMode: boolean;
  createdAt: string;
  updatedAt: string;
}
