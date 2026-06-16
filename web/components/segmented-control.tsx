import { cn } from '../utils/cn';

interface SegmentedControlOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onValueChange: (value: string) => void;
  size?: 'default' | 'small' | 'xsmall';
  className?: string;
}

function SegmentedControl({ options, value, onValueChange, size = 'default', className }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'inline-flex items-stretch rounded-[6px] bg-surface-lighter p-0.5',
        size === 'default' && 'min-h-12',
        size === 'small' && 'min-h-9',
        size === 'xsmall' && 'min-h-6',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onValueChange(opt.value)}
          className={cn(
            'flex-1 flex items-center justify-center text-center leading-tight px-4 py-1 font-normal transition-all cursor-pointer rounded-[4px]',
            size === 'default' && 'text-[17px] tracking-[-0.17px]',
            size === 'small' && 'text-[15px] tracking-[-0.15px] px-3',
            size === 'xsmall' && 'text-[13px] tracking-[-0.13px] px-2',
            value === opt.value
              ? 'bg-surface text-text shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]'
              : 'text-text-dim hover:text-text',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedControl };
export type { SegmentedControlProps, SegmentedControlOption };
