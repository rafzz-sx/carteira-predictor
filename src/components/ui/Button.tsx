import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#7C5CFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C]';

    const variants = {
      primary:
        'bg-[#7C5CFF] hover:bg-[#6A48F0] text-white shadow-[0_0_0_1px_rgba(124,92,255,0.35),0_0_20px_rgba(124,92,255,0.18)]',
      secondary:
        'bg-white/[0.05] hover:bg-white/[0.09] text-[#F3F5FA] border border-white/[0.10]',
      ghost:
        'bg-transparent hover:bg-white/[0.05] text-[#A3A9BC] hover:text-[#F3F5FA]',
      danger:
        'bg-[#FF4D6D]/15 hover:bg-[#FF4D6D]/25 text-[#FF4D6D] border border-[#FF4D6D]/30',
    };

    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[32px]',
      md: 'px-4 py-2 text-xs sm:text-sm gap-2 min-h-[40px]',
      lg: 'px-6 py-3 text-sm sm:text-base gap-2.5 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
