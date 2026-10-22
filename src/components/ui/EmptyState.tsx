import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white/[0.02] border border-white/[0.08] gap-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20 flex items-center justify-center">
        {icon || <Inbox className="w-6 h-6" />}
      </div>

      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="text-sm font-semibold text-[#F3F5FA]">{title}</h3>
        <p className="text-xs text-[#A3A9BC] leading-relaxed">{description}</p>
      </div>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
