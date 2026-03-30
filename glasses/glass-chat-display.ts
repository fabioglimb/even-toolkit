/**
 * Chat/terminal output display builder for G2 glasses.
 * Optimized for reading streaming AI output on a 10-line text display.
 *
 * Line type prefixes:
 *   > user prompt
 *   >> tool call
 *   + collapsed thinking
 *   - expanded thinking header
 *   ! error
 *   (no prefix) assistant text
 */

import type { DisplayData, DisplayLine } from './types';
import { line, glassHeader } from './types';
import { applyScrollIndicators } from './text-utils';

export interface ChatLine {
  type: 'prompt' | 'text' | 'tool' | 'thinking-collapsed' | 'thinking-expanded' | 'thinking-body' | 'error' | 'system';
  text: string;
}

/**
 * Format a single ChatLine into one or more display strings,
 * word-wrapping at maxChars.
 */
export function formatChatLine(chatLine: ChatLine, maxChars = 44): string[] {
  const { type, text } = chatLine;

  let prefix: string;
  switch (type) {
    case 'prompt':
      prefix = '> ';
      break;
    case 'tool':
      prefix = '>> ';
      break;
    case 'thinking-collapsed':
      prefix = '+ ';
      break;
    case 'thinking-expanded':
      prefix = '- ';
      break;
    case 'thinking-body':
      prefix = '  ';
      break;
    case 'error':
      prefix = '! ';
      break;
    case 'system':
      prefix = '= ';
      break;
    case 'text':
    default:
      prefix = '';
      break;
  }

  const available = maxChars - prefix.length;
  if (text.length <= available) {
    return [`${prefix}${text}`];
  }

  // Word-wrap: try to break at word boundaries
  const lines: string[] = [];
  let remaining = text;
  let isFirst = true;

  while (remaining.length > 0) {
    const pfx = isFirst ? prefix : ' '.repeat(prefix.length);
    const avail = maxChars - pfx.length;

    if (remaining.length <= avail) {
      lines.push(`${pfx}${remaining}`);
      break;
    }

    // Find last space within available width
    let breakAt = remaining.lastIndexOf(' ', avail);
    if (breakAt <= 0) breakAt = avail; // no space found, hard break

    lines.push(`${pfx}${remaining.slice(0, breakAt)}`);
    remaining = remaining.slice(breakAt).trimStart();
    isFirst = false;
  }

  return lines;
}

export interface ChatDisplayOptions {
  /** Header title, e.g. "CLAUDE · opus · running" */
  title: string;
  /** Action bar string from buildStaticActionBar() */
  actionBar: string;
  /** Ordered chat lines to display */
  chatLines: ChatLine[];
  /** Scroll offset from bottom. 0 = show latest. Positive = scrolled up. */
  scrollOffset: number;
  /** Number of visible content lines. Default: 7 (10 total - 3 header) */
  contentSlots?: number;
  /** Max chars per line. Default: 44 */
  maxChars?: number;
}

/**
 * Build a complete chat display for G2 glasses.
 * Auto-scrolls to bottom (latest content) unless scrollOffset > 0.
 * Returns DisplayData with header + scrollable content.
 */
export function buildChatDisplay(opts: ChatDisplayOptions): DisplayData {
  const {
    title,
    actionBar,
    chatLines,
    scrollOffset,
    contentSlots = 7,
    maxChars = 44,
  } = opts;

  const lines = [...glassHeader(title, actionBar)];

  // Format all chat lines into display strings
  const allLines: string[] = [];
  for (const cl of chatLines) {
    allLines.push(...formatChatLine(cl, maxChars));
  }

  if (allLines.length === 0) {
    lines.push(line('  Waiting for output...', 'meta'));
    return { lines };
  }

  // Scroll from bottom: offset 0 = show last contentSlots lines
  const totalLines = allLines.length;
  const maxFromBottom = Math.max(0, totalLines - contentSlots);
  const clampedOffset = Math.min(scrollOffset, maxFromBottom);
  const start = Math.max(0, totalLines - contentSlots - clampedOffset);

  const visible = allLines.slice(start, start + contentSlots);
  const contentDisplayLines: DisplayLine[] = visible.map((t) => line(t, 'normal'));

  applyScrollIndicators(
    contentDisplayLines,
    start,
    totalLines,
    contentSlots,
    (t) => line(t, 'meta'),
  );

  lines.push(...contentDisplayLines);
  return { lines };
}
