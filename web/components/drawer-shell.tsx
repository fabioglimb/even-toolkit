import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { SideDrawer, DrawerTrigger, DrawerHeaderContext } from './side-drawer';
import type { SideDrawerItem, DrawerHeaderConfig } from './side-drawer';
import { NavHeader } from './nav-header';
import { Button } from './button';

interface DrawerShellProps {
  items: SideDrawerItem[];
  bottomItems?: SideDrawerItem[];
  title?: string;
  footer?: ReactNode;
  width?: number;
  getPageTitle: (pathname: string) => string;
  deriveActiveId: (pathname: string) => string;
  isNestedRoute?: (pathname: string) => boolean;
  getBackPath?: (pathname: string) => string;
  backIcon?: ReactNode;
  className?: string;
}

const DEFAULT_BACK_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function DrawerShell({
  items,
  bottomItems,
  title,
  footer,
  width,
  getPageTitle,
  deriveActiveId,
  isNestedRoute,
  getBackPath,
  backIcon = DEFAULT_BACK_ICON,
  className,
}: DrawerShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [headerOverride, setHeaderOverride] = useState<DrawerHeaderConfig | null>(null);

  const handleNavigate = useCallback((id: string) => {
    navigate(id);
    setDrawerOpen(false);
  }, [navigate]);

  const allItemIds = useMemo(() => {
    const ids = new Set(items.map((i) => i.id));
    if (bottomItems) bottomItems.forEach((i) => ids.add(i.id));
    return ids;
  }, [items, bottomItems]);

  const pathname = location.pathname;
  const activeId = deriveActiveId(pathname);

  // Determine if nested: either explicit function or check if path matches any item id
  const nested = isNestedRoute
    ? isNestedRoute(pathname)
    : !allItemIds.has(pathname);

  // Resolve header values (screen overrides > defaults)
  const headerTitle = headerOverride?.title ?? getPageTitle(pathname);
  const headerHidden = headerOverride?.hidden ?? false;

  const handleBack = useCallback(() => {
    const explicit = headerOverride?.backTo ?? getBackPath?.(pathname);
    if (explicit) {
      navigate(explicit);
    } else {
      // Use browser history to go back to the actual previous page
      navigate(-1);
    }
  }, [navigate, headerOverride?.backTo, getBackPath, pathname]);

  const defaultLeft = nested
    ? (
        <Button variant="ghost" size="icon" onClick={handleBack}>
          {backIcon}
        </Button>
      )
    : <DrawerTrigger onClick={() => setDrawerOpen(true)} />;

  const headerLeft = headerOverride?.left ?? (headerOverride?.backTo
    ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(headerOverride.backTo!)}
        >
          {backIcon}
        </Button>
      )
    : defaultLeft);

  const headerRight = headerOverride?.right ?? undefined;
  const headerBelow = headerOverride?.below ?? undefined;
  const headerFooter = headerOverride?.footer ?? undefined;

  // Context value
  const ctxValue = useMemo(() => ({
    setHeader: (config: DrawerHeaderConfig) => setHeaderOverride(config),
    resetHeader: () => setHeaderOverride(null),
  }), []);

  return (
    <SideDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onNavigate={handleNavigate}
      activeId={activeId}
      items={items}
      bottomItems={bottomItems}
      title={title}
      footer={footer}
      width={width}
      className={className}
    >
      <DrawerHeaderContext.Provider value={ctxValue}>
        <div className="flex flex-col h-full">
          {!headerHidden && (
            <div className="shrink-0">
              <NavHeader title={headerTitle} left={headerLeft} right={headerRight} />
              {headerBelow}
            </div>
          )}
          <div className="flex-1 overflow-y-auto min-h-0">
            <Outlet />
          </div>
          {headerFooter && (
            <div className="shrink-0">
              {headerFooter}
            </div>
          )}
        </div>
      </DrawerHeaderContext.Provider>
    </SideDrawer>
  );
}

export { DrawerShell };
export type { DrawerShellProps };
