const TAP_COOLDOWN_MS = 220;
const TAP_DUPLICATE_DEBOUNCE_MS = 90;
const DOUBLE_TAP_DUPLICATE_DEBOUNCE_MS = 140;
const SCROLL_SUPPRESS_AFTER_TAP_MS = 110;

// Tuned for G2 hardware — prevents double-scroll from duplicate events
const SAME_DIRECTION_DEBOUNCE_MS = 350;
const DIRECTION_CHANGE_DEBOUNCE_MS = 50;
const SCROLL_SUPPRESS_AFTER_TEXT_MS = 80;

let lastTapTime = 0;
let lastTapKind: 'tap' | 'double' | null = null;

export function tryConsumeTap(kind: 'tap' | 'double'): boolean {
  const now = Date.now();
  const elapsed = now - lastTapTime;
  const duplicateMs =
    kind === 'double' ? DOUBLE_TAP_DUPLICATE_DEBOUNCE_MS : TAP_DUPLICATE_DEBOUNCE_MS;

  if (kind === lastTapKind && elapsed < duplicateMs) {
    return false;
  }

  if (elapsed < TAP_COOLDOWN_MS && lastTapKind !== null) {
    return false;
  }

  lastTapTime = now;
  lastTapKind = kind;
  return true;
}

export function isScrollSuppressed(): boolean {
  return Date.now() - lastTapTime < SCROLL_SUPPRESS_AFTER_TAP_MS;
}

let lastScrollTime = 0;
let lastScrollDir: 'prev' | 'next' | null = null;
let textUpdateTime = 0;

/** Call after every text container update to suppress spurious G2 scroll events */
export function notifyTextUpdate(): void {
  textUpdateTime = Date.now();
}

export function isScrollDebounced(direction: 'prev' | 'next'): boolean {
  const now = Date.now();

  // Suppress scrolls briefly after a text update (G2 re-layout fires spurious events)
  if (now - textUpdateTime < SCROLL_SUPPRESS_AFTER_TEXT_MS) return true;

  const threshold =
    direction === lastScrollDir ? SAME_DIRECTION_DEBOUNCE_MS : DIRECTION_CHANGE_DEBOUNCE_MS;

  if (now - lastScrollTime < threshold) return true;

  lastScrollTime = now;
  lastScrollDir = direction;
  return false;
}
