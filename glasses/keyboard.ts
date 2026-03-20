import type { GlassAction } from './types';

export function bindKeyboard(dispatch: (action: GlassAction) => void): () => void {
  function isInteractive(el: HTMLElement): boolean {
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
    if (tag === 'BUTTON' || tag === 'A') return true;
    if (el.closest('button, a, [role="button"]')) return true;
    return false;
  }

  const keyHandler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        dispatch({ type: 'HIGHLIGHT_MOVE', direction: 'up' });
        break;
      case 'ArrowDown':
        e.preventDefault();
        dispatch({ type: 'HIGHLIGHT_MOVE', direction: 'down' });
        break;
      case 'Enter':
        e.preventDefault();
        dispatch({ type: 'SELECT_HIGHLIGHTED' });
        break;
      case 'Escape':
      case 'Backspace':
        e.preventDefault();
        dispatch({ type: 'GO_BACK' });
        break;
    }
  };

  // Mouse wheel on the glasses simulator panel for scroll navigation
  let lastWheelTime = 0;
  const WHEEL_DEBOUNCE_MS = 250;

  const wheelHandler = (e: WheelEvent) => {
    // Only trigger on the simulator panel (monospace pre/div), not on the web app content
    const target = e.target as HTMLElement;
    if (isInteractive(target)) return;

    const now = Date.now();
    if (now - lastWheelTime < WHEEL_DEBOUNCE_MS) return;
    lastWheelTime = now;

    if (e.deltaY > 0) {
      dispatch({ type: 'HIGHLIGHT_MOVE', direction: 'down' });
    } else if (e.deltaY < 0) {
      dispatch({ type: 'HIGHLIGHT_MOVE', direction: 'up' });
    }
  };

  document.addEventListener('keydown', keyHandler);
  document.addEventListener('wheel', wheelHandler, { passive: true });

  return () => {
    document.removeEventListener('keydown', keyHandler);
    document.removeEventListener('wheel', wheelHandler);
  };
}
