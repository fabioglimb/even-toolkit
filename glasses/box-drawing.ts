/**
 * Box drawing utilities for G2 glasses display.
 *
 * Uses Unicode box-drawing characters: ╭╮╯╰│─
 * These create card-like frames around content on the monospaced G2 display.
 */

const TOP_LEFT = '╭';
const TOP_RIGHT = '╮';
const BOTTOM_LEFT = '╰';
const BOTTOM_RIGHT = '╯';
const VERTICAL = '│';
const HORIZONTAL = '─';

/**
 * Wrap lines in a card with cornered top/bottom and left │ border.
 * No right │ on content lines (G2 font is proportional, right border won't align).
 *
 * ```
 * ╭────────────────╮
 * │ line 1
 * │ line 2
 * ╰────────────────╯
 * ```
 *
 * @param lines      Content lines to wrap
 * @param ruleWidth  Number of ─ chars between corners (default: auto from longest line + 2)
 * @returns Array of strings including top/bottom borders
 */
export function glassBox(lines: string[], ruleWidth = 8): string[] {
  const top = `${TOP_LEFT}${HORIZONTAL.repeat(ruleWidth)}${TOP_RIGHT}`;
  const bottom = `${BOTTOM_LEFT}${HORIZONTAL.repeat(ruleWidth)}${BOTTOM_RIGHT}`;
  const body = lines.map((l) => `  ${l}`);
  return [top, ...body, bottom];
}

/**
 * Horizontal rule (no corners) for section dividers.
 *
 * @param width  Total character width
 */
export function glassRule(width: number): string {
  return HORIZONTAL.repeat(width);
}

/**
 * Single left-bordered line: │ text
 */
export function glassBoxLine(text: string): string {
  return `${VERTICAL} ${text}`;
}
