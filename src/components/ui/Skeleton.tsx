import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({
  className,
  variant = 'rect',
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-white/[0.06] select-none',
        variants[variant],
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}
