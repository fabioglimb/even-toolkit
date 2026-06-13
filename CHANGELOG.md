# Changelog

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
