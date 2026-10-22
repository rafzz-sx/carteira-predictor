import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'metric' | 'subtle';
  borderAccent?: 'brand' | 'warning' | 'gain' | 'none';
  interactive?: boolean;
}

export function Card({
  className,
  variant = 'glass',
  borderAccent = 'none',
  interactive = false,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const variants = {
    glass:
      'bg-white/[0.035] backdrop-blur-md border border-white/[0.08] text-[#F3F5FA]',
    metric:
      'bg-white/[0.03] backdrop-blur-md border border-white/[0.08] text-[#F3F5FA]',
    subtle:
      'bg-white/[0.02] border border-white/[0.06] text-[#A3A9BC]',
  };

  const accents = {
    none: '',
    brand: 'border-l-4 border-l-[#7C5CFF]',
    warning: 'border-l-4 border-l-[#F5B83D]',
    gain: 'border-l-4 border-l-[#19D98B]',
  };

  const interactiveStyles = interactive
    ? 'hover:bg-white/[0.06] hover:border-white/[0.14] cursor-pointer'
    : '';

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        accents[borderAccent],
        interactiveStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
