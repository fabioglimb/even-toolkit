/**
 * Pixel-accurate text measurement helpers for the G2 glasses.
 *
 * Wraps @evenrealities/pretext so toolkit consumers can measure text using
 * the same LVGL font metrics as Even Hub without depending on the package
 * directly.
 */

import {
  getAdvW,
  getTextWidth,
  measureTextWrap,
  pxTruncate,
} from '@evenrealities/pretext';

export {
  getAdvW,
  getTextWidth,
  measureTextWrap,
  pxTruncate,
};

export type MeasureTextWrapResult = ReturnType<typeof measureTextWrap>;

/** G2 text line height in pixels as rendered by LVGL. */
export const G2_TEXT_LINE_HEIGHT = 27;

/** Full-width G2 text container width in pixels. */
export const G2_TEXT_MAX_WIDTH = 576;

export interface GlassTextMeasureOptions {
  /** Outer text container width in pixels. Defaults to the full 576px display. */
  width?: number;
  /** Horizontal padding on each side, subtracted from width. */
  paddingX?: number;
  /** Border width on each side, subtracted from width. */
  borderWidth?: number;
}

export interface GlassTextMeasurement extends MeasureTextWrapResult {
  /** Inner content width passed to @evenrealities/pretext. */
  innerWidth: number;
  /** Largest measured line width in pixels. */
  maxLineWidth: number;
}

export type GlassTextWidthInput = number | GlassTextMeasureOptions;

/**
 * Resolve the inner text width for a G2 text container.
 *
 * Pass a number when you already have the inner width, or pass box options
 * when you want padding/border subtracted from an outer container width.
 */
export function getGlassTextInnerWidth(input: GlassTextWidthInput = G2_TEXT_MAX_WIDTH): number {
  if (typeof input === 'number') {
    return Math.max(0, input);
  }

  const {
    width = G2_TEXT_MAX_WIDTH,
    paddingX = 0,
    borderWidth = 0,
  } = input;

  return Math.max(0, width - 2 * (paddingX + borderWidth));
}

/**
 * Measure wrapped G2 text using EvenHub/LVGL font metrics.
 *
 * The returned height is text-only. Add any vertical padding or border from
 * your own container after measuring.
 */
export function measureGlassText(
  text: string,
  input: GlassTextWidthInput = G2_TEXT_MAX_WIDTH,
): GlassTextMeasurement {
  const innerWidth = getGlassTextInnerWidth(input);
  const measured = measureTextWrap(text, innerWidth);

  return {
    ...measured,
    innerWidth,
    maxLineWidth: Math.max(0, ...measured.lineWidths),
  };
}

/**
 * Truncate text to fit a G2 pixel width, appending "..." when needed.
 */
export function truncateGlassText(
  text: string,
  input: GlassTextWidthInput = G2_TEXT_MAX_WIDTH,
): string {
  return pxTruncate(text, getGlassTextInnerWidth(input));
}

/**
 * Check whether a single-line string fits inside the requested G2 pixel width.
 */
export function fitsGlassText(
  text: string,
  input: GlassTextWidthInput = G2_TEXT_MAX_WIDTH,
): boolean {
  return getTextWidth(text) <= getGlassTextInnerWidth(input);
}
