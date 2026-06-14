import * as React from 'react';
import { cn } from '../utils/cn';

// ─── Types ──────────────────────────────────────────────────────

interface ImageItem {
  src: string;
  alt?: string;
  thumbnail?: string;
}

// ─── ImageGrid ──────────────────────────────────────────────────

interface ImageGridProps {
  images: ImageItem[];
  columns?: 2 | 3 | 4;
  onSelect?: (index: number) => void;
  className?: string;
}

function ImageGrid({ images, columns = 3, onSelect, className }: ImageGridProps) {
  return (
    <div
      className={cn(
        'grid gap-1',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
        className,
      )}
    >
      {images.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect?.(i)}
          className="aspect-square overflow-hidden rounded-[6px] cursor-pointer bg-surface-lighter"
        >
          <img
            src={img.thumbnail ?? img.src}
            alt={img.alt ?? ''}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            loading="lazy"
          />
        </button>
      ))}
    </div>
  );
}

// ─── ImageViewer ────────────────────────────────────────────────

interface ImageViewerProps {
  images: ImageItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  className?: string;
}

function ImageViewer({ images, currentIndex, onClose, onNavigate, className }: ImageViewerProps) {
  const image = images[currentIndex];
  if (!image) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  // Keyboard navigation
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [currentIndex, hasPrev, hasNext, onClose, onNavigate]);

  // Swipe (touch drag) navigation
  const swipeStartX = React.useRef<number | null>(null);
  const SWIPE_THRESHOLD = 40;
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? swipeStartX.current) - swipeStartX.current;
    swipeStartX.current = null;
    if (dx > SWIPE_THRESHOLD && hasPrev) onNavigate(currentIndex - 1);
    else if (dx < -SWIPE_THRESHOLD && hasNext) onNavigate(currentIndex + 1);
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />

      {/* Image */}
      <div
        className="relative z-10 max-w-[90vw] max-h-[80vh] touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={image.src}
          alt={image.alt ?? ''}
          className="max-w-full max-h-[80vh] object-contain rounded-[6px] select-none"
          draggable={false}
        />
      </div>

      {/* Navigation */}
      {hasPrev && (
        <button
          type="button"
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 z-20 w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center cursor-pointer text-text hover:bg-surface transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5"><rect x={14} y={4} width={2} height={2} fill="currentColor" /><rect x={12} y={6} width={2} height={2} fill="currentColor" /><rect x={10} y={8} width={2} height={2} fill="currentColor" /><rect x={8} y={10} width={2} height={2} fill="currentColor" /><rect x={10} y={12} width={2} height={2} fill="currentColor" /><rect x={12} y={14} width={2} height={2} fill="currentColor" /><rect x={14} y={16} width={2} height={2} fill="currentColor" /></svg>
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 z-20 w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center cursor-pointer text-text hover:bg-surface transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5"><rect x={8} y={4} width={2} height={2} fill="currentColor" /><rect x={10} y={6} width={2} height={2} fill="currentColor" /><rect x={12} y={8} width={2} height={2} fill="currentColor" /><rect x={14} y={10} width={2} height={2} fill="currentColor" /><rect x={12} y={12} width={2} height={2} fill="currentColor" /><rect x={10} y={14} width={2} height={2} fill="currentColor" /><rect x={8} y={16} width={2} height={2} fill="currentColor" /></svg>
        </button>
      )}

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-surface/80 flex items-center justify-center cursor-pointer text-text hover:bg-surface transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5"><rect x={4} y={4} width={2} height={2} fill="currentColor" /><rect x={6} y={6} width={2} height={2} fill="currentColor" /><rect x={8} y={8} width={2} height={2} fill="currentColor" /><rect x={10} y={10} width={2} height={2} fill="currentColor" /><rect x={12} y={12} width={2} height={2} fill="currentColor" /><rect x={14} y={14} width={2} height={2} fill="currentColor" /><rect x={16} y={16} width={2} height={2} fill="currentColor" /><rect x={16} y={4} width={2} height={2} fill="currentColor" /><rect x={14} y={6} width={2} height={2} fill="currentColor" /><rect x={12} y={8} width={2} height={2} fill="currentColor" /><rect x={8} y={12} width={2} height={2} fill="currentColor" /><rect x={6} y={14} width={2} height={2} fill="currentColor" /><rect x={4} y={16} width={2} height={2} fill="currentColor" /></svg>
        </button>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-surface/80 rounded-full px-3 py-1 text-[13px] tracking-[-0.13px] text-text tabular-nums">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

export { ImageGrid, ImageViewer };
export type { ImageGridProps, ImageViewerProps, ImageItem };
