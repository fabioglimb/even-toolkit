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

export const GLASSES_TEXT_PREFIX = '  ';
export const GLASSES_SEPARATOR_WIDTH = 27;

export function line(text: string, style: LineStyle = 'normal', inverted = false): DisplayLine {
  return { text, inverted, style };
}

export function separator(): DisplayLine {
  return { text: '', inverted: false, style: 'separator' };
}

/**
 * Build a glasses header block: title + optional action bar + separator line.
 * Returns 2 DisplayLines: [header, separator]
 *
 * Usage:
 *   lines.push(...glassHeader('INBOX (3)'));
 *   lines.push(...glassHeader('Step 1/4', '▶Timer◀  Scroll'));
 */
export function glassHeader(title: string, actionBar?: string): DisplayLine[] {
  const text = actionBar ? `${title}  ${actionBar}` : title;
  return [
    { text, inverted: false, style: 'normal' as LineStyle },
    { text: '', inverted: false, style: 'separator' as LineStyle },
  ];
}

export function renderTextPageLine(line: DisplayLine): string {
  if (line.style === 'separator') return `${GLASSES_TEXT_PREFIX}${'─'.repeat(GLASSES_SEPARATOR_WIDTH)}`;
  if (line.inverted) return `▶ ${line.text}`;
  return `${GLASSES_TEXT_PREFIX}${line.text}`;
}

export function renderTextPageLines(lines: DisplayLine[]): string {
  return lines.map(renderTextPageLine).join('\n');
}

// ── Column layout types (for multi-text-container pages) ──

export interface ColumnData {
  /** One string per column — each column is a separate text container at a fixed pixel position */
  columns: string[];
}

export interface SplitLayout {
  /** Full-width header height in pixels */
  headerHeight?: number;
  /** Left pane width in pixels */
  leftWidth?: number;
  /** Right pane width in pixels; defaults to remaining width */
  rightWidth?: number;
}

export interface SplitData {
  /** Full-width top header block */
  header: string;
  /** Bottom-left pane */
  left: string;
  /** Bottom-right pane */
  right: string;
  /** Optional per-screen container sizing */
  layout?: SplitLayout;
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
  | 'split'     // fixed top header + two bottom panes
  | 'home'      // image tile + text + empty overlay (home screens)
  | 'chart';    // 3 image tiles + text (chart detail)

// ── Launch source ──

export type LaunchSource = 'appMenu' | 'glassesMenu';

// ── IMU data ──

export interface IMUData {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  timestamp: number;
}

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
