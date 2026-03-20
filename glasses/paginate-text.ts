/**
 * Text pagination utilities for G2 glasses display.
 *
 * Word-wraps text into lines, groups lines into pages, and generates
 * page indicators — useful for any app that shows multi-page text content.
 *
 * Usage:
 *   import { wordWrap, paginateText, pageIndicator } from 'even-toolkit/paginate-text';
 *
 *   const lines = wordWrap(longText, 46);
 *   const pages = paginateText(longText, 46, 9);
 *   const label = pageIndicator(2, pages.length);  // "Page 3/15"
 */

/**
 * Word-wrap text to a maximum line length, breaking at word boundaries.
 * Long words that exceed maxLen are force-split.
 *
 * @param text      The text to wrap
 * @param maxLen    Maximum characters per line (default 46 — fits G2 display)
 * @returns         Array of wrapped lines
 */
export function wordWrap(text: string, maxLen = 46): string[] {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const result: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxLen) {
      current += ' ' + word;
    } else {
      result.push(current);
      current = word;
    }
  }
  if (current) result.push(current);

  // Force-split lines that are still too long
  const final: string[] = [];
  for (const ln of result) {
    if (ln.length <= maxLen) {
      final.push(ln);
    } else {
      for (let i = 0; i < ln.length; i += maxLen) {
        final.push(ln.slice(i, i + maxLen));
      }
    }
  }

  return final.length > 0 ? final : [''];
}

/**
 * Paginate text into pages of fixed line count.
 * First word-wraps, then groups into pages.
 *
 * @param text          The text to paginate
 * @param charsPerLine  Max characters per line (default 46)
 * @param linesPerPage  Lines per page (default 9)
 * @returns             Array of pages, each page is an array of line strings
 */
export function paginateText(text: string, charsPerLine = 46, linesPerPage = 9): string[][] {
  const lines = wordWrap(text, charsPerLine);
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  return pages.length > 0 ? pages : [['']];
}

/**
 * Generate a page indicator string, e.g. "Page 3/15".
 *
 * @param currentIndex  Zero-based current page index
 * @param totalPages    Total number of pages
 * @returns             Human-readable page indicator
 */
export function pageIndicator(currentIndex: number, totalPages: number): string {
  return `Page ${currentIndex + 1}/${totalPages}`;
}
