import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { DisplayData, GlassAction, GlassNavState, ColumnData } from './types';
import { EvenHubBridge, type ColumnConfig } from './bridge';
import { mapGlassEvent } from './action-map';
import { bindKeyboard } from './keyboard';
import { activateKeepAlive, deactivateKeepAlive } from './keep-alive';
import type { SplashHandle } from './splash';

/** Debug overlay — only shows if window.__glassesDebug is true */
function showDebugOverlay(msg: string): void {
  if (!(window as any).__glassesDebug) return;
  // visible via __glassesDebug flag — no console output in production
}

export interface UseGlassesConfig<S> {
  getSnapshot: () => S;
  /** Convert snapshot to single text display (for 'text' mode) */
  toDisplayData: (snapshot: S, nav: GlassNavState) => DisplayData;
  /** Convert snapshot to column data (for 'columns' mode) — optional */
  toColumns?: (snapshot: S, nav: GlassNavState) => ColumnData;
  onGlassAction: (action: GlassAction, nav: GlassNavState, snapshot: S) => GlassNavState;
  deriveScreen: (path: string) => string;
  appName: string;
  /** Page mode per screen — return 'text', 'columns', or 'home'. Default: 'text' */
  getPageMode?: (screen: string) => 'text' | 'columns' | 'home';
  /** Column layout config — default: 3 equal columns across 576px */
  columns?: ColumnConfig[];
  /** Home page image tiles — sent when getPageMode returns 'home'. Create with createSplash().getTiles() */
  homeImageTiles?: { id: number; name: string; bytes: Uint8Array; x: number; y: number; w: number; h: number }[];
  /**
   * Optional image-based splash screen.
   * When provided, shows the splash image instead of the default text splash,
   * then waits minTimeMs before switching to app content.
   * Create with `createSplash()` from 'even-toolkit/splash'.
   */
  splash?: SplashHandle;
}

