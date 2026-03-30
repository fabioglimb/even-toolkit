/**
 * Glass display formatting constants and helpers.
 * Safe Unicode characters confirmed working on G2 LVGL display.
 * Inspired by tesla-even-g2 formatting patterns.
 */

/** Middle dot · field separator */
export const SEP = '\u00B7';

/** Single right-pointing angle › drill-in indicator */
export const DRILL = '\u203A';

/** Single left-pointing angle ‹ back prefix */
export const BACK_CHAR = '\u2039';

/** En-dash – result separator */
export const DASH = '\u2013';

/** Heavy horizontal ═ filled progress bar segment */
export const BAR_FILL = '\u2501';

/** Light horizontal ─ empty progress bar segment */
export const BAR_EMPTY = '\u2500';

/**
 * Join non-empty values with · separator.
 * Falsy values are filtered out.
 *
 * @example fieldJoin('CLAUDE', 'opus', 'running') → "CLAUDE · opus · running"
 * @example fieldJoin('HOSTS', false, '2 total') → "HOSTS · 2 total"
 */
export function fieldJoin(...parts: (string | undefined | null | false)[]): string {
  return parts.filter(Boolean).join(` ${SEP} `);
}

/**
 * Render an ASCII progress bar.
 * Uses ═ for filled and ─ for empty.
 *
 * @example progressBar(67) → "═══════───"
 * @example progressBar(30, 20) → "══════──────────────"
 */
export function progressBar(percent: number, width = 10): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return BAR_FILL.repeat(filled) + BAR_EMPTY.repeat(width - filled);
}

/**
 * Format a key · value pair, truncating value if needed.
 *
 * @example kvLine('Language', 'EN') → "Language · EN"
 */
export function kvLine(label: string, value: string, maxWidth = 44): string {
  const sep = ` ${SEP} `;
  const available = maxWidth - label.length - sep.length;
  const val = value.length > available ? value.slice(0, available - 1) + '~' : value;
  return `${label}${sep}${val}`;
}

/**
 * Append › drill-in indicator to a label.
 *
 * @example drillLabel('Sessions') → "Sessions ›"
 */
export function drillLabel(text: string): string {
  return `${text} ${DRILL}`;
}

/**
 * Build a "‹ Back" label for menu items.
 */
export function backLabel(): string {
  return `${BACK_CHAR} Back`;
}
