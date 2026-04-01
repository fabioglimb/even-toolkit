import { cn } from '../utils/cn';
import type { ReactNode } from 'react';

interface NavHeaderProps {
  title: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

function NavHeader({ title, left, right, className }: NavHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between w-full box-border px-3 h-[52px] bg-surface rounded-b-[6px]', className)}>
      <div className="flex items-center gap-2 shrink-0 min-w-[40px]">{left}</div>
      <span className="text-[17px] tracking-[-0.17px] font-normal text-text text-center flex-1 truncate">
        {title}
      </span>
      <div className="flex items-center gap-2 justify-end shrink-0 min-w-[40px]">{right}</div>
    </div>
  );
}

export { NavHeader };
export type { NavHeaderProps };