export function useGlasses<S>(config: UseGlassesConfig<S>): void {
  const location = useLocation();
  const navigate = useNavigate();

  const hubRef = useRef<EvenHubBridge | null>(null);
  const navRef = useRef<GlassNavState>({ highlightedIndex: 0, screen: '' });
  const lastSnapshotRef = useRef<S | null>(null);
  const sendingRef = useRef(false);
  const pendingRef = useRef(false);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const configRef = useRef(config);
  configRef.current = config;
  const lastHadImagesRef = useRef(false);

  const sendDisplay = useCallback(async () => {
    if (sendingRef.current || !hubRef.current) {
      // Queue a retry — the current in-flight send has stale data
      pendingRef.current = true;
      return;
    }
    sendingRef.current = true;
    pendingRef.current = false;
    try {
      const hub = hubRef.current;
      const snapshot = configRef.current.getSnapshot();
      const nav = navRef.current;
      const getMode = configRef.current.getPageMode ?? (() => 'text');
      const mode = getMode(nav.screen);

      // Build display text from lines
      const data = configRef.current.toDisplayData(snapshot, nav);
      const text = data.lines.map(l => {
        if (l.style === 'separator') return '\u2500'.repeat(28);
        if (l.inverted) return `\u25B6 ${l.text}`;
        return `  ${l.text}`;
      }).join('\n');

      if (mode === 'columns' && configRef.current.toColumns) {
        const cols = configRef.current.toColumns(snapshot, nav);
        if (hub.currentMode === 'columns') {
          await hub.updateColumns(cols.columns);
        } else {
          await hub.showColumnPage(cols.columns);
        }
      } else {
        // All modes use raw bridge (home layout) for consistent rendering.
        // 'home' mode includes image tiles; 'text' mode passes no images.
        const tiles = mode === 'home' ? configRef.current.homeImageTiles : undefined;
        const imageTiles = tiles?.map(t => ({ id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h }));
        const hasImages = !!imageTiles?.length;
        // Rebuild container when switching modes or changing between image/no-image layouts
        const needsRebuild = hub.currentMode !== 'home' || hasImages !== lastHadImagesRef.current;

        if (!needsRebuild) {
          await hub.updateHomeText(text);
        } else {
          await hub.showHomePage(text, imageTiles);
          if (tiles) {
            for (const tile of tiles) {
              await hub.sendImage(tile.id, tile.name, tile.bytes);
            }
          }
        }
        lastHadImagesRef.current = hasImages;
      }
    } catch {
      // SDK unavailable — glasses panel won't update, web still works
    } finally {
      sendingRef.current = false;
      // If a send was queued while we were busy, flush again with fresh data
      if (pendingRef.current) {
        pendingRef.current = false;
        sendDisplay();
      }
    }
  }, []);

  const flushDisplay = useCallback(() => {
    sendDisplay();
  }, [sendDisplay]);

  const handleAction = useCallback((action: GlassAction) => {
    const snapshot = configRef.current.getSnapshot();
    const newNav = configRef.current.onGlassAction(action, navRef.current, snapshot);
    navRef.current = newNav;
    flushDisplay();
  }, [flushDisplay]);

  // Update screen from URL changes
  useEffect(() => {
    const newScreen = configRef.current.deriveScreen(location.pathname);
    if (newScreen !== navRef.current.screen) {
      navRef.current = { highlightedIndex: 0, screen: newScreen };
      flushDisplay();
    }
  }, [location.pathname, flushDisplay]);

  // Initialize bridge, keyboard, keep-alive, and polling
  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    const hub = new EvenHubBridge(configRef.current.columns);
    hubRef.current = hub;

    navRef.current = {
      highlightedIndex: 0,
      screen: configRef.current.deriveScreen(location.pathname),
    };

    async function initBridge() {
      showDebugOverlay('initBridge: starting...');
      try {
        await hub.init();
        showDebugOverlay('initBridge: bridge ready');
        // Expose bridge globally for STT GlassBridgeSource
        (window as any).__evenBridge = hub;
        if (disposed) return;

        const splash = configRef.current.splash;

        if (splash) {
          showDebugOverlay('initBridge: showing splash...');
          await splash.show(hub);
          showDebugOverlay('initBridge: splash shown');
          if (disposed) return;

          hub.onEvent((event) => {
            const action = mapGlassEvent(event);
            if (action) handleAction(action);
          });

          await splash.waitMinTime();
          if (disposed) return;

          // Clear extra splash tiles (e.g. "Loading..." tile) with black — no rebuild
          await splash.clearExtras(hub);

          // Splash already set up the home layout — mark it so first render
          // uses updateHomeText instead of rebuilding (avoids blink)
          lastHadImagesRef.current = !!configRef.current.homeImageTiles?.length;
        } else {
          showDebugOverlay('initBridge: no splash, showing text...');
          await hub.showTextPage(`\n\n      ${configRef.current.appName}`);
          if (disposed) return;

          hub.onEvent((event) => {
            const action = mapGlassEvent(event);
            if (action) handleAction(action);
          });
        }
      } catch (err) {
        // SDK not available — app continues without glasses
        showDebugOverlay('Bridge init failed: ' + (err instanceof Error ? err.message : String(err)));
      }

      // Start polling for state changes
      if (!disposed) {
        flushDisplay();
        pollTimer = setInterval(() => {
          const snapshot = configRef.current.getSnapshot();
          if (snapshot !== lastSnapshotRef.current) {
            lastSnapshotRef.current = snapshot;
            flushDisplay();
          }
        }, 100);
      }
    }

    initBridge();

    const unbindKeyboard = bindKeyboard(handleAction);
    activateKeepAlive(`${configRef.current.appName}_keep_alive`);

    return () => {
      disposed = true;
      if (pollTimer) clearInterval(pollTimer);
      unbindKeyboard();
      hub.dispose();
      hubRef.current = null;
      (window as any).__evenBridge = null;
      deactivateKeepAlive();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
