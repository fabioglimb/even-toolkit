import * as React from 'react';
import { cn } from '../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Invalid state. `true` shows a red ring; a string also renders the message below. */
  error?: boolean | string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    const hasError = Boolean(error);
    const input = (
      <input
        ref={ref}
        type={type}
        aria-invalid={hasError || undefined}
        className={cn(
          'h-9 w-full bg-input-bg text-text rounded-[6px] px-4 text-[17px] tracking-[-0.17px] outline-none placeholder:text-text-dim transition-colors',
          hasError && 'ring-1 ring-inset ring-negative',
          className,
        )}
        {...props}
      />
    );
    if (typeof error === 'string' && error) {
      return (
        <div className="w-full">
          {input}
          <p className="mt-1 text-[11px] tracking-[-0.11px] text-negative">{error}</p>
        </div>
      );
    }
    return input;
  },
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
