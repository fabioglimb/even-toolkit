import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';

/* ── Types ── */

interface SideDrawerItem {
  id: string;
  label: string;
  icon?: ReactNode;
  section?: string;
}

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  activeId: string;
  items: SideDrawerItem[];
  bottomItems?: SideDrawerItem[];
  title?: string;
  footer?: ReactNode;
  children: ReactNode;
  width?: number;
  className?: string;
}

/* ── Constants ── */

const DEFAULT_WIDTH = 280;
const SHIFT_EXTRA = 20;
const MAIN_SCALE = 0.985;
const TRANSITION = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), border-radius 300ms ease';
const SIDEBAR_TRANSITION = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease';

/* ── Shared item renderer ── */

function renderItemSection(
  sectionName: string,
  sectionItems: SideDrawerItem[],
  activeId: string,
  onNavigate: (id: string) => void,
) {
  return (
    <div key={sectionName || '__default'}>
      {sectionName && (
        <div className="px-3 pt-4 pb-1.5">
          <span className="text-[11px] tracking-[-0.11px] text-text-dim font-normal uppercase">
            {sectionName}
          </span>
        </div>
      )}
      {sectionItems.map((item) => {
        const isActive = activeId === item.id || (item.id !== '/' && activeId.startsWith(item.id));
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 h-11 rounded-[6px] mb-0.5 text-left cursor-pointer border-none',
              'transition-colors',
              isActive
                ? 'bg-surface-light text-accent'
                : 'text-text hover:bg-surface-light/50',
            )}
          >
            {item.icon && <span className="shrink-0 w-5 flex items-center justify-center">{item.icon}</span>}
            <span className="text-[15px] tracking-[-0.15px] font-normal">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function groupBySection(items: SideDrawerItem[]): Map<string, SideDrawerItem[]> {
  const sections = new Map<string, SideDrawerItem[]>();
  for (const item of items) {
    const key = item.section ?? '';
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(item);
  }
  return sections;
}

/* ── SideDrawer ── */

function SideDrawer({
  open,
  onClose,
  onNavigate,
  activeId,
  items,
  bottomItems,
  title,
  footer,
  children,
  width = DEFAULT_WIDTH,
  className,
}: SideDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const shift = width + SHIFT_EXTRA;
  const sections = groupBySection(items);
  const bottomSections = bottomItems ? groupBySection(bottomItems) : null;

  return (
    <div className={cn('relative h-dvh w-full overflow-hidden bg-bg', className)}>
      {/* Sidebar panel */}
      <div
        className="absolute top-0 left-0 bottom-0 flex flex-col bg-bg z-0"
        style={{
          width: `${width}px`,
          transform: open ? 'translateX(0)' : `translateX(-${width * 0.3}px)`,
          opacity: open ? 1 : 0,
          transition: SIDEBAR_TRANSITION,
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        {title && (
          <div className="shrink-0 px-4 pt-4 pb-3">
            <span className="text-[20px] tracking-[-0.6px] font-normal text-text">{title}</span>
          </div>
        )}

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {[...sections.entries()].map(([name, items]) =>
            renderItemSection(name, items, activeId, onNavigate),
          )}
        </div>

        {/* Bottom items */}
        {bottomSections && (
          <div className="shrink-0 border-t border-border px-2 py-1">
            {[...bottomSections.entries()].map(([name, items]) =>
              renderItemSection(name, items, activeId, onNavigate),
            )}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className={cn('shrink-0 px-2 py-2', !bottomSections && 'border-t border-border')}>
            {footer}
          </div>
        )}
      </div>

      {/* Main content */}
      <div
        className="relative h-full w-full z-[1] bg-bg overflow-hidden"
        style={{
          transform: open
            ? `translateX(${shift}px) scale(${MAIN_SCALE})`
            : 'translateX(0) scale(1)',
          borderRadius: open ? '16px' : '0px',
          transition: TRANSITION,
          transformOrigin: 'left center',
        }}
      >
        {children}

        {/* Dark overlay */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black cursor-pointer z-[2]"
          style={{
            opacity: open ? 0.45 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: 'opacity 300ms ease',
          }}
        />
      </div>
    </div>
  );
}

/* ── DrawerTrigger (hamburger button) ── */

function DrawerTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-[6px] cursor-pointer border-none bg-transparent',
        'text-text hover:bg-surface-light transition-colors',
        className,
      )}
      aria-label="Open menu"
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* ── Drawer Header Context ── */

interface DrawerHeaderConfig {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  below?: ReactNode;
  footer?: ReactNode;
  backTo?: string;
  hidden?: boolean;
}

interface DrawerHeaderContextValue {
  setHeader: (config: DrawerHeaderConfig) => void;
  resetHeader: () => void;
}

const DrawerHeaderContext = createContext<DrawerHeaderContextValue | null>(null);

function useDrawerHeader(config: DrawerHeaderConfig): void {
  const ctx = useContext(DrawerHeaderContext);
  const configRef = useMemo(() => config, [
    config.title,
    config.left,
    config.right,
    config.below,
    config.footer,
    config.backTo,
    config.hidden,
  ]);

  useLayoutEffect(() => {
    if (!ctx) return;
    ctx.setHeader(configRef);
    return () => ctx.resetHeader();
  }, [ctx, configRef]);
}

export { SideDrawer, DrawerTrigger, DrawerHeaderContext, useDrawerHeader };
export type { SideDrawerProps, SideDrawerItem, DrawerHeaderConfig, DrawerHeaderContextValue };
