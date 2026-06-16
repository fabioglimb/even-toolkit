import { cn } from '../utils/cn';
import { useRef, useState, useCallback } from 'react';
import type { ReactNode, TouchEvent as ReactTouchEvent } from 'react';
import { IcTrash } from '../icons/svg-icons';
import { Loading } from './loading';

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 80;
const DELETE_WIDTH = 72;
const DIRECTION_LOCK_PX = 10;

/**
 * Wraps arbitrary content and reveals a red delete affordance on left-swipe,
 * calling `onDelete` (supports async/loading). Shares the same gesture,
 * threshold, and behavior as `ListItem`'s built-in swipe-to-delete.
 */
function SwipeToDelete({ children, onDelete, disabled = false, className }: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentOffset = useRef(0);
  const direction = useRef<'none' | 'horizontal' | 'vertical'>('none');

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    if (disabled || deleting) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentOffset.current = offset;
    direction.current = 'none';
    setSwiping(true);
  }, [disabled, deleting, offset]);

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    if (!swiping || deleting) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Lock direction on first significant move
    if (direction.current === 'none') {
      if (Math.abs(dx) > DIRECTION_LOCK_PX || Math.abs(dy) > DIRECTION_LOCK_PX) {
        direction.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
      return;
    }

    // Vertical scroll — don't interfere
    if (direction.current === 'vertical') return;

    const next = Math.min(0, Math.max(-DELETE_WIDTH, currentOffset.current + dx));
    setOffset(next);
  }, [deleting, swiping]);

  const onTouchEnd = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);
    if (direction.current === 'vertical') return;
    setOffset(offset < -SWIPE_THRESHOLD / 2 ? -DELETE_WIDTH : 0);
  }, [swiping, offset]);

  const handleDeleteClick = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await Promise.resolve(onDelete());
    } finally {
      setDeleting(false);
      setOffset(0);
      direction.current = 'none';
    }
  }, [deleting, onDelete]);

  return (
    <div className="relative overflow-hidden rounded-[6px]">
      {!disabled && offset < 0 && (
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={deleting}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-negative text-text-highlight cursor-pointer disabled:cursor-default"
          style={{ width: DELETE_WIDTH }}
        >
          {deleting ? <Loading size={18} className="text-text-highlight" /> : <IcTrash width={20} height={20} />}
        </button>
      )}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn('relative', className)}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 200ms ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export { SwipeToDelete };
export type { SwipeToDeleteProps };
