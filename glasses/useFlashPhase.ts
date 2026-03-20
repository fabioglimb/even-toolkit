/**
 * Shared flash phase hook for blinking action button indicators.
 * Toggles a boolean every 500ms when active.
 *
 * Usage:
 *   const flashPhase = useFlashPhase(isInActiveMode);
 */

import { useState, useEffect } from 'react';

const FLASH_INTERVAL_MS = 500;

export function useFlashPhase(active: boolean): boolean {
  const [phase, setPhase] = useState(false);

  useEffect(() => {
    if (!active) {
      setPhase(false);
      return;
    }

    const interval = setInterval(() => {
      setPhase((prev) => !prev);
    }, FLASH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [active]);

  return phase;
}
