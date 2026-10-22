import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatPercent } from '@/lib/formatters';

export interface KPIProps {
  label: string;
  valueCents: number;
  deltaPercent?: number;
  deltaCents?: number;
  deltaPeriod?: string;
  benchmarkNote?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export function KPI({
  label,
  valueCents,
  deltaPercent,
  deltaCents,
  deltaPeriod = 'hoje',
  benchmarkNote,
  size = 'md',
  className,
}: KPIProps) {
  const isPositive = (deltaPercent !== undefined && deltaPercent > 0) || (deltaCents !== undefined && deltaCents > 0);
  const isNegative = (deltaPercent !== undefined && deltaPercent < 0) || (deltaCents !== undefined && deltaCents < 0);

  const sizeClasses = {
    sm: 'text-lg font-bold',
    md: 'text-2xl font-bold',
    lg: 'text-3xl font-bold',
    hero: 'text-3xl sm:text-5xl font-bold tracking-tight',
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-xs uppercase tracking-wider text-[#A3A9BC] font-semibold">
        {label}
      </span>

      <div className="flex items-baseline gap-3 flex-wrap">
        <div className={cn('text-[#F3F5FA] font-tabular maskable', sizeClasses[size])}>
          {formatCurrency(valueCents)}
        </div>

        {(deltaPercent !== undefined || deltaCents !== undefined) && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-semibold font-tabular',
              isPositive && 'text-[#19D98B]',
              isNegative && 'text-[#FF4D6D]',
              !isPositive && !isNegative && 'text-[#A3A9BC]'
            )}
            title={`Variação ${deltaPeriod}`}
          >
            {isPositive && <ArrowUp className="w-3.5 h-3.5 shrink-0" />}
            {isNegative && <ArrowDown className="w-3.5 h-3.5 shrink-0" />}
            
            <span>
              {deltaCents !== undefined && `${formatCurrency(deltaCents, { showSign: true })} `}
              {deltaPercent !== undefined && `(${formatPercent(deltaPercent, { showSign: true })})`}
            </span>

            {deltaPeriod && (
              <span className="text-[11px] text-[#A3A9BC] font-normal ml-0.5">
                {deltaPeriod}
              </span>
            )}

            {benchmarkNote && (
              <span className="text-[11px] text-[#70778C] font-normal ml-1">
                | {benchmarkNote}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
