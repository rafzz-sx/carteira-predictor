// src/components/action/NewMonthOverrideModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency, parseCurrencyToCents } from '@/lib/formatters';
import { useUI } from '@/lib/theme-context';

interface NewMonthOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewMonthOverrideModal({ isOpen, onClose, onSuccess }: NewMonthOverrideModalProps) {
  const { userId } = useUI();
  const [yearMonth, setYearMonth] = useState<string>('2026-12');
  const [amountStr, setAmountStr] = useState<string>('5000');
  const [description, setDescription] = useState<string>('13º Salário');
  const [isOneOffDeposit, setIsOneOffDeposit] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const amountCents = parseCurrencyToCents(amountStr);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      setError('Mês de referência inválido. Formato: AAAA-MM.');
      return;
    }

    if (!description.trim()) {
      setError('Informe uma descrição (ex: 13º Salário, Bônus, Férias).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'override',
          yearMonth,
          overrideAmountCents: amountCents,
          isOneOffDeposit,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar ajuste pontual.');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar ajuste.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card variant="glass" borderAccent="brand" className="w-full max-w-lg p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA]">
                Ação Extraordinária / Ajuste Pontual
              </h2>
              <p className="text-xs text-[#A3A9BC]">
                Define um valor específico para um mês específico (substitui o valor base)
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
              label="Mês do Ajuste (AAAA-MM)"
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
            />
            <Input
              label="Valor Total da Ação no Mês"
              prefixText="R$"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="5.000,00"
              helperText="Informe 0 para pausar ou o valor turbinado."
            />
          </div>

          <Input
            label="Motivo / Descrição"
            placeholder="Ex: 13º Salário, Bônus semestral, Restituição IRPF"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={isOneOffDeposit}
              onChange={(e) => setIsOneOffDeposit(e.target.checked)}
              className="accent-[#7C5CFF]"
            />
            <span className="text-[#A3A9BC]">
              Marcar como <strong>Ação Extraordinária de Provento Único</strong> (não altera a média recorrente)
            </span>
          </label>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-[#A3A9BC]">Ação planejada para {yearMonth}:</span>
            <span className="font-mono font-bold text-sm text-[#22D3EE]">
              {formatCurrency(amountCents)}
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
              {isSubmitting ? 'Salvando...' : 'Salvar Ajuste Pontual'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
