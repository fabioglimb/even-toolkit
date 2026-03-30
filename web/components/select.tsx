import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value?: string;
  options: SelectOption[];
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  dropdownPosition?: 'top' | 'bottom';
}

/**
 * Custom dropdown — no native <select>. Fully styled, no browser arrow issues.
 */
function Select({ value, options, onValueChange, placeholder, className, disabled, dropdownPosition = 'bottom' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder ?? 'Select...';

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = useCallback((v: string) => {
    onValueChange?.(v);
    setOpen(false);
  }, [onValueChange]);

  return (
    <div ref={ref} className={cn('relative', className)} style={{ minWidth: 0 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'h-9 w-full bg-input-bg text-text rounded-[6px] pl-3 pr-8 text-[13px] tracking-[-0.13px] text-left cursor-pointer border-none flex items-center',
          'transition-colors hover:bg-surface-light',
          disabled && 'opacity-50 cursor-default',
        )}
      >
        <span className="truncate flex-1">{label}</span>
        <svg
          className="absolute right-3 top-1/2 text-text-dim shrink-0"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{ transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)', transition: 'transform 150ms ease' }}
        >
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 left-0 right-0 bg-surface rounded-[6px] border border-border overflow-hidden',
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
          style={{ maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-[13px] tracking-[-0.13px] cursor-pointer border-none transition-colors font-normal',
                o.value === value
                  ? 'bg-accent text-text-highlight'
                  : 'bg-transparent text-text hover:bg-surface-light',
              )}
              onClick={() => handleSelect(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
