import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { DisplayData, GlassAction, GlassNavState, ColumnData, SplitData } from './types';
import { renderTextPageLines } from './types';
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
  /** Convert snapshot to split-pane data (for 'split' mode) — optional */
  toSplit?: (snapshot: S, nav: GlassNavState) => SplitData;
  onGlassAction: (action: GlassAction, nav: GlassNavState, snapshot: S) => GlassNavState;
  deriveScreen: (path: string) => string;
  appName: string;
  /** Page mode per screen — return 'text', 'columns', 'split', or 'home'. Default: 'text' */
  getPageMode?: (screen: string) => 'text' | 'columns' | 'split' | 'home';
  /**
   * When true (default), a double click on a home/root glasses screen
   * opens the native Even Hub shutdown container instead of routing GO_BACK
   * through app-specific screen handlers.
   */
  shutdownOnHomeBack?: boolean;
  /** Native shutdown mode. 1 = show foreground exit layer, 0 = exit immediately. Default: 1 */
  shutdownMode?: 0 | 1;
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
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const configRef = useRef(config);
  configRef.current = config;
  const lastHadImagesRef = useRef(false);

  // ── Separate busy flags for text and image pipelines ──
  // Text updates (lightweight) never block on image sends (heavy/can stall when backgrounded)
  const textBusyRef = useRef(false);
  const textPendingRef = useRef(false);
  const imgBusyRef = useRef(false);

  // ── Text pipeline: layout setup + text content ──
  const sendText = useCallback(async () => {
    if (textBusyRef.current || !hubRef.current) {
      textPendingRef.current = true;
      return;
    }
    textBusyRef.current = true;
    textPendingRef.current = false;
    try {
      const hub = hubRef.current;
      const snapshot = configRef.current.getSnapshot();
      const nav = navRef.current;
      const getMode = configRef.current.getPageMode ?? (() => 'text');
      const mode = getMode(nav.screen);

      if (mode === 'columns' && configRef.current.toColumns) {
        const cols = configRef.current.toColumns(snapshot, nav);
        if (hub.currentMode === 'columns') {
          await hub.updateColumns(cols.columns);
        } else {
          await hub.showColumnPage(cols.columns);
        }
      } else if (mode === 'split' && configRef.current.toSplit) {
        const split = configRef.current.toSplit(snapshot, nav);
        if (hub.currentMode === 'split') {
          await hub.updateSplitPage(split.header, split.left, split.right, split.layout);
        } else {
          await hub.showSplitPage(split.header, split.left, split.right, split.layout);
        }
      } else {
        const data = configRef.current.toDisplayData(snapshot, nav);
        const text = renderTextPageLines(data.lines);

        const tiles = mode === 'home' ? configRef.current.homeImageTiles : undefined;
        const imageTiles = tiles?.map(t => ({ id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h }));
        const hasImages = !!imageTiles?.length;
        const needsRebuild = hub.currentMode !== 'home' || hasImages !== lastHadImagesRef.current;

        if (!needsRebuild) {
          await hub.updateHomeText(text);
        } else {
          await hub.showHomePage(text, imageTiles);
          // Send images in a SEPARATE pipeline — don't block text
          if (tiles) {
            sendImages(tiles);
          }
        }
        lastHadImagesRef.current = hasImages;
      }
    } catch {
      // SDK unavailable — glasses panel won't update, web still works
    } finally {
      textBusyRef.current = false;
      if (textPendingRef.current) {
        textPendingRef.current = false;
        sendText();
      }
    }
  }, []);

  // ── Image pipeline: independent, non-blocking ──
  const sendImages = useCallback((tiles: { id: number; name: string; bytes: Uint8Array }[]) => {
    if (imgBusyRef.current || !hubRef.current) return;
    imgBusyRef.current = true;

    const hub = hubRef.current;
    (async () => {
      try {
        for (const tile of tiles) {
          if (!hubRef.current) break;
          await hub.sendImage(tile.id, tile.name, tile.bytes);
        }
      } catch {
        // Image send failed (backgrounded, bridge stalled) — ignore, text still works
      } finally {
        imgBusyRef.current = false;
      }
    })();
  }, []);

  const flushDisplay = useCallback(() => {
    sendText();
  }, [sendText]);

  const maybeHandleHomeShutdown = useCallback(async (action: GlassAction): Promise<boolean> => {
    if (action.type !== 'GO_BACK') return false;
    if (configRef.current.shutdownOnHomeBack === false) return false;

    const nav = navRef.current;
    const getMode = configRef.current.getPageMode ?? (() => 'text');
    if (getMode(nav.screen) !== 'home') return false;

    const hub = hubRef.current;
    if (!hub) return false;

    return hub.showShutdownContainer(configRef.current.shutdownMode ?? 1);
  }, []);

  const handleAction = useCallback((action: GlassAction) => {
    void (async () => {
      if (await maybeHandleHomeShutdown(action)) return;
      const snapshot = configRef.current.getSnapshot();
      const newNav = configRef.current.onGlassAction(action, navRef.current, snapshot);
      navRef.current = newNav;
      flushDisplay();
    })();
  }, [flushDisplay, maybeHandleHomeShutdown]);

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
