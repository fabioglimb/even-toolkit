/**
 * Unicode timer display for G2 glasses.
 *
 * Confirmed working on G2:  █ (full block), ─ (box drawing horizontal)
 * NOT working on G2:  ░ ▒ ▓ (shading), ╔═╗║ (double box drawing), ▀▄ (half blocks)
 */

const BLOCK_FULL = '\u2588';     // █  (filled portion)
const LINE_THIN = '\u2500';      // ─
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

/**
 * Render a 2-line timer display for the G2 glasses.
 * Both the timer label and the progress bar are returned flush-left.
 * `barWidth` still controls the visual width of the progress bar itself.
 *
 * @param timer    Current timer state
 * @param barWidth Number of characters for the progress bar
 * @param frameWidth Unused visual frame width retained for call-site compatibility
 */
export function renderTimerLines(timer: TimerState, barWidth = 18, frameWidth = barWidth): string[] {
  const { running, remaining, total } = timer;
  void frameWidth;

  if (total === 0 && remaining === 0) {
    return [
      `${ICON_IDLE}  00:00`,
      LINE_THIN.repeat(barWidth),
    ];
  }

  if (remaining <= 0 && total > 0) {
    return [
      `${ICON_DONE}  00:00`,
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
    `${icon}  ${time}`,
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
