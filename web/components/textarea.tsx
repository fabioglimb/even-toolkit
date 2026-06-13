import * as React from 'react';
import { cn } from '../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Invalid state. `true` shows a red ring; a string also renders the message below. */
  error?: boolean | string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, error, ...props }, ref) => {
    const hasError = Boolean(error);
    const textarea = (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={hasError || undefined}
        className={cn(
          'w-full bg-input-bg text-text rounded-[6px] px-4 py-3 text-[17px] tracking-[-0.17px] outline-none placeholder:text-text-dim transition-colors resize-none',
          hasError && 'ring-1 ring-inset ring-negative',
          className,
        )}
        {...props}
      />
    );
    if (typeof error === 'string' && error) {
      return (
        <div className="w-full">
          {textarea}
          <p className="mt-1 text-[11px] tracking-[-0.11px] text-negative">{error}</p>
        </div>
      );
    }
    return textarea;
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
