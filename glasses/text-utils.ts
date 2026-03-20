/**
 * Shared text utilities for G2 glasses display.
 */

/** Truncate text to maxLen, appending ~ if truncated */
export function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '~' : text;
}

/** Up arrow scroll indicator */
export const SCROLL_UP = '\u25B2';  // ▲

/** Down arrow scroll indicator */
export const SCROLL_DOWN = '\u25BC';  // ▼

/**
 * Build a header line with title on the left and action bar on the right.
 *
 * @param title     Left-side text (e.g. "Step 1/4: Toast the pepper")
 * @param actionBar Right-side action bar string from buildActionBar()
 */
export function buildHeaderLine(title: string, actionBar: string): string {
  return `${title}  ${actionBar}`;
}

/**
 * Apply scroll indicators to a windowed line array.
 * Replaces the first/last visible line with ▲/▼ if there's more content above/below.
 *
 * @param lines       The visible lines array (will be mutated)
 * @param start       Start index into the full content
 * @param totalCount  Total number of content lines
 * @param visibleCount Number of visible lines in the window
 * @param lineFactory Function to create a DisplayLine (e.g. `(text) => line(text, 'meta', false)`)
 */
export function applyScrollIndicators<T>(
  lines: T[],
  start: number,
  totalCount: number,
  visibleCount: number,
  lineFactory: (text: string) => T,
): void {
  if (lines.length === 0) return;
  if (start > 0) {
    lines[0] = lineFactory(SCROLL_UP);
  }
  if (start + visibleCount < totalCount) {
    lines[lines.length - 1] = lineFactory(SCROLL_DOWN);
  }
}
