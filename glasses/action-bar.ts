/**
 * Shared action button bar for G2 glasses display.
 *
 * Renders a row of named buttons with triangle indicators:
 *   ▶Timer◀  ▷Scroll◁  Steps
 *
 * - Selected button (current highlight): empty triangles ▷Name◁
 * - Active button (entered mode, not highlighted): filled triangles ▶Name◀
 * - Inactive button: plain  Name
 */

/**
 * Build an action bar string from a list of button names.
 *
 * @param buttons   Array of button label strings, e.g. ['Timer', 'Scroll', 'Steps']
 * @param selectedIndex  Index of the currently highlighted button
 * @param activeLabel    Label of the currently active mode button, or null if in button-select mode
 * @param _flashPhase    Unused, kept for API compatibility
 */
export function buildActionBar(
  buttons: string[],
  selectedIndex: number,
  activeLabel: string | null,
  _flashPhase?: boolean,
): string {
  const activeIdx = activeLabel ? buttons.indexOf(activeLabel) : -1;

  return buttons.map((name, i) => {
    if (activeIdx === i) {
      // Active/confirmed button: filled triangles
      return `\u25B6${name}\u25C0`;
    }
    if (i === selectedIndex) {
      // Scroll highlight on a non-active button: empty triangles
      return `\u25B7${name}\u25C1`;
    }
    return ` ${name} `;
  }).join(' ');
}

/**
 * Build a static action bar (filled triangles on selected).
 * Useful for screens like recipe detail or completion where there's no mode switching.
 */
export function buildStaticActionBar(
  buttons: string[],
  selectedIndex: number,
): string {
  return buttons.map((name, i) => {
    if (i === selectedIndex) {
      return `\u25B6${name}\u25C0`;
    }
    return ` ${name} `;
  }).join(' ');
}
