// src/components/action/NewPlanEntryModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Target,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AnnualAdjustmentType } from '@/domain/models/action-plan';
import { formatCurrency, parseCurrencyToCents } from '@/lib/formatters';

interface NewPlanEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPlanEntryModal({ isOpen, onClose, onSuccess }: NewPlanEntryModalProps) {
  const [effectiveFrom, setEffectiveFrom] = useState<string>('2026-11');
  const [amountStr, setAmountStr] = useState<string>('3000');
  const [adjustmentType, setAdjustmentType] = useState<AnnualAdjustmentType>('ipca');
  const [fixedPctStr, setFixedPctStr] = useState<string>('5');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const amountCents = parseCurrencyToCents(amountStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountCents <= 0) {
      setError('O valor base da Ação mensal deve ser maior que zero.');
      return;
    }

    if (!effectiveFrom || !/^\d{4}-\d{2}$/.test(effectiveFrom)) {
      setError('Data de vigência inválida. Use o formato AAAA-MM (ex: 2026-11).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectiveFrom,
          baseAmountCents: amountCents,
          annualAdjustmentType: adjustmentType,
          annualAdjustmentPct: adjustmentType === 'fixed_pct' ? Math.round(parseFloat(fixedPctStr) * 100) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar novo plano.');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar vigência.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card variant="glass" borderAccent="brand" className="w-full max-w-lg p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA]">
                Nova Vigência de Plano de Ação
              </h2>
              <p className="text-xs text-[#A3A9BC]">
                Define uma nova base mensal para compras regulares na B3
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A3A9BC] hover:text-[#F3F5FA] hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vigência a Partir de (AAAA-MM)"
              type="month"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              helperText="Ex: 2026-11 (Novembro/2026)"
            />
            <Input
              label="Valor Base Mensal"
              prefixText="R$"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="3.000,00"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#A3A9BC]">
              Política de Reajuste Anual
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ipca', label: 'IPCA (Inflação)' },
                { id: 'fixed_pct', label: 'Percentual Fixo' },
                { id: 'none', label: 'Sem Reajuste' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAdjustmentType(opt.id as AnnualAdjustmentType)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    adjustmentType === opt.id
                      ? 'bg-[#7C5CFF] text-white border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.25)]'
                      : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {adjustmentType === 'fixed_pct' && (
            <Input
              label="Percentual de Aumento Anual (%)"
              suffixText="% a.a."
              value={fixedPctStr}
              onChange={(e) => setFixedPctStr(e.target.value)}
              placeholder="5"
              helperText="Aumento percentual aplicado anualmente no mês de aniversário."
            />
          )}

          <Input
            label="Notas / Motivo da Alteração (Opcional)"
            placeholder="Ex: Aumento salarial, promoção, redução de dívida"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Nova Ação mensal planejada:</span>
            <span className="font-mono font-bold text-sm text-[#F3F5FA]">
              {formatCurrency(amountCents)}/mês
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-xs text-[#FF4D6D]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Vigência'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
