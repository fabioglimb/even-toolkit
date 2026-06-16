# Changelog

## 1.7.7

Released: 2026-06-16

No breaking changes. All additions are backward-compatible (new optional props default to existing behavior).

### Added

- `SwipeToDelete` — wrapper component that reveals a red trash/delete affordance on left-swipe for **arbitrary children** (touch swipe, direction lock, vertical-scroll passthrough, async/loading delete). Use it for rich list cards that can't fit `ListItem`'s title/subtitle model.
- `Calendar`:
  - **Drag-to-move events in week view** (previously day-view only), with column→day / offset→time mapping. New `onEventDrop` / `onEventMove` callbacks fire on drop in both day and week views.
  - `swipeToNavigate` (default `true`) — swipe the calendar body left/right to change the visible month/week/day. Automatically suppressed while an event is being dragged.
  - Per-render split-pane width overrides via the split `layout` (`leftWidth` / `rightWidth` / `paneWidths`) so consumers can widen a pane without changing the shared defaults.
  - Full-width Month/Week/Day view switcher; capitalized localized month label (e.g. "Giugno 2026"); centered week-view day header.
  - Event blocks use `touch-action: pan-y` (a swipe scrolls; drag only on press-and-hold) and native scrolling is blocked during an active drag so vertical drags aren't hijacked. Text selection is disabled across the calendar.

### Fixed

- `SegmentedControl` now grows to contain wrapped labels (min-height instead of a fixed height), so long options (e.g. "In Waiting Room") no longer overflow the control.
- `ListItem` swipe-to-delete background now uses `rounded-[6px]` to match the rounded row (was square-cornered behind it).

## 1.7.6

Released: 2026-06-15

No breaking changes.

### Added

- `useGlasses({ headerClock: true })` — shows the current time (HH:MM) right-aligned in the header of every glass screen (text + split modes), refreshed each minute. Centralizes the on-glasses clock so apps don't render their own.
- `ImageViewer` now supports touch-swipe navigation (drag left/right) in addition to the arrow buttons and keyboard.

## 1.7.5

Unreleased.

No breaking changes.

### Fixed

- `Checkbox` could not be deselected by clicking the box itself (only the label text worked). The box `<button>` was nested inside a `<label>`, so a direct click dispatched twice. The component is now a single `<button>`, so one click toggles once.

## 1.7.4

Unreleased.

No breaking changes.

### Added

- `error?: boolean | string` prop on `Input`, `Select`, and `Textarea` — renders a red inset ring (and `aria-invalid`) when truthy, plus an inline error message below the field when a string is passed. Enables consistent form-validation feedback across apps.

## 1.7.3

Unreleased.

No breaking changes.

### Added

- `even-toolkit/pretext` deep export for pixel-accurate G2 text measurement, truncation, and wrapped-height prediction via `@evenrealities/pretext`
- `DrawerShell` `defaultRight` prop — always-visible header right-slot content (e.g. a clock) rendered alongside any per-screen `useDrawerHeader` `right` override

## 1.6.3

Released: 2026-04-03

No breaking changes.

### Added

- shared bridge-only storage now uses the official `waitForEvenAppBridge()` flow for app persistence helpers

### Changed

- `NavHeader` string titles are now strictly centered even when only the left slot is populated
- shared storage no longer mirrors to browser `localStorage`

### Notes

- this release is intended for current Even Hub / QR bridge persistence behavior

## 1.6.2

Released: 2026-04-02

No breaking changes.

### Added

- `DrawerShell` header overrides now accept full React node titles cleanly for embedded controls like browser URL bars

### Changed

- `NavHeader` no longer reserves empty left or right spacing when those slots are unused
- header layout handling is more reliable for screens that need full-width interactive content in the title area

### Notes

- This release is backward compatible with existing 1.6.x consumers.

## 1.5.0

Released: 2026-03-31

No breaking changes.

### Added

- new glasses helpers `glass-format` and `glass-chat-display`
- new web `MultiSelect` component export
- README refresh to reflect the current published surface area

### Changed

- action bar hover/active triangle semantics now match the latest glasses UX
- glasses gesture handling is more reliable for settings editing and immediate scroll changes
- Deepgram STT shutdown noise is suppressed during intentional close
- dialog background scroll locking is stronger on web/touch devices
- swipe-to-delete rows now support loading feedback through the shared list item
- SVG navigate icon now inherits current color correctly for dark buttons

### Notes

- This release is backward compatible with existing 1.4.x imports.
- Consumers can upgrade without code changes unless they were depending on old visual bugs.
