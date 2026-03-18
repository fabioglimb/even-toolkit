/**
 * Text cleaning utilities for G2 glasses display.
 *
 * The G2 supports basic Latin, Latin-1 Supplement, and common symbols.
 * These helpers strip emojis, unsupported Unicode, and normalize whitespace
 * so text renders cleanly on the monospace G2 display.
 *
 * Usage:
 *   import { cleanForG2, normalizeWhitespace } from 'even-toolkit/text-clean';
 *   const safe = cleanForG2('Hello 🌍 World!');  // "Hello World!"
 */

// Match emoji ranges + misc symbols + dingbats + variation selectors
const EMOJI_RE = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2702}-\u{27B0}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

// G2 supports basic Latin, Latin-1 Supplement, and some common symbols.
// Strip anything outside printable ASCII + common Latin extended + box drawing.
const UNSUPPORTED_RE = /[^\x20-\x7E\u00A0-\u00FF\u2010-\u2027\u2030-\u205E\u2190-\u21FF\u2500-\u257F]/g;

/**
 * Clean text for safe rendering on the G2 glasses display.
 * Strips emojis, unsupported Unicode characters, and normalizes whitespace.
 */
export function cleanForG2(text: string): string {
  return text
    .replace(EMOJI_RE, '')
    .replace(UNSUPPORTED_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize whitespace only (collapse multiple spaces/newlines, trim).
 * Does not strip Unicode — use when the text source is already safe.
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
