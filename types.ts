// ── Display line types (legacy, still used for single-text pages) ──

export type LineStyle = 'normal' | 'meta' | 'separator' | 'inverted';

export interface DisplayLine {
  text: string;
  inverted: boolean;
  style: LineStyle;
}

export interface DisplayData {
  lines: DisplayLine[];
}

export function line(text: string, style: LineStyle = 'normal', inverted = false): DisplayLine {
  return { text, inverted, style };
}

export function separator(): DisplayLine {
  return { text: '', inverted: false, style: 'separator' };
}

// ── Column layout types (for multi-text-container pages) ──

export interface ColumnData {
  /** One string per column — each column is a separate text container at a fixed pixel position */
  columns: string[];
}

// ── Image tile types (for chart/image pages) ──

export interface ImageTileData {
  tiles: { id: number; name: string; bytes: Uint8Array }[];
  /** Text shown below images (or empty for no-bounce overlay) */
  text?: string;
}

// ── Page layout modes ──

export type PageMode =
  | 'splash'    // initial splash screen (text or image)
  | 'text'      // single full-screen text container (settings, simple screens)
  | 'columns'   // multiple side-by-side text containers (watchlist, tables)
  | 'home'      // image tile + text + empty overlay (home screens)
  | 'chart';    // 3 image tiles + text (chart detail)

// ── Glass action types ──

export type GlassActionType = 'HIGHLIGHT_MOVE' | 'SELECT_HIGHLIGHTED' | 'GO_BACK';

export type GlassAction =
  | { type: 'HIGHLIGHT_MOVE'; direction: 'up' | 'down' }
  | { type: 'SELECT_HIGHLIGHTED' }
  | { type: 'GO_BACK' };

export interface GlassNavState {
  highlightedIndex: number;
  screen: string;
}
