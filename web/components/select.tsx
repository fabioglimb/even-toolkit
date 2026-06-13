import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  /** Invalid state. `true` shows a red ring; a string also renders the message below. */
  error?: boolean | string;
}

/**
 * Custom dropdown — no native <select>. Fully styled, no browser arrow issues.
 */
function Select({ value, options, onValueChange, placeholder, className, disabled, dropdownPosition = 'bottom', error }: SelectProps) {
  const hasError = Boolean(error);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder ?? 'Select...';

  const updateRect = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateRect();
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = ref.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open, updateRect]);

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
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        aria-invalid={hasError || undefined}
        className={cn(
          'h-9 w-full bg-input-bg text-text rounded-[6px] pl-4 pr-8 text-[17px] tracking-[-0.17px] text-left cursor-pointer border-none flex items-center',
          'transition-colors hover:bg-surface-light',
          hasError && 'ring-1 ring-inset ring-negative',
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

      {open && rect && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-surface rounded-[6px] border border-border overflow-hidden"
          style={{
            top: dropdownPosition === 'top' ? undefined : rect.top + rect.height + 4,
            bottom: dropdownPosition === 'top' ? window.innerHeight - rect.top + 4 : undefined,
            left: rect.left,
            width: rect.width,
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                'w-full text-left px-4 py-2.5 text-[15px] tracking-[-0.15px] cursor-pointer border-none transition-colors font-normal',
                o.value === value
                  ? 'bg-accent text-text-highlight'
                  : 'bg-transparent text-text hover:bg-surface-light',
              )}
              onClick={() => handleSelect(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
      {typeof error === 'string' && error && (
        <p className="mt-1 text-[11px] tracking-[-0.11px] text-negative">{error}</p>
      )}
    </div>
  );
}

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption };
