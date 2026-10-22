// src/components/portfolio/NewTransactionModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BrazilianAssetGuard } from '@/domain/guards/brazilian-asset-guard';
import { TransactionType } from '@/domain/models/transaction';
import { formatCurrency, parseCurrencyToCents } from '@/lib/formatters';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTicker?: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialTicker = '',
}: NewTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('buy');
  const [ticker, setTicker] = useState<string>(initialTicker);
  const [tradeDate, setTradeDate] = useState<string>('2026-10-21');
  const [quantityStr, setQuantityStr] = useState<string>('100');
  const [unitPriceStr, setUnitPriceStr] = useState<string>('35.50');
  const [costsStr, setCostsStr] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time Brazilian Asset Guard check
  const cleanTicker = ticker.trim().toUpperCase();
  const guardResult = cleanTicker ? BrazilianAssetGuard.validate(cleanTicker) : null;

  // Math calculation preview
  const qty = parseFloat(quantityStr.replace(',', '.')) || 0;
  const unitPriceCents = parseCurrencyToCents(unitPriceStr);
  const costsCents = parseCurrencyToCents(costsStr);
  const grossCents = Math.round(qty * unitPriceCents);
  const totalAmountCents = type === 'buy' ? grossCents + costsCents : grossCents - costsCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!guardResult || !guardResult.isAllowed) {
      setSubmitError(guardResult?.rejectionReason || 'Ticker inválido ou não permitido na B3.');
      return;
    }

    if (qty <= 0) {
      setSubmitError('A quantidade deve ser maior que zero.');
      return;
    }

    if (unitPriceCents <= 0) {
      setSubmitError('O preço unitário deve ser maior que zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: cleanTicker,
          type,
          tradeDate,
          quantity: qty,
          unitPriceCents,
          totalCostsCents: costsCents,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar transação.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Falha ao salvar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card variant="glass" borderAccent="brand" className="w-full max-w-lg p-6 flex flex-col gap-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7C5CFF]/15 border border-[#7C5CFF]/30 text-[#7C5CFF]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA]">
                Registrar Nova Ação / Transação
              </h2>
              <p className="text-xs text-[#A3A9BC]">
                Atualiza custódia e Preço Médio (PM) pelas regras da Receita Federal
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
          {/* Operation Type Switcher */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#A3A9BC]">Tipo de Operação</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'buy', label: 'Compra' },
                { id: 'sell', label: 'Venda' },
                { id: 'dividend', label: 'Provento' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id as TransactionType)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    type === opt.id
                      ? 'bg-[#7C5CFF] text-white border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.3)]'
                      : 'bg-white/[0.02] border-white/[0.08] text-[#A3A9BC] hover:text-[#F3F5FA]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticker Input with Real-time Brazilian Asset Guard */}
          <div className="flex flex-col gap-1.5">
            <Input
              label="Código do Ativo (Ticker B3)"
              placeholder="Ex: PETR4, HGLG11, BOVA11"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              helperText="Permitidos apenas Ações, FIIs, FIAGRO, FI-Infra, ETFs nacionais e Renda Fixa."
            />

            {/* Live Guard Feedback */}
            {cleanTicker && guardResult && (
              <div className="mt-1">
                {guardResult.isAllowed ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#19D98B] bg-[#19D98B]/10 p-2 rounded-lg border border-[#19D98B]/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      Ativo nacional autorizado: <strong>{cleanTicker}</strong> (Tipo: {guardResult.assetType})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-[#FF4D6D] bg-[#FF4D6D]/10 p-2.5 rounded-lg border border-[#FF4D6D]/30">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{guardResult.rejectionReason}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Data do Pregão"
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
            />
            <Input
              label="Quantidade"
              type="number"
              step="any"
              min="0"
              placeholder="100"
              value={quantityStr}
              onChange={(e) => setQuantityStr(e.target.value)}
            />
          </div>

          {/* Price & Costs */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço Unitário"
              prefixText="R$"
              placeholder="35,50"
              value={unitPriceStr}
              onChange={(e) => setUnitPriceStr(e.target.value)}
            />
            <Input
              label="Taxas e Corretagem B3"
              prefixText="R$"
              placeholder="0,00"
              value={costsStr}
              onChange={(e) => setCostsStr(e.target.value)}
              helperText="Emolumentos e liquidação"
            />
          </div>

          {/* Notes */}
          <Input
            label="Notas / Estratégia (Opcional)"
            placeholder="Ex: Ação regular do mês, rebalanceamento"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Total Calculation Card */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-between">
            <span className="text-xs text-[#A3A9BC]">Valor Financeiro Total da Transação:</span>
            <span className="text-base font-bold font-mono text-[#F3F5FA]">
              {formatCurrency(totalAmountCents)}
            </span>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-xs text-[#FF4D6D]">
              {submitError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || (Boolean(cleanTicker) && !guardResult?.isAllowed)}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
