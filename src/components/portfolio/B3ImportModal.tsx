// src/components/portfolio/B3ImportModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { parseB3Statement, B3ImportResult } from '@/domain/finance/b3-importer';
import { formatCurrency } from '@/lib/formatters';
import { useUI } from '@/lib/theme-context';

interface B3ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_B3_CSV = `Data do Negócio;Tipo de Movimentação;Mercado;Prazo/Vencimento;Código de Negociação;Especificação do Ativo;Quantidade;Preço (R$);Valor Total (R$)
15/07/2026;Compra;Mercado à Vista;;PETR4;PETROBRAS PN;100;36,50;3.650,00
18/07/2026;Compra;Mercado à Vista;;HGLG11;CSHG LOGISTICA FII;50;162,30;8.115,00
22/07/2026;Compra;Mercado à Vista;;VALE3;VALE ON;100;61,40;6.140,00
05/08/2026;Compra;Mercado à Vista;;AAPL34;APPLE INC BDR;10;60,00;600,00
12/08/2026;Compra;Mercado à Vista;;IVVB11;ISHARES S&P 500;15;320,00;4.800,00
20/08/2026;Compra;Mercado à Vista;;KNCR11;KINEA RENDIMENTOS FII;60;102,80;6.168,00
25/08/2026;Compra;Mercado à Vista;;BOVA11;ISHARES IBOVESPA;40;124,50;4.980,00`;

export function B3ImportModal({ isOpen, onClose, onSuccess }: B3ImportModalProps) {
  const { userId } = useUI();
  const [csvText, setCsvText] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<B3ImportResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParsePreview = (text: string) => {
    setCsvText(text);
    setErrorMessage(null);
    if (!text.trim()) {
      setPreviewResult(null);
      return;
    }
    const result = parseB3Statement(text);
    setPreviewResult(result);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleParsePreview(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleParsePreview(SAMPLE_B3_CSV);
  };

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.transactions.length === 0) {
      setErrorMessage('Nenhuma transação válida identificada para importação.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/portfolio/import-b3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          portfolioId: `port_${userId}`,
          csvContent: csvText,
          dryRun: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao importar transações.');
      }

      setImportSuccess(
        `${data.importedCount} transações importadas com sucesso! ${
          data.ignoredCount > 0 ? `(${data.ignoredCount} ativos internacionais/BDRs ignorados pelo regulamento)` : ''
        }`
      );

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao processar importação.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <Card variant="glass" borderAccent="brand" className="w-full max-w-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#F3F5FA]">
                Importar Extrato B3 (Área do Investidor / CEI)
              </h2>
              <p className="text-xs text-[#A3A9BC]">
                Lê arquivos CSV/Excel de negociação e proventos com validação automática
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

        {importSuccess ? (
          <div className="p-6 rounded-xl bg-[#19D98B]/10 border border-[#19D98B]/30 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#19D98B]" />
            <span className="font-semibold text-sm text-[#19D98B]">{importSuccess}</span>
            <span className="text-xs text-[#A3A9BC]">Atualizando sua carteira...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Input methods */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[#A3A9BC]">
                Cole o conteúdo do CSV ou envie o arquivo
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />}
                  onClick={handleLoadSample}
                >
                  Carregar Exemplo B3
                </Button>

                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.09] text-xs font-medium text-[#F3F5FA] transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    Upload .CSV
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Textarea */}
            <textarea
              rows={5}
              placeholder="Data do Negócio;Tipo de Movimentação;Mercado;...&#10;15/07/2026;Compra;Mercado à Vista;;PETR4;...;100;36,50;3.650,00"
              value={csvText}
              onChange={(e) => handleParsePreview(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-xs font-mono text-[#F3F5FA] placeholder-[#70778C] outline-none focus:border-[#7C5CFF] resize-none"
            />

            {/* Preview Box */}
            {previewResult && (
              <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A9BC]">
                    Diagnóstico do Arquivo
                  </span>
                  <Badge variant="asset-type" size="sm">
                    {previewResult.transactions.length} Operações Identificadas
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col">
                    <span className="text-xs text-[#A3A9BC]">Volume Financeiro</span>
                    <span className="font-mono font-bold text-sm text-[#F3F5FA]">
                      {formatCurrency(previewResult.totalVolumeCents)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col">
                    <span className="text-xs text-[#A3A9BC]">Ativos Distintos</span>
                    <span className="font-mono font-bold text-sm text-[#7C5CFF]">
                      {previewResult.uniqueTickers.join(', ') || 'Nenhum'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex flex-col sm:col-span-1 col-span-2">
                    <span className="text-xs text-[#A3A9BC]">Ativos Bloqueados</span>
                    <span className={`font-mono font-bold text-sm ${previewResult.ignoredAssets.length > 0 ? 'text-[#F5B83D]' : 'text-[#19D98B]'}`}>
                      {previewResult.ignoredAssets.length} ignorados
                    </span>
                  </div>
                </div>

                {/* Warning for ignored BDRs/Foreign ETFs */}
                {previewResult.ignoredAssets.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#F5B83D]/10 border border-[#F5B83D]/25 flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-[#F5B83D]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{previewResult.ignoredAssets.length} ativo(s) filtrado(s) pelo regulamento nacional</span>
                    </div>
                    <ul className="text-[11px] text-[#A3A9BC] list-disc list-inside">
                      {previewResult.ignoredAssets.map((ign, idx) => (
                        <li key={idx}>
                          <strong className="text-[#F3F5FA] font-mono">{ign.ticker}</strong>: {ign.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-[#FF4D6D]/10 border border-[#FF4D6D]/30 text-xs text-[#FF4D6D]">
                {errorMessage}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleConfirmImport}
                disabled={isSubmitting || !previewResult || previewResult.transactions.length === 0}
              >
                {isSubmitting ? 'Importando...' : 'Confirmar e Importar para Carteira'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
