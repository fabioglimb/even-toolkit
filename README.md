# even-toolkit

Shared library for building **Even Realities G2 glasses** apps. Provides the bridge, display rendering, gesture handling, UI components, and utilities used across G2 web apps.

## Install

```bash
npm install even-toolkit
```

Peer dependencies (install in your app):
```bash
npm install @evenrealities/even_hub_sdk @jappyjan/even-better-sdk react react-router
```

## Modules

### Core

| Import | Description |
|--------|------------|
| `even-toolkit/types` | `DisplayData`, `DisplayLine`, `GlassAction`, `GlassNavState`, `line()`, `separator()` |
| `even-toolkit/bridge` | `EvenHubBridge` — wraps the SDK for text, column, chart, and image pages |
| `even-toolkit/useGlasses` | React hook to connect any app to G2 glasses (display, events, polling) |
| `even-toolkit/layout` | Display constants: `DISPLAY_W=576`, `DISPLAY_H=288`, image tile positions |

### Input

| Import | Description |
|--------|------------|
| `even-toolkit/action-map` | Maps raw SDK events to `GlassAction` (click→SELECT, scroll→HIGHLIGHT_MOVE, double-click→GO_BACK) |
| `even-toolkit/keyboard` | Keyboard bindings (arrows, enter, escape) + mouse wheel for simulator |
| `even-toolkit/gestures` | Tap/scroll debouncing tuned for G2 hardware |

### UI Components

| Import | Description |
|--------|------------|
| `even-toolkit/action-bar` | `buildActionBar()` — blinking `▶Name◀`/`▷Name◁` button bar, `buildStaticActionBar()` |
| `even-toolkit/timer-display` | `renderTimerLines()` — `█ 02:00` + progress bar for countdown timers |
| `even-toolkit/text-utils` | `truncate()`, `buildHeaderLine()`, `applyScrollIndicators()`, `SCROLL_UP`/`SCROLL_DOWN` |
| `even-toolkit/useFlashPhase` | React hook — 500ms boolean toggle for blinking indicators |

### Image Pipeline

| Import | Description |
|--------|------------|
| `even-toolkit/canvas-renderer` | Canvas-based chart/image rendering |
| `even-toolkit/composer` | Image composition utilities |
| `even-toolkit/png-utils` | 4-bit greyscale PNG encoding with upng-js |

### Other

| Import | Description |
|--------|------------|
| `even-toolkit/keep-alive` | Heartbeat to prevent SDK/webview sleep |

## Quick Start

```tsx
import { useGlasses } from 'even-toolkit/useGlasses';
import { line } from 'even-toolkit/types';
import { buildActionBar } from 'even-toolkit/action-bar';
import { renderTimerLines } from 'even-toolkit/timer-display';
import { useFlashPhase } from 'even-toolkit/useFlashPhase';

function MyGlasses() {
  const flashPhase = useFlashPhase(isActiveMode);

  useGlasses({
    getSnapshot: () => myAppState,
    toDisplayData: (snapshot, nav) => ({
      lines: [
        line(buildHeaderLine('My App', buildActionBar(['Action1', 'Action2'], 0, null, flashPhase)), 'normal'),
        line('Content here', 'meta'),
      ],
    }),
    onGlassAction: (action, nav, snapshot) => nav,
    deriveScreen: (path) => 'home',
    appName: 'my-app',
  });

  return null;
}
```

## G2 Display Constraints

- Display: 576x288 pixels, monospace green-on-black
- `█` (full block) and `─` (horizontal line) render correctly
- `░▒▓` (shading), `╔═╗║` (double box drawing), `▀▄` (half blocks) do NOT work
- Emoji codepoints are NOT supported
- Multi-line character art does NOT align across rows
- Image tiles: max 4 at 200x100 each, 4-bit greyscale PNG

## Used By

- [EvenKitchen](https://github.com/fabioglimb/even-kitchen) — Hands-free cooking companion
- [EvenMarket](https://github.com/fabioglimb/even-market) — Real-time stock market HUD
- EvenWorkout — Guided workout tracker
- EvenPlants — Plant care companion
- EvenCopilot — AI assistant

## License

MIT
