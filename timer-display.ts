/**
 * Unicode timer display for G2 glasses.
 *
 * Confirmed working on G2:  █ (full block), ─ (box drawing horizontal)
 * NOT working on G2:  ░ ▒ ▓ (shading), ╔═╗║ (double box drawing), ▀▄ (half blocks)
 *
 * Renders as 2 lines — text centered using ─ padding to match bar width:
 *      ─────── ▶  06:44 ───────
 *      ████████████────────────
 */

const BLOCK_FULL = '\u2588';     // █  (filled portion)
const LINE_THIN = '\u2500';      // ─  (remaining portion + centering filler)
const ICON_PLAY = '\u25B6';      // ▶
const ICON_PAUSE = '\u2588';     // █  (single block for paused)
const ICON_DONE = 'OK';
const ICON_IDLE = '--';

export interface TimerState {
  running: boolean;
  remaining: number;
  total: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Center text above bar — spaces are ~4.5x narrower than █/─ on G2 font */
function center(text: string, barWidth: number): string {
  const pad = Math.max(0, Math.floor((barWidth - text.length) / 2));
  return ' '.repeat(Math.round(pad * 6.7)) + text;
}

/**
 * Render a 2-line timer display for the G2 glasses.
 * Line 1: ─── icon  MM:SS ─── (centered with ─ filler, same visual width as bar)
 * Line 2: ████████████──────── (progress bar)
 *
 * @param timer    Current timer state
 * @param barWidth Number of characters for the progress bar (default 24)
 */
export function renderTimerLines(timer: TimerState, barWidth = 18): string[] {
  const { running, remaining, total } = timer;

  if (total === 0 && remaining === 0) {
    return [
      center(` ${ICON_IDLE}  00:00 `, barWidth),
      LINE_THIN.repeat(barWidth),
    ];
  }

  if (remaining <= 0 && total > 0) {
    return [
      center(` ${ICON_DONE}  00:00 `, barWidth),
      BLOCK_FULL.repeat(barWidth),
    ];
  }

  const icon = running ? ICON_PLAY : ICON_PAUSE;
  const time = formatTime(remaining);
  const progress = total > 0 ? (total - remaining) / total : 0;
  const filled = Math.round(progress * barWidth);
  const empty = barWidth - filled;
  const bar = BLOCK_FULL.repeat(filled) + LINE_THIN.repeat(empty);

  return [
    center(` ${icon}  ${time} `, barWidth),
    bar,
  ];
}

/**
 * Render a single-line compact timer (for tight spaces).
 */
export function renderTimerCompact(timer: TimerState): string {
  const { running, remaining, total } = timer;

  if (total === 0 && remaining === 0) {
    return `${ICON_IDLE} 00:00`;
  }

  if (remaining <= 0 && total > 0) {
    return `${ICON_DONE} DONE`;
  }

  const icon = running ? ICON_PLAY : ICON_PAUSE;
  return `${icon} ${formatTime(remaining)}`;
}
