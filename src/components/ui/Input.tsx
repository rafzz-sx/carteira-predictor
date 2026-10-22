import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  prefixText?: string;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      prefixText,
      suffixText,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#A3A9BC]">
            {label}
          </label>
        )}

        <div
          className={cn(
            'flex items-center rounded-xl bg-white/[0.04] border border-white/[0.10] px-3 py-2 transition-all focus-within:border-[#7C5CFF] focus-within:ring-1 focus-within:ring-[#7C5CFF]',
            error && 'border-[#FF4D6D] focus-within:border-[#FF4D6D] focus-within:ring-[#FF4D6D]',
            disabled && 'opacity-50 cursor-not-allowed bg-white/[0.02]',
            className
          )}
        >
          {prefixText && (
            <span className="text-xs font-mono text-[#A3A9BC] pr-2 select-none">
              {prefixText}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className="w-full bg-transparent text-xs sm:text-sm text-[#F3F5FA] placeholder-[#70778C] outline-none disabled:cursor-not-allowed font-tabular"
            {...props}
          />

          {suffixText && (
            <span className="text-xs font-mono text-[#A3A9BC] pl-2 select-none">
              {suffixText}
            </span>
          )}
        </div>

        {error ? (
          <span className="text-[11px] text-[#FF4D6D] font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[#70778C]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
