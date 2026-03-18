/**
 * Splash screen system for G2 glasses apps.
 *
 * Renders a canvas-based splash image to G2 image tiles with configurable
 * timing, tile layout, custom positioning, and a render callback.
 *
 * Usage:
 *   const splash = createSplash({
 *     render: (ctx, w, h) => {
 *       ctx.fillStyle = '#e0e0e0';
 *       ctx.font = 'bold 16px monospace';
 *       ctx.textAlign = 'center';
 *       ctx.fillText('MyApp', w/2, h/2);
 *     },
 *     tiles: 1,
 *     minTimeMs: 2000,
 *   });
 *
 *   // In useGlasses config:
 *   useGlasses({ ..., splash });
 */

import { G2_IMAGE_MAX_W, G2_IMAGE_MAX_H, DISPLAY_W, DISPLAY_H, IMAGE_TILES } from './layout';
import { encodeTilesBatch } from './png-utils';

export interface TilePosition {
  /** X position on the G2 display (0-576). Default: auto from tile index */
  x: number;
  /** Y position on the G2 display (0-288). Default: 0 */
  y: number;
  /** Tile width. Default: 200 (G2_IMAGE_MAX_W) */
  w?: number;
  /** Tile height. Default: 100 (G2_IMAGE_MAX_H) */
  h?: number;
}

export interface SplashConfig {
  /**
   * Render callback — draw your splash on the provided canvas context.
   * The canvas is pre-filled with black.
   *
   * @param ctx  Canvas 2D context
   * @param w    Canvas width in pixels
   * @param h    Canvas height in pixels
   */
  render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

  /**
   * Number of image tiles to use (1-3).
   * - 1: single 200x100 tile
   * - 2: 400x100 across 2 tiles (horizontal) or 200x200 (vertical)
   * - 3: 576x100 across 3 tiles (full width)
   * Default: 1
   */
  tiles?: 1 | 2 | 3;

  /**
   * Tile layout direction.
   * - 'horizontal': tiles placed side-by-side (default)
   * - 'vertical': tiles stacked top-to-bottom
   */
  tileLayout?: 'horizontal' | 'vertical';

  /**
   * Custom tile positions on the G2 display.
   * Override where each tile is placed. Array length must match `tiles` count.
   *
   * Example — center a single tile:
   *   tilePositions: [{ x: 188, y: 94 }]  // centered on 576x288
   *
   * Example — 2 tiles stacked vertically:
   *   tilePositions: [{ x: 0, y: 0 }, { x: 0, y: 100 }]
   *
   * Default: tiles placed side-by-side at y=0 (standard layout)
   */
  tilePositions?: TilePosition[];

  /**
   * Canvas size override. By default: (tiles * 200) x 100 for horizontal,
   * 200 x (tiles * 100) for vertical.
   * Use this when you need a different aspect ratio or resolution.
   */
  canvasSize?: { w: number; h: number };

  /**
   * Minimum time the splash should be visible (ms).
   * `waitMinTime()` will delay until this time has passed since `show()`.
   * Default: 2000
   */
  minTimeMs?: number;

  /**
   * Maximum time before the splash is forcefully dismissed (ms).
   * Set to 0 for no max. Default: 5000
   */
  maxTimeMs?: number;

  /**
   * Menu text shown below the image (in the text container).
   * Default: empty string (hidden)
   */
  menuText?: string;
}

export interface SplashHandle {
  /** Show the splash on the glasses. Returns when the image is sent. */
  show: (bridge: SplashBridge) => Promise<void>;
  /** Wait until minTimeMs has elapsed since show(). Resolves immediately if already elapsed. */
  waitMinTime: () => Promise<void>;
  /** Clear extra splash tiles (send black). Call after waitMinTime for seamless transition. */
  clearExtras: (bridge: SplashBridge) => Promise<void>;
  /** Check if the splash is currently showing. */
  isShowing: () => boolean;
  /** Get encoded tile data (for apps that manage their own bridge). */
  getTiles: () => { id: number; name: string; bytes: Uint8Array; x: number; y: number; w: number; h: number }[];
}

/** Minimal bridge interface needed for splash (subset of EvenHubBridge). */
export interface SplashBridge {
  showHomePage: (menuText: string, imageTiles?: { id: number; name: string; x: number; y: number; w: number; h: number }[]) => Promise<void>;
  sendImage: (containerId: number, containerName: string, pngBytes: Uint8Array) => Promise<void>;
}

/**
 * Preset tile positions for common layouts.
 */
export const TILE_PRESETS = {
  /** Single tile centered on the G2 display */
  centered1: [
    { x: Math.floor((DISPLAY_W - G2_IMAGE_MAX_W) / 2), y: Math.floor((DISPLAY_H - G2_IMAGE_MAX_H) / 2) },
  ] as TilePosition[],

  /** Single tile top-center */
  topCenter1: [
    { x: Math.floor((DISPLAY_W - G2_IMAGE_MAX_W) / 2), y: 20 },
  ] as TilePosition[],

  /** 2 tiles side-by-side, centered vertically */
  centered2: [
    { x: Math.floor((DISPLAY_W - 400) / 2), y: Math.floor((DISPLAY_H - G2_IMAGE_MAX_H) / 2) },
    { x: Math.floor((DISPLAY_W - 400) / 2) + G2_IMAGE_MAX_W, y: Math.floor((DISPLAY_H - G2_IMAGE_MAX_H) / 2) },
  ] as TilePosition[],

  /** 2 tiles stacked vertically, centered horizontally, near top */
  topCenterVertical2: [
    { x: Math.floor((DISPLAY_W - G2_IMAGE_MAX_W) / 2), y: 20 },
    { x: Math.floor((DISPLAY_W - G2_IMAGE_MAX_W) / 2), y: 20 + G2_IMAGE_MAX_H },
  ] as TilePosition[],

  /** 3 tiles full width at top */
  fullWidthTop: [
    { x: 0, y: 0 },
    { x: G2_IMAGE_MAX_W, y: 0 },
    { x: G2_IMAGE_MAX_W * 2, y: 0 },
  ] as TilePosition[],

  /** Default: standard side-by-side at y=0 */
  default: undefined,
};

