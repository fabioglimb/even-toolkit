# even-toolkit

Design system & component library for **Even Realities G2** smart glasses apps.

55+ web components, 191 pixel-art icons, glasses SDK bridge with per-screen architecture, speech-to-text module, light/dark themes, and design tokens — all following the Even Realities 2025 UIUX Design Guidelines.

**[Live Demo → even-demo.vercel.app](https://even-demo.vercel.app)**

## Install

```bash
npm install even-toolkit
```

Scaffold a new app instantly:

```bash
npx create-even-app my-app
```

## What's Inside

### `/web` — Web Component Library

55+ React components with Tailwind CSS, designed for mobile-first companion apps.

```tsx
import { Button, Card, NavBar, ListItem, Toggle, AppShell } from 'even-toolkit/web';
```

**Primitives:** Button, Card, Badge, Input, Textarea, Select, MultiSelect, Checkbox, RadioGroup, Slider, InputGroup, Skeleton, Progress, StatusDot, Pill, Toggle, SegmentedControl, Table, Kbd, Divider

**Layout:** AppShell, Page, NavBar, NavHeader, SideDrawer, DrawerShell, DrawerTrigger, ScreenHeader, SectionHeader, SettingsGroup, CategoryFilter, ListItem (swipe-to-delete), SearchBar, Tag, TagCarousel, TagCard, SliderIndicator, PageIndicator, StepIndicator, Timeline, StatGrid, StatusProgress

**Feedback:** TimerRing, Dialog, ConfirmDialog, Toast, EmptyState, Loading, BottomSheet, CTAGroup, ScrollPicker, DatePicker, TimePicker, SelectionPicker

**Charts (recharts):** Sparkline, LineChart, BarChart, PieChart, StatCard

**Media:** ChatContainer, ChatInput, Calendar, FileUpload, VoiceInput, ImageGrid, ImageViewer, AudioPlayer

### `/web/icons` — 191 Pixel-Art Icons

Official Even Realities icon set: 32x32 grid, 2x2px units, 6 categories.

```tsx
import { IcChevronBack, IcTrash, IcSettings } from 'even-toolkit/web/icons/svg-icons';

<IcChevronBack width={20} height={20} />
```

**Categories:** Edit & Settings (32), Feature & Function (50), Guide System (20), Menu Bar (8), Navigate (23), Status (54), Health (12)

---

## Glasses SDK

Everything needed to build G2 glasses apps with a clean, per-screen architecture.

### Per-Screen Architecture (v1.4)

Each glasses screen lives in its own file with co-located display + action logic:

```
src/glass/
  shared.ts              — Snapshot type + actions interface
  selectors.ts           — Screen router (3 lines of wiring)
  splash.ts              — Splash image + loading text
  AppGlasses.tsx         — useGlasses hook setup
  screens/
    home.ts              — { display, action }
    detail.ts            — { display, action }
    active.ts            — { display, action }
```

#### Define a screen

```ts
import type { GlassScreen } from 'even-toolkit/glass-screen-router';
import { buildScrollableList } from 'even-toolkit/glass-display-builders';
import { moveHighlight } from 'even-toolkit/glass-nav';

export const homeScreen: GlassScreen<MySnapshot, MyActions> = {
  display(snapshot, nav) {
    return {
      lines: buildScrollableList({
        items: snapshot.items,
        highlightedIndex: nav.highlightedIndex,
        maxVisible: 5,
        formatter: (item) => item.title,
      }),
    };
  },

  action(action, nav, snapshot, ctx) {
    if (action.type === 'HIGHLIGHT_MOVE') {
      return { ...nav, highlightedIndex: moveHighlight(nav.highlightedIndex, action.direction, snapshot.items.length - 1) };
    }
    if (action.type === 'SELECT_HIGHLIGHTED') {
      ctx.navigate(`/item/${snapshot.items[nav.highlightedIndex].id}`);
      return nav;
    }
    return nav;
  },
};
```

#### Wire screens together

```ts
import { createGlassScreenRouter } from 'even-toolkit/glass-screen-router';
import { homeScreen } from './screens/home';
import { detailScreen } from './screens/detail';

export const { toDisplayData, onGlassAction } = createGlassScreenRouter({
  'home': homeScreen,
  'detail': detailScreen,
}, 'home');
```

### Navigation Helpers (`glass-nav`)

```ts
import { moveHighlight, clampIndex, calcMaxScroll, wrapIndex } from 'even-toolkit/glass-nav';

// Clamped movement (0 to max)
moveHighlight(current, 'up', max)    // Math.max(0, Math.min(max, current - 1))
moveHighlight(current, 'down', max)  // Math.max(0, Math.min(max, current + 1))

// Clamp index to button count
clampIndex(index, buttonCount)       // Math.min(Math.max(0, index), count - 1)

// Max scroll offset
calcMaxScroll(totalLines, slots)     // Math.max(0, totalLines - slots)

// Wrapping movement (loops around)
wrapIndex(current, 'down', count)    // (current + 1) % count
```

### Display Builders (`glass-display-builders`)

```ts
import {
  buildScrollableList,
  buildScrollableContent,
  slidingWindowStart,
  G2_TEXT_LINES,          // 10
  DEFAULT_CONTENT_SLOTS,  // 7 (below glassHeader)
} from 'even-toolkit/glass-display-builders';

// Scrollable highlighted list with scroll indicators
const lines = buildScrollableList({
  items: recipes,
  highlightedIndex: nav.highlightedIndex,
  maxVisible: 5,
  formatter: (r) => r.title,
});

// Header + scrollable content with indicators
const display = buildScrollableContent({
  title: 'Recipe Detail',
  actionBar: buildStaticActionBar(['Start'], 0),
  contentLines: ['Line 1', 'Line 2', ...],
  scrollPos: nav.highlightedIndex,
});
```

### Mode Encoding (`glass-mode`)

Pack multiple navigation modes into a single `highlightedIndex`:

```ts
import { createModeEncoder } from 'even-toolkit/glass-mode';

const mode = createModeEncoder({
  buttons: 0,    // 0-99: button selection
  scroll: 100,   // 100+: scroll mode (offset = index - 100)
  links: 200,    // 200+: link navigation
});

mode.getMode(150)    // 'scroll'
mode.getOffset(150)  // 50
mode.encode('scroll', 25)  // 125
```

### Route Mapping (`glass-router`)

```ts
import { createScreenMapper, createIdExtractor, getHomeTiles } from 'even-toolkit/glass-router';

const deriveScreen = createScreenMapper([
  { pattern: '/', screen: 'home' },
  { pattern: /^\/item\/[^/]+$/, screen: 'detail' },
], 'home');

const extractId = createIdExtractor(/^\/item\/([^/]+)/);
const homeTiles = getHomeTiles(appSplash);
```

### Core Glasses Modules

```ts
import { useGlasses } from 'even-toolkit/useGlasses';
import { useFlashPhase } from 'even-toolkit/useFlashPhase';
import { EvenHubBridge } from 'even-toolkit/bridge';
import { line, separator, glassHeader } from 'even-toolkit/types';
import { buildActionBar, buildStaticActionBar } from 'even-toolkit/action-bar';
import { truncate, applyScrollIndicators } from 'even-toolkit/text-utils';
import { renderTimerLines } from 'even-toolkit/timer-display';
import { formatGlassHeader, formatGlassListRow } from 'even-toolkit/glass-format';
import { renderChatBlocks, renderChatReadMode } from 'even-toolkit/glass-chat-display';
import { createSplash, TILE_PRESETS } from 'even-toolkit/splash';
```

**Display:** 576x288px, 10 text lines, text/columns/chart/home page modes, image tiles (max 288x144)

**Input:** action-map (tap/double-tap/scroll events), gestures (debounce + post-tap scroll suppression), keyboard bindings

**Utilities:** splash screens, PNG encoding, text cleaning, pagination, keep-alive, chat block formatters, reusable glass text formatting helpers

---

## Speech-to-Text (STT)

Provider-agnostic speech-to-text module for voice input in G2 glasses apps.

### Providers

| Provider | Type | Streaming | Requires |
|----------|------|-----------|----------|
| `whisper-api` | Cloud (OpenAI) | No (batch) | API key |
| `deepgram` | Cloud (Deepgram) | Yes (real-time) | API key |

### Quick Start

```tsx
import { useSTT } from 'even-toolkit/stt/react';

function VoiceInput() {
  const { transcript, isListening, start, stop } = useSTT({
    provider: 'whisper-api',
    language: 'en-US',
    apiKey: 'sk-...',
  });

  return (
    <div>
      <button onClick={isListening ? stop : start}>
        {isListening ? 'Stop' : 'Record'}
      </button>
      <p>{transcript}</p>
    </div>
  );
}
```

### Configuration

```tsx
useSTT({
  provider: 'whisper-api' | 'deepgram',
  language: 'en-US',        // BCP-47 language tag
  apiKey: 'your-key',       // Required for both providers
  vad: { silenceMs: 2500 }, // Auto-stop after silence (batch mode)
  chunkIntervalMs: 4000,    // Progressive transcription interval
  continuous: false,         // Don't auto-stop on silence
})
```

### Audio Sources

Automatically detects the best audio source:
- **Glasses mic** — via G2 bridge (`audioControl`)
- **Browser mic** — via `getUserMedia` (desktop)
- Custom `AudioSource` — pass your own

---

## SDK 0.0.9 Support

- Max image size: 288x144
- IMU control: `bridge.imuEnable()` / `bridge.imuDisable()`
- Launch source detection: `LaunchSource` type
- Fixed `borderRadius` spelling

## Design Tokens

Light theme following Even Realities 2025 guidelines:

```css
@import "even-toolkit/web/theme-light.css";
@import "even-toolkit/web/typography.css";
@import "even-toolkit/web/utilities.css";
```

| Token | Value | Usage |
|-------|-------|-------|
| `--color-text` | #232323 | Primary text (TC-1st) |
| `--color-text-dim` | #7B7B7B | Secondary text (TC-2nd) |
| `--color-bg` | #EEEEEE | Page background (BC-3rd) |
| `--color-surface` | #FFFFFF | Card/component background (BC-1st) |
| `--color-accent` | #232323 | Accent/highlight (BC-Highlight) |
| `--color-positive` | #4BB956 | Success/connected (TC-Green) |
| `--color-negative` | #FF453A | Error/warning (TC-Red) |
| `--color-accent-warning` | #FEF991 | Active/toast (BC-Accent) |
| `--radius-default` | 6px | Default border radius |
| `--font-display` | FK Grotesk Neue | Display & body font |

## Typography

| Style | Size | Weight | Tracking |
|-------|------|--------|----------|
| Very Large Title | 24px | 400 | -0.72px |
| Large Title | 20px | 400 | -0.6px |
| Medium Title | 17px | 400 | -0.17px |
| Medium Body | 17px | 300 | -0.17px |
| Normal Title | 15px | 400 | -0.15px |
| Normal Body | 15px | 300 | -0.15px |
| Normal Subtitle | 13px | 400 | -0.13px |
| Normal Detail | 11px | 400 | -0.11px |

## Navigation Patterns

### DrawerShell (recommended)

Side drawer navigation with automatic hamburger/back-button detection, header context for nested screens, and `bottomItems` for pinned items like Settings.

```tsx
import { DrawerShell, useDrawerHeader } from 'even-toolkit/web';
import type { SideDrawerItem } from 'even-toolkit/web';

// In your shell/layout:
const MENU_ITEMS: SideDrawerItem[] = [
  { id: '/', label: 'Home', section: 'App' },
];
const BOTTOM_ITEMS: SideDrawerItem[] = [
  { id: '/settings', label: 'Settings', section: 'App' },
];

function Shell() {
  return (
    <DrawerShell
      items={MENU_ITEMS}
      bottomItems={BOTTOM_ITEMS}
      title="MyApp"
      getPageTitle={(p) => p === '/' ? 'MyApp' : 'Page'}
      deriveActiveId={(p) => p}
    />
  );
}

// In nested screens — customize the header:
function DetailScreen() {
  useDrawerHeader({
    title: 'Detail',
    backTo: '/',                        // shows back button instead of hamburger
    right: <Button size="sm">Save</Button>,
    below: <Progress value={50} />,     // below header (progress bars)
    footer: <StepIndicator ... />,      // fixed bottom area
    hidden: true,                       // hide header entirely
  });
  return <div>...</div>;
}
```

### NavBar + AppShell (tab bar)

Horizontal tab bar for simpler apps.

```tsx
import { AppShell, NavBar, ScreenHeader, Button, Card } from 'even-toolkit/web';
import type { NavItem } from 'even-toolkit/web';

const tabs: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'settings', label: 'Settings' },
];

export function App() {
  const [tab, setTab] = useState('home');
  return (
    <AppShell header={<NavBar items={tabs} activeId={tab} onNavigate={setTab} />}>
      <div className="px-3 pt-4 pb-8">
        <ScreenHeader title="My App" />
        <Card>Hello from Even Toolkit</Card>
      </div>
    </AppShell>
  );
}
```

```css
@import "tailwindcss";
@import "even-toolkit/web/theme-light.css";
@import "even-toolkit/web/typography.css";
@import "even-toolkit/web/utilities.css";
```

## Apps Built With Even Toolkit

| App | Description | Live |
|-----|-------------|------|
| **EvenDemo** | Component showcase & design system reference | [even-demo.vercel.app](https://even-demo.vercel.app) |
| **EvenMarket** | Real-time stock market data on G2 glasses | [even-market.vercel.app](https://even-market.vercel.app) |
| **EvenKitchen** | Recipe management & step-by-step cooking | [even-kitchen.vercel.app](https://even-kitchen.vercel.app) |
| **EvenWorkout** | Workout tracking with rest timers | [even-workout.vercel.app](https://even-workout.vercel.app) |
| **EvenBrowser** | Text-based web browsing on G2 glasses | [even-browser.vercel.app](https://even-browser.vercel.app) |

## License

MIT
