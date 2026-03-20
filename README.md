# even-toolkit

Design system & component library for **Even Realities G2** smart glasses apps.

55+ web components, 191 pixel-art icons, glasses SDK bridge, light/dark themes, and design tokens — all following the Even Realities 2025 UIUX Design Guidelines.

<!-- Live demo URL will be added here -->

## Install

```bash
npm install even-toolkit
```

## What's Inside

### `/web` — Web Component Library

55+ React components with Tailwind CSS, designed for mobile-first companion apps.

```tsx
import { Button, Card, NavBar, ListItem, Toggle, AppShell } from 'even-toolkit/web';
```

**Primitives:** Button, Card, Badge, Input, Textarea, Select, Checkbox, RadioGroup, Slider, InputGroup, Skeleton, Progress, StatusDot, Pill, Toggle, SegmentedControl, Table, Kbd, Divider

**Layout:** AppShell, Page, NavBar, NavHeader, ScreenHeader, SectionHeader, SettingsGroup, CategoryFilter, ListItem (swipe-to-delete), SearchBar, Tag, TagCarousel, TagCard, SliderIndicator, PageIndicator, StepIndicator, Timeline, StatGrid, StatusProgress

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

### `/glasses` — G2 Glasses SDK Bridge

Everything needed to render content on the G2 glasses display.

```tsx
import { useGlasses } from 'even-toolkit/useGlasses';
import { line, separator } from 'even-toolkit/types';
import { buildActionBar } from 'even-toolkit/action-bar';
```

**Core:** EvenHubBridge, useGlasses hook, useFlashPhase hook

**Display:** DisplayData, DisplayLine, line(), separator(), text-utils, timer-display, canvas-renderer

**Input:** action-map, gestures, keyboard bindings

**Layout:** 576x288px display, text/columns/chart/home page modes, image tiles

**Utilities:** splash screens, PNG encoding, text cleaning, pagination, keep-alive

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

## Quick Start

```tsx
// App.tsx
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
/* app.css */
@import "tailwindcss";
@import "even-toolkit/web/theme-light.css";
@import "even-toolkit/web/typography.css";
@import "even-toolkit/web/utilities.css";
```

## Apps Built With Even Toolkit

| App | Description | Live |
|-----|-------------|------|
| **EvenMarket** | Real-time stock market data on G2 glasses | [even-market.vercel.app](https://even-market.vercel.app) |
| **EvenKitchen** | Recipe management & step-by-step cooking | [even-kitchen.vercel.app](https://even-kitchen.vercel.app) |
| **EvenWorkout** | Workout tracking with rest timers | [even-workout.vercel.app](https://even-workout.vercel.app) |
| **EvenBrowser** | Text-based web browsing on G2 glasses | [even-browser.vercel.app](https://even-browser.vercel.app) |

## License

MIT
