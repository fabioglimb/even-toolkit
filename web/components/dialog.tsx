import * as React from 'react';
import { cn } from '../utils/cn';
import type { ReactNode } from 'react';

interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  actions?: DialogAction[];
  className?: string;
}

function Dialog({ open, onClose, title, icon, children, actions, className }: DialogProps) {
  const [visible, setVisible] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const stopPropagation = React.useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  React.useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => { setVisible(false); setClosing(false); }, 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  React.useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  React.useEffect(() => {
    if (!visible) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 overscroll-contain"
      onTouchStartCapture={stopPropagation}
      onTouchMoveCapture={stopPropagation}
      onTouchEndCapture={stopPropagation}
      onWheelCapture={stopPropagation}
      style={{ animation: closing ? 'fadeOut 200ms ease forwards' : 'fadeIn 200ms ease' }}
    >
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full max-w-[311px] bg-surface rounded-[6px] shadow-[0_4px_24px_rgba(0,0,0,0.16)] p-4',
          className,
        )}
        style={{ animation: closing ? 'fadeOut 200ms ease forwards' : 'fadeIn 250ms ease' }}
      >
        <div className="flex items-start gap-2 mb-2">
          {icon && <div className="shrink-0 w-5 h-5 text-text mt-0.5">{icon}</div>}
          <h2 className="text-[15px] tracking-[-0.15px] font-normal text-text">{title}</h2>
        </div>
        {children && (
          <div className="text-[13px] tracking-[-0.13px] text-text-dim leading-[18px]">
            {children}
          </div>
        )}
        {actions && actions.length > 0 && (
          <div className="flex gap-3 mt-4">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={cn(
                  'flex-1 h-10 rounded-[6px] text-[15px] tracking-[-0.15px] font-normal cursor-pointer transition-colors',
                  action.variant === 'danger'
                    ? 'bg-surface-light text-negative hover:bg-surface-lighter'
                    : 'bg-surface-light text-text hover:bg-surface-lighter',
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { Dialog };
export type { DialogProps, DialogAction };
