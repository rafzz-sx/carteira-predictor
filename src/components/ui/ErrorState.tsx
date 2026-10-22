import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message: string;
  whatToDoNext?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Não foi possível carregar as informações',
  message,
  whatToDoNext = 'Verifique sua conexão e tente novamente em instantes.',
  onRetry,
  isRetrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-2xl bg-[#FF4D6D]/[0.04] border border-[#FF4D6D]/20 gap-4',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/30 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-sm font-semibold text-[#F3F5FA]">{title}</h3>
        <p className="text-xs text-[#FF4D6D] font-medium">{message}</p>
        <p className="text-xs text-[#A3A9BC]">{whatToDoNext}</p>
      </div>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Tentar de novo
        </Button>
      )}
    </div>
  );
}
