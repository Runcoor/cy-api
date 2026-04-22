# QuickStart 3D Book-Flip Redesign

## Overview

Redesign the `/quickstart` page from vertical accordion cards to a horizontal **3D book-flip** interface. The page keeps its existing 3-step flow (Create API Key → Top Up → Start Using) but presents it as an open book with left/right pages and realistic 3D page-turn animations.

## Layout

### Desktop (>= 768px): Open Book

```
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────┬──────────────────────┐           │
│  │     LEFT PAGE         │     RIGHT PAGE        │          │
│  │                       │                       │          │
│  │  Step icon (large)    │  Interactive content  │          │
│  │  Step title           │  (forms, inputs,      │          │
│  │  Step description     │   buttons, code)      │          │
│  │  Step number / total  │                       │          │
│  │                       │                       │          │
│  │  Progress dots: ● ○ ○ │                       │          │
│  │                       │                       │          │
│  └──────────────────────┴──────────────────────┘           │
│               ← Prev          Next →                       │
│                    page 1 of 3                              │
└────────────────────────────────────────────────────────────┘
```

- **Container**: max-width 960px, centered, with `perspective: 2000px`
- **Book**: Two halves side by side, joined at center spine
- **Left page**: Step overview — large icon, title, subtitle, progress indicator. Background slightly different shade. Acts as the "chapter cover".
- **Right page**: The actual interactive content from the existing steps (API key selection/creation, payment forms, tutorial code blocks). Scrollable if content exceeds page height.
- **Spine**: 2px center line with subtle gradient shadow simulating book binding
- **Navigation**: Bottom bar with Prev/Next buttons + step dots

### Mobile (< 768px): Single Page Slide

On mobile, the book layout doesn't work well. Fall back to:
- Single full-width card per step
- Horizontal swipe gesture support (CSS scroll-snap)
- Same step content, stacked vertically
- Navigation dots at bottom

## 3D Page Flip Animation

### Forward (Next step):
1. Right page lifts from right edge, rotates around center spine (Y-axis)
2. `transform: rotateY(0deg)` → `rotateY(-180deg)` with `transform-origin: left center`
3. During rotation past 90°, the "back" of the right page is revealed (showing next step's left-page content)
4. Simultaneously, the new right-page content fades in underneath
5. Duration: 600ms, easing: `cubic-bezier(0.645, 0.045, 0.355, 1.000)`

### Backward (Prev step):
- Reverse of the above — left page lifts from left edge, flips back to right

### CSS approach:
```css
.book-page {
  transform-style: preserve-3d;
  backface-visibility: hidden;
  transition: transform 600ms cubic-bezier(0.645, 0.045, 0.355, 1.000);
}
.book-page.flipping {
  transform: rotateY(-180deg);
}
```

Each "page" is a div with front/back faces positioned with `rotateY(180deg)` on the back face. The content on the back face is the next step's left-page overview.

### Shadow during flip:
- Gradient shadow on the page surface during rotation to simulate light/depth
- `box-shadow` animated from 0 → max → 0 during the flip

## Step Content (unchanged logic)

All existing step logic remains identical. The content is simply relocated into the right-page panel:

### Step 1 — Create API Key (right page)
- Existing tokens list (selectable)
- Create new key form
- Selected key display with copy/reveal
- "Use this key, next step" button

### Step 2 — Top Up (right page)
- Preset amount grid
- Custom amount input
- Payment method buttons (Stripe, Alipay, WeChat)
- Redemption code input
- Payment pending state
- Skip button

### Step 3 — Start Using (right page)
- Tool tabs (Claude Code, Cursor, Cline, Codex, Code)
- OS toggle (macOS/Windows)
- Syntax-highlighted code block with copy
- "View full tutorial" and "Enter console" buttons

### Left Page Content (new — overview panels)
Each step gets a decorative left page:

**Step 1 left**: Large Key icon, "Step 1 of 3", title "Create API Key", subtitle about getting started, maybe a small illustration
**Step 2 left**: Large Wallet icon, "Step 2 of 3", title "Top Up Balance", subtitle
**Step 3 left**: Large BookOpen icon, "Step 3 of 3", title "Start Using", subtitle

Plus a vertical progress indicator showing completed/current/pending steps.

## Component Structure

```
QuickStart (refactored)
├── BookContainer          — perspective wrapper + responsive layout
│   ├── BookSpine          — center decoration
│   ├── LeftPage           — step overview (icon, title, progress)
│   ├── RightPage          — step interactive content
│   └── FlipOverlay        — animated page during transition
├── BookNavigation         — prev/next buttons + step dots
└── (existing step content — extracted into StepContent1/2/3)
```

All in a single file `web/src/pages/QuickStart/index.jsx` (same as current). No new files needed — the book layout is UI restructuring, not new components.

## Styling

- Pure CSS animations — no external animation library
- All book styles scoped under `.qs-root` (existing pattern)
- CSS custom properties for book dimensions:
  - `--book-width: min(960px, 90vw)`
  - `--page-height: max(520px, 60vh)`
- Dark mode: same approach as current (CSS variables already handle it)
- Print: not needed for this page

## Interaction Details

- **Keyboard**: Left/Right arrow keys navigate steps
- **Click**: Prev/Next buttons
- **Auto-advance**: After completing a step action (e.g., selecting a key), auto-flip to next step with a 500ms delay (same as current `completeStep` behavior)
- **Direct jump**: Clicking step dots jumps to that step (with flip animation if adjacent, instant if >1 step away)
- **Content scroll**: Right page content is independently scrollable if it exceeds the page height

## Migration

- All existing state, API calls, and business logic remain unchanged
- The `StepCard` and `StepIndicator` components are removed (replaced by book layout)
- The header (Zap icon + "快速开始" title) moves above the book
- CSS animations (qs-fade-up, qs-scale-in, etc.) are replaced with book-flip animations

## i18n

No new translation keys needed — all text reuses existing keys from the current QuickStart page.

## No New Dependencies

Pure CSS 3D transforms + existing React state management. Zero new npm packages.
