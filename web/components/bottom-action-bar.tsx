import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}

function BottomActionBar({ children, className, sticky = true }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        'z-10 min-h-[52px] rounded-t-[6px] border-t border-border bg-surface px-3 py-2 shadow-[0_-6px_18px_rgba(0,0,0,0.04)]',
        sticky && 'sticky bottom-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

export { BottomActionBar };
export type { BottomActionBarProps };
