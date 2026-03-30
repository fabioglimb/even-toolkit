import { cn } from '../utils/cn';
import { useRef, useState, useCallback } from 'react';
import type { ReactNode, TouchEvent as ReactTouchEvent } from 'react';
import { IcEditTrash } from '../icons/svg-icons';
import { Loading } from './loading';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  onDelete?: () => void | Promise<void>;
  className?: string;
}

const SWIPE_THRESHOLD = 80;
const DELETE_WIDTH = 72;
const DIRECTION_LOCK_PX = 10;

function ListItem({ title, subtitle, leading, trailing, onPress, onDelete, className }: ListItemProps) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentOffset = useRef(0);
  const direction = useRef<'none' | 'horizontal' | 'vertical'>('none');

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    if (!onDelete || deleting) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentOffset.current = offset;
    direction.current = 'none';
    setSwiping(true);
  }, [deleting, onDelete, offset]);

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
    if (!onDelete || deleting) return;
    setDeleting(true);
    try {
      await Promise.resolve(onDelete());
    } finally {
      setDeleting(false);
      setOffset(0);
      direction.current = 'none';
    }
  }, [deleting, onDelete]);

  const Comp = onPress ? 'button' : 'div';

  return (
    <div className="relative overflow-hidden">
      {onDelete && offset < 0 && (
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={deleting}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center bg-negative text-text-highlight cursor-pointer disabled:cursor-default"
          style={{ width: DELETE_WIDTH }}
        >
          {deleting ? <Loading size={18} className="text-text-highlight" /> : <IcEditTrash width={20} height={20} />}
        </button>
      )}
      <Comp
        type={onPress ? 'button' : undefined}
        onClick={deleting ? undefined : onPress}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={cn(
          'flex items-center gap-4 w-full bg-surface p-4 text-left transition-colors relative',
          onPress && !deleting && 'cursor-pointer hover:bg-surface-light',
          className,
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping ? 'none' : 'transform 200ms ease',
        }}
      >
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="text-[15px] tracking-[-0.15px] font-normal text-text truncate">{title}</div>
          {subtitle && <div className="text-[13px] tracking-[-0.13px] text-text-dim mt-1 truncate">{subtitle}</div>}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </Comp>
    </div>
  );
}

export { ListItem };
export type { ListItemProps };
