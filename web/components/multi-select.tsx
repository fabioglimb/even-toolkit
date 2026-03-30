import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../utils/cn';
import { IcStatusCheckbox, IcStatusSelectedBox } from '../icons/svg-icons';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  values: string[];
  options: MultiSelectOption[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Custom multi-select dropdown with checkboxes. No native <select>.
 */
function MultiSelect({ values, options, onValuesChange, placeholder, className, disabled }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label);

  const displayText = selectedLabels.length > 0
    ? selectedLabels.join(', ')
    : placeholder ?? 'Select...';

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

  const toggleValue = useCallback((v: string) => {
    if (values.includes(v)) {
      onValuesChange(values.filter((x) => x !== v));
    } else {
      onValuesChange([...values, v]);
    }
  }, [values, onValuesChange]);

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
          selectedLabels.length === 0 && 'text-text-dim',
        )}
      >
        <span className="truncate flex-1">{displayText}</span>
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
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface rounded-[6px] border border-border overflow-hidden"
          style={{ maxHeight: 200, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {options.map((o) => {
            const checked = values.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 text-[13px] tracking-[-0.13px] cursor-pointer border-none transition-colors font-normal flex items-center gap-2',
                  checked ? 'bg-accent/5' : 'bg-transparent hover:bg-surface-light',
                )}
                onClick={() => toggleValue(o.value)}
              >
                {checked
                  ? <IcStatusSelectedBox width={18} height={18} className="shrink-0" />
                  : <IcStatusCheckbox width={18} height={18} className="shrink-0 text-text-dim" />
                }
                <span className="text-text">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

MultiSelect.displayName = 'MultiSelect';

export { MultiSelect };
export type { MultiSelectProps, MultiSelectOption };