export function createSplash(config: SplashConfig): SplashHandle {
  const tileCount = config.tiles ?? 1;
  const minTime = config.minTimeMs ?? 2000;
  const maxTime = config.maxTimeMs ?? 5000;
  const menuText = config.menuText ?? '';
  const positions = config.tilePositions;
  const vertical = config.tileLayout === 'vertical';

  const tileW = G2_IMAGE_MAX_W;  // 200
  const tileH = G2_IMAGE_MAX_H;  // 100
  const canvasW = config.canvasSize?.w ?? (vertical ? tileW : tileCount * tileW);
  const canvasH = config.canvasSize?.h ?? (vertical ? tileCount * tileH : tileH);

  let showTime = 0;
  let showing = false;
  let encodedTiles: { id: number; name: string; bytes: Uint8Array; x: number; y: number; w: number; h: number }[] = [];

  function renderAndEncode(): void {
    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d')!;

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // App-specific rendering
    config.render(ctx, canvasW, canvasH);

    // Encode each tile
    encodedTiles = [];
    for (let i = 0; i < tileCount; i++) {
      const slot = IMAGE_TILES[i]!;
      const pos = positions?.[i];
      const cropX = vertical ? 0 : i * tileW;
      const cropY = vertical ? i * tileH : 0;
      const cropW = Math.min(tileW, canvasW - cropX);
      const cropH = Math.min(tileH, canvasH - cropY);
      const crop = { sx: cropX, sy: cropY, sw: cropW, sh: cropH };
      const enc = encodeTilesBatch(canvas, [{ crop, name: slot.name }], tileW, tileH)[0]!;

      encodedTiles.push({
        id: slot.id,
        name: slot.name,
        bytes: enc.bytes,
        x: pos?.x ?? slot.x,
        y: pos?.y ?? slot.y,
        w: pos?.w ?? tileW,
        h: pos?.h ?? tileH,
      });
    }

    // Fill remaining tiles with black
    if (tileCount < 3) {
      const black = document.createElement('canvas');
      black.width = tileW;
      black.height = tileH;
      const bctx = black.getContext('2d')!;
      bctx.fillStyle = '#000000';
      bctx.fillRect(0, 0, tileW, tileH);
      const blackEnc = encodeTilesBatch(black, [{ crop: { sx: 0, sy: 0, sw: tileW, sh: tileH }, name: 'black' }], tileW, tileH)[0]!;

      for (let i = tileCount; i < 3; i++) {
        const slot = IMAGE_TILES[i]!;
        encodedTiles.push({
          id: slot.id,
          name: slot.name,
          bytes: blackEnc.bytes,
          x: slot.x,
          y: slot.y,
          w: tileW,
          h: tileH,
        });
      }
    }
  }

  return {
    async show(bridge: SplashBridge): Promise<void> {
      renderAndEncode();
      showTime = Date.now();
      showing = true;

      // Show the home layout with all image tiles
      const imageTiles = encodedTiles
        .filter((_, i) => i < tileCount)
        .map(t => ({ id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h }));
      await bridge.showHomePage(menuText, imageTiles);

      // Send only the app tiles (not black padding tiles)
      for (let i = 0; i < tileCount; i++) {
        const tile = encodedTiles[i]!;
        await bridge.sendImage(tile.id, tile.name, tile.bytes);
      }

      // Auto-dismiss after maxTime
      if (maxTime > 0) {
        setTimeout(() => { showing = false; }, maxTime);
      }
    },

    async waitMinTime(): Promise<void> {
      const elapsed = Date.now() - showTime;
      if (elapsed < minTime) {
        await new Promise((r) => setTimeout(r, minTime - elapsed));
      }
      showing = false;
    },

    async clearExtras(bridge: SplashBridge): Promise<void> {
      // Send black tiles for any extra splash tiles (e.g. tile 2 "Loading...")
      // so they don't linger when transitioning to the home screen with fewer tiles.
      if (encodedTiles.length === 0) return;
      const black = document.createElement('canvas');
      black.width = tileW;
      black.height = tileH;
      const bctx = black.getContext('2d')!;
      bctx.fillStyle = '#000000';
      bctx.fillRect(0, 0, tileW, tileH);
      const blackEnc = encodeTilesBatch(black, [{ crop: { sx: 0, sy: 0, sw: tileW, sh: tileH }, name: 'black' }], tileW, tileH)[0]!;
      // Clear tiles beyond what the home screen uses (tile index 1+ for vertical 2-tile splash)
      for (let i = 1; i < encodedTiles.length; i++) {
        const tile = encodedTiles[i]!;
        await bridge.sendImage(tile.id, tile.name, blackEnc.bytes);
      }
    },

    isShowing(): boolean {
      return showing;
    },

    getTiles() {
      if (encodedTiles.length === 0) renderAndEncode();
      return encodedTiles;
    },
  };
}
