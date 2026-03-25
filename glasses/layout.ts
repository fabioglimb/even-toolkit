// ── G2 display dimensions ──

export const DISPLAY_W = 576;
export const DISPLAY_H = 288;

// Default tile size (used by all existing apps)
export const G2_IMAGE_MAX_W = 200;
export const G2_IMAGE_MAX_H = 100;

// SDK 0.0.9 max image bounds (for apps that want larger tiles)
export const G2_IMAGE_LIMIT_W = 288;
export const G2_IMAGE_LIMIT_H = 144;

// ── Image tile slots (for chart layout: 3 tiles across the top) ──

export interface TileSlot {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  crop: { sx: number; sy: number; sw: number; sh: number };
}

export const TILE_1: TileSlot = {
  id: 2, name: 'tile-1',
  x: 0, y: 0, w: G2_IMAGE_MAX_W, h: G2_IMAGE_MAX_H,
  crop: { sx: 0, sy: 0, sw: 200, sh: 100 },
};

export const TILE_2: TileSlot = {
  id: 3, name: 'tile-2',
  x: 200, y: 0, w: G2_IMAGE_MAX_W, h: G2_IMAGE_MAX_H,
  crop: { sx: 200, sy: 0, sw: 200, sh: 100 },
};

export const TILE_3: TileSlot = {
  id: 4, name: 'tile-3',
  x: 400, y: 0, w: G2_IMAGE_MAX_W, h: G2_IMAGE_MAX_H,
  crop: { sx: 400, sy: 0, sw: 176, sh: 100 },
};

export const IMAGE_TILES = [TILE_1, TILE_2, TILE_3];

// ── Splash layout (1 centered image) ──

export const SPLASH_IMG = {
  id: 2,
  name: 'splash',
  x: Math.floor((DISPLAY_W - G2_IMAGE_MAX_W) / 2),
  y: Math.floor((DISPLAY_H - G2_IMAGE_MAX_H) / 2),
  w: G2_IMAGE_MAX_W,
  h: G2_IMAGE_MAX_H,
};

// ── Text-only layout (full screen) ──

export const TEXT_FULL = {
  id: 1,
  name: 'main',
  x: 0, y: 0,
  w: DISPLAY_W, h: DISPLAY_H,
};

// ── Viewport size per timeframe (ideal candle count for 576px chart) ──

export const VIEWPORT_PER_RESOLUTION: Record<string, number> = {
  '1': 40,   // 40 min
  '5': 32,   // ~2.5 hours
  '15': 28,  // ~7 hours
  '60': 24,  // 1 day
  'D': 28,   // ~1.5 months
  'W': 20,   // ~5 months
  'M': 16,   // ~1.5 years
};

// ── Chart canvas (rendered offscreen, then split into tiles) ──

export const CHART_CANVAS_W = 576;
export const CHART_CANVAS_H = 100;

// ── Chart layout text container (below images) ──

export const CHART_TEXT = {
  id: 1,
  name: 'main',
  x: 0,
  y: G2_IMAGE_MAX_H,
  w: DISPLAY_W,
  h: DISPLAY_H - G2_IMAGE_MAX_H,
};

// ── Default column positions for 3-column layout (apps can override) ──

export const DEFAULT_COLUMNS = {
  col1X: 0,
  col1W: 192,
  col2X: 192,
  col2W: 192,
  col3X: 384,
  col3W: DISPLAY_W - 384,
};

// ── Legacy compat ──

export const MAIN_SLOT = {
  id: 1,
  name: 'main',
  x: 0,
  y: 0,
  w: DISPLAY_W,
  h: DISPLAY_H - 2,
};

export const CONTAINER_IDS = [1, 2, 3] as const;

export function dummySlot(index: number) {
  return {
    id: CONTAINER_IDS[index]!,
    name: `d-${index + 1}`,
    x: 0,
    y: DISPLAY_H - 2,
    w: 1,
    h: 1,
  };
}
