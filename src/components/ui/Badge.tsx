import React from 'react';
import { ArrowUp, ArrowDown, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'brand'
    | 'market-open'
    | 'market-closed'
    | 'delay'
    | 'stale'
    | 'gain'
    | 'loss'
    | 'warning'
    | 'asset-type'
    | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full select-none';

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-[11px] gap-1.5',
  };

  const variants = {
    brand: 'bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30 font-medium',
    'market-open': 'bg-[#19D98B]/15 text-[#19D98B] border border-[#19D98B]/25',
    'market-closed': 'bg-white/10 text-[#A3A9BC] border border-white/15',
    delay: 'bg-white/[0.04] text-[#A3A9BC] border border-white/[0.08]',
    stale: 'bg-[#F5B83D]/15 text-[#F5B83D] border border-[#F5B83D]/30',
    gain: 'bg-[#19D98B]/15 text-[#19D98B] border border-[#19D98B]/25 font-mono',
    loss: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border border-[#FF4D6D]/25 font-mono',
    warning: 'bg-[#F5B83D]/15 text-[#F5B83D] border border-[#F5B83D]/30',
    'asset-type': 'bg-[#7C5CFF]/15 text-[#7C5CFF] border border-[#7C5CFF]/30 font-mono tracking-wider uppercase',
    neutral: 'bg-white/[0.05] text-[#F3F5FA] border border-white/[0.10]',
  };

  const renderIcon = () => {
    switch (variant) {
      case 'market-open':
        return <span className="w-1.5 h-1.5 rounded-full bg-[#19D98B] animate-pulse shrink-0" />;
      case 'delay':
        return <Clock className="w-3 h-3 text-[#A3A9BC] shrink-0" />;
      case 'stale':
        return <AlertTriangle className="w-3 h-3 text-[#F5B83D] shrink-0" />;
      case 'gain':
        return <ArrowUp className="w-3 h-3 text-[#19D98B] shrink-0" />;
      case 'loss':
        return <ArrowDown className="w-3 h-3 text-[#FF4D6D] shrink-0" />;
      case 'asset-type':
        return <ShieldCheck className="w-3 h-3 text-[#7C5CFF] shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <span className={cn(baseStyles, sizes[size], variants[variant], className)} {...props}>
      {renderIcon()}
      <span>{children}</span>
    </span>
  );
}
