# TripleOneBars — Brand Design System

> **Version 1.0** · A bold, energetic visual system built for athletes who train hard and demand more from their gear, their gym, and their brand.

---

## Table of Contents

1. [Brand Foundation](#1-brand-foundation)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Grid System](#5-grid-system)
6. [Component Library](#6-component-library)
7. [Iconography](#7-iconography)
8. [Illustration & Photography](#8-illustration--photography)
9. [Motion & Animation](#9-motion--animation)
10. [Voice & Tone](#10-voice--tone)
11. [Do's and Don'ts](#11-dos-and-donts)
12. [Application Examples](#12-application-examples)

---

## 1. Brand Foundation

### Brand Essence
TripleOneBars is built for athletes who don't just train — they hunt progress. Calisthenics, CrossFit, strength athletes, and gym warriors who want bars, rigs, and gear that match their intensity.

### Personality Attributes
| Attribute | Description |
|---|---|
| **Bold** | We don't whisper. Big type, high contrast, decisive moves. |
| **Energetic** | Movement is in our DNA. Designs feel kinetic, never static. |
| **Disciplined** | Strong grids, clean ratios — the structure beneath the energy. |
| **Inclusive** | Built for every athlete, beginner bar to elite competitor. |
| **Uncompromising** | Premium feel. Nothing soft, nothing dilute. |

### Brand Voice Pillars
- **Direct** — say it in five words, not fifteen
- **Confident** — never apologetic, never hedging
- **Athletic** — the language of training, not marketing fluff
- **Respectful** — we never punch down at beginners

---

## 2. Color System

### Core Palette

The system runs on three weapons: red for energy, black for power, white for clarity. Everything else supports.

#### Primary — Triple Red
The signature color. Used for primary actions, brand moments, energy accents. Never use for large background fills longer than a banner strip.

| Token | HEX | RGB | HSL | Usage |
|---|---|---|---|---|
| `red-500` (Brand Red) | `#E10600` | 225, 6, 0 | 358°, 100%, 44% | Primary brand color, CTAs, logo |
| `red-600` (Hover) | `#B30500` | 179, 5, 0 | 358°, 100%, 35% | Button hover, pressed states |
| `red-700` (Active) | `#8C0400` | 140, 4, 0 | 358°, 100%, 27% | Active/pressed, deep accents |
| `red-400` (Light) | `#FF2D24` | 255, 45, 36 | 2°, 100%, 57% | Highlights, focus rings |
| `red-300` (Soft) | `#FF7A75` | 255, 122, 117 | 2°, 100%, 73% | Tints, subtle alerts |
| `red-100` (Tint) | `#FFE5E4` | 255, 229, 228 | 2°, 100%, 95% | Backgrounds for red emphasis |

#### Secondary — Power Black
The structural foundation. Anchors layouts, carries hero imagery, communicates strength.

| Token | HEX | RGB | Usage |
|---|---|---|---|
| `black` (True) | `#000000` | 0, 0, 0 | Logo, pure contrast moments |
| `black-900` (Onyx) | `#0A0A0A` | 10, 10, 10 | Backgrounds, hero sections |
| `black-800` (Steel) | `#1A1A1A` | 26, 26, 26 | Cards on dark, modal scrims |
| `black-700` (Graphite) | `#262626` | 38, 38, 38 | Borders on dark, dividers |

#### Tertiary — Clean White
The breathing space. Lets the red and black perform.

| Token | HEX | Usage |
|---|---|---|
| `white` (Pure) | `#FFFFFF` | Backgrounds, reverse-out text |
| `white-100` (Bone) | `#FAFAFA` | Page backgrounds, subtle panels |
| `white-200` (Chalk) | `#F4F4F4` | Card backgrounds, hover states |

### Neutral Scale
For body copy, borders, disabled states, and information hierarchy.

| Token | HEX | Usage |
|---|---|---|
| `gray-50` | `#FAFAFA` | App backgrounds |
| `gray-100` | `#F5F5F5` | Subtle fills |
| `gray-200` | `#E5E5E5` | Borders, dividers |
| `gray-300` | `#D4D4D4` | Disabled borders |
| `gray-400` | `#A3A3A3` | Placeholder text, icons |
| `gray-500` | `#737373` | Secondary text |
| `gray-600` | `#525252` | Body text on light |
| `gray-700` | `#404040` | Strong body text |
| `gray-800` | `#262626` | Headlines on light |
| `gray-900` | `#171717` | Maximum text contrast on light |

### Semantic Colors
Functional colors for system feedback. **Note**: error red is intentionally distinct from brand red so users can distinguish "danger" from "brand."

| State | Token | HEX | Usage |
|---|---|---|---|
| **Success** | `success-500` | `#16A34A` | Confirmations, completed sets |
| | `success-100` | `#DCFCE7` | Success backgrounds |
| **Warning** | `warning-500` | `#F59E0B` | Cautions, recovery zone |
| | `warning-100` | `#FEF3C7` | Warning backgrounds |
| **Error** | `error-500` | `#DC2626` | Form errors, destructive actions |
| | `error-100` | `#FEE2E2` | Error backgrounds |
| **Info** | `info-500` | `#2563EB` | Neutral information |
| | `info-100` | `#DBEAFE` | Info backgrounds |

### Color Combination Rules

**Approved primary pairings:**
- Black background + White text + Red accent (signature combo)
- White background + Black text + Red accent (everyday workhorse)
- Red background + White text only (hero moments, banners)

**Contrast ratios — must always meet WCAG AA:**
- Body text: minimum 4.5:1
- Large text (18pt+): minimum 3:1
- UI components: minimum 3:1

**Red on Black is approved** at large display sizes only (32pt+). For body text, never use Triple Red on black — switch to white.

---

## 3. Typography

### Type Stack

The system uses a two-font partnership: a bold condensed display face for impact, and a clean neutral sans for clarity. Optional mono for stats/timers.

#### Display — Bebas Neue
The voice of the brand. All caps, condensed, athletic. Used for headlines, hero text, hero stat numbers, and any moment that needs presence.

```css
font-family: "Bebas Neue", "Anton", Impact, sans-serif;
font-weight: 400; /* Bebas only ships one weight */
letter-spacing: 0.02em;
text-transform: uppercase;
```

**Fallback stack:** Anton → Oswald → Impact → sans-serif

#### Body — Inter
The workhorse. Used for everything that isn't a headline — body copy, UI labels, captions, navigation, forms.

```css
font-family: "Inter", -apple-system, "Helvetica Neue", Arial, sans-serif;
font-feature-settings: "cv11", "ss01", "ss03"; /* improved digits and punctuation */
```

**Weights to license:**
- Inter 400 (Regular) — body copy
- Inter 500 (Medium) — UI labels, emphasis
- Inter 600 (Semibold) — subheads, button text
- Inter 700 (Bold) — strong emphasis, small headlines
- Inter 900 (Black) — alternative display for non-condensed moments

#### Monospace — JetBrains Mono (Optional)
For timers, set counts, weights, rep ranges, and any numeric stat that wants a "stopwatch" feel.

```css
font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
font-weight: 500;
font-variant-numeric: tabular-nums;
```

### Type Scale

A 1.25 modular scale (Major Third) — aggressive enough for energy, controlled enough to stay usable.

| Token | Size | Line Height | Use |
|---|---|---|---|
| `text-xs` | 12px / 0.75rem | 1.5 (18px) | Captions, metadata, legal |
| `text-sm` | 14px / 0.875rem | 1.5 (21px) | Small UI text, helper text |
| `text-base` | 16px / 1rem | 1.6 (26px) | Body copy default |
| `text-lg` | 18px / 1.125rem | 1.6 (29px) | Lead paragraphs, emphasized body |
| `text-xl` | 20px / 1.25rem | 1.4 (28px) | Small subheads |
| `text-2xl` | 24px / 1.5rem | 1.3 (31px) | Section subheads |
| `text-3xl` | 32px / 2rem | 1.2 (38px) | Subheads (display font) |
| `text-4xl` | 40px / 2.5rem | 1.1 (44px) | Page headings |
| `text-5xl` | 56px / 3.5rem | 1.05 (59px) | Section heroes |
| `text-6xl` | 72px / 4.5rem | 1 (72px) | Hero headlines |
| `text-7xl` | 96px / 6rem | 0.95 (91px) | Mega hero (desktop only) |
| `text-display` | 120px+ | 0.9 | Editorial moments, posters |

### Heading Defaults

| Tag | Font | Size | Weight | Transform |
|---|---|---|---|---|
| `h1` | Bebas Neue | text-6xl → text-4xl (mobile) | 400 | uppercase |
| `h2` | Bebas Neue | text-5xl → text-3xl | 400 | uppercase |
| `h3` | Bebas Neue | text-4xl → text-2xl | 400 | uppercase |
| `h4` | Inter | text-2xl | 700 | none |
| `h5` | Inter | text-xl | 600 | none |
| `h6` | Inter | text-base | 700 | uppercase, letter-spacing: 0.1em |

### Typography Rules

- **Never stretch type.** No artificial bold/italic. Use real weights only.
- **Bebas Neue is uppercase-only.** Never set in mixed case.
- **Long-form body copy never uses Bebas.** Always Inter. Reading 200+ words of all-caps condensed type is brutal.
- **Numeric stats use tabular-nums.** Keeps digits aligned in tables and counters.
- **Maximum line length: 70 characters** for body copy. Use `max-w-prose` or equivalent.

---

## 4. Spacing & Layout

### Base Unit
The entire system snaps to a **4px base unit**, with primary multiples at 8px. This keeps everything aligned and rhythm clean.

### Spacing Scale

| Token | Value | Use |
|---|---|---|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Hairline gaps, icon-to-text |
| `space-2` | 8px | Tight padding, chip gaps |
| `space-3` | 12px | Compact UI |
| `space-4` | 16px | Default UI padding |
| `space-5` | 20px | Generous UI padding |
| `space-6` | 24px | Card padding, form spacing |
| `space-8` | 32px | Section gaps, large card padding |
| `space-10` | 40px | Component separation |
| `space-12` | 48px | Block-level spacing |
| `space-16` | 64px | Section spacing (mobile) |
| `space-20` | 80px | Section spacing (desktop) |
| `space-24` | 96px | Major section breaks |
| `space-32` | 128px | Page-level breaks, hero spacing |

### Layout Container Widths

| Token | Width | Use |
|---|---|---|
| `container-sm` | 640px | Reading width, blog content |
| `container-md` | 768px | Forms, narrow sections |
| `container-lg` | 1024px | Standard content |
| `container-xl` | 1280px | Default page container |
| `container-2xl` | 1440px | Wide marketing layouts |
| `container-full` | 100% | Full-bleed sections |

### Border Radius

Bold and energetic doesn't mean rounded. Keep radii tight and structural.

| Token | Value | Use |
|---|---|---|
| `radius-none` | 0px | Default for primary buttons, structural blocks |
| `radius-sm` | 2px | Subtle softening on inputs |
| `radius-md` | 4px | Cards, modals |
| `radius-lg` | 8px | Soft cards, alerts |
| `radius-full` | 9999px | Pills, badges, avatars |

### Elevation / Shadows

Subtle. The brand carries weight through type and color, not floaty drop shadows.

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards, dropdowns |
| `shadow-lg` | `0 12px 24px rgba(0,0,0,0.12)` | Modals, overlays |
| `shadow-xl` | `0 24px 48px rgba(0,0,0,0.16)` | Hero cards, popovers |
| `shadow-red` | `0 8px 24px rgba(225,6,0,0.32)` | Hero CTAs only — use sparingly |

---

## 5. Grid System

### Desktop Grid
- **12 columns**
- **24px gutters**
- **Max width: 1280px** (with 1440px option for editorial)
- **Outer margin: 64px**

### Tablet Grid (768–1023px)
- **8 columns**
- **20px gutters**
- **Outer margin: 32px**

### Mobile Grid (< 768px)
- **4 columns**
- **16px gutters**
- **Outer margin: 16px**

### Breakpoints

| Token | Min Width | Device |
|---|---|---|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large displays |

---

## 6. Component Library

### Buttons

Buttons are the brand's loudest UI moment. Square corners, hard transitions, no apologetic softness.

#### Primary Button
```
Background:    red-500 (#E10600)
Text:          white
Font:          Inter 600, 14px or 16px
Letter-spacing: 0.05em
Text-transform: uppercase
Padding:       12px 24px (default), 16px 32px (large)
Border-radius: 0px
Border:        none
Transition:    background 150ms ease

Hover:    background red-600 (#B30500)
Active:   background red-700 (#8C0400)
Focus:    outline 2px red-400, outline-offset 2px
Disabled: background gray-300, color gray-500, cursor not-allowed
```

#### Secondary Button (Outline)
```
Background:    transparent
Text:          black or white (depends on bg)
Border:        2px solid currentColor
Padding:       10px 22px (accounts for border)
Font:          Inter 600, uppercase, 0.05em tracking

Hover:    background black, text white (on light bg)
          background white, text black (on dark bg)
Active:   background red-500, text white, border red-500
```

#### Tertiary Button (Ghost)
```
Background:    transparent
Text:          black or current
Padding:       12px 16px
Border:        none

Hover:    background gray-100 (light) / black-800 (dark)
Active:   underline + red-500 text
```

#### Destructive Button
```
Same as Primary but background error-500 (#DC2626)
Hover: darker shade #B91C1C
```

#### Button Sizes

| Size | Padding | Font Size | Height |
|---|---|---|---|
| `sm` | 8px 16px | 12px | 32px |
| `md` (default) | 12px 24px | 14px | 40px |
| `lg` | 16px 32px | 16px | 52px |
| `xl` | 20px 40px | 18px | 64px |

### Cards

Hard edges. Defined borders. No bouncy radii.

#### Default Card
```
Background:    white
Border:        1px solid gray-200
Border-radius: 4px
Padding:       24px
Shadow:        shadow-sm (rest), shadow-md (hover)
```

#### Hero / Feature Card
```
Background:    black-900 (#0A0A0A)
Text:          white
Border-radius: 0px (sharp brand moment)
Padding:       32px
Border-left:   4px solid red-500 (optional accent stripe)
```

#### Product Card
```
Background:    white
Border:        1px solid gray-200
Border-radius: 4px
Image-aspect:  4:5 portrait (calisthenics gear photographs well tall)
Padding:       16px (image area edge-to-edge)
Title:         Bebas Neue, text-2xl, uppercase
Price:         Inter 700, text-lg, red-500
```

### Form Inputs

#### Text Input
```
Background:      white
Border:          1px solid gray-300
Border-radius:   2px
Padding:         12px 16px
Font:            Inter 400, 16px (prevents iOS zoom)
Color:           gray-900
Placeholder:     gray-400
Height:          44px (touch-friendly)

Focus:    border red-500, box-shadow 0 0 0 3px red-100
Error:    border error-500, box-shadow 0 0 0 3px error-100
Disabled: background gray-100, color gray-400
```

#### Label
```
Font:            Inter 600, 14px
Color:           gray-800
Text-transform:  uppercase
Letter-spacing:  0.05em
Margin-bottom:   8px
```

#### Helper / Error Text
```
Font:            Inter 400, 12px
Color:           gray-500 (helper) or error-500 (error)
Margin-top:      6px
```

#### Checkbox / Radio
```
Size:            20x20px
Border:          2px solid gray-400
Border-radius:   2px (checkbox), 9999px (radio)
Checked:         background red-500, border red-500
                 white checkmark / dot
Focus:           outline 2px red-400, offset 2px
```

### Badges & Tags

Used for status, categories, difficulty levels, product attributes.

#### Default Badge
```
Background:      gray-100
Color:           gray-800
Font:            Inter 600, 11px, uppercase
Letter-spacing:  0.08em
Padding:         4px 8px
Border-radius:   2px (sharp) or 9999px (pill — use sparingly)
```

#### Variants
| Variant | Background | Text Color | Use |
|---|---|---|---|
| `default` | gray-100 | gray-800 | Neutral categories |
| `primary` | red-500 | white | Featured, sale, new |
| `dark` | black-900 | white | Premium, hero |
| `success` | success-100 | success-500 (darker) | Completed, in stock |
| `warning` | warning-100 | #92400E | Limited, low stock |
| `error` | error-100 | error-500 (darker) | Sold out, expired |
| `outline` | transparent | currentColor | Subtle category tags |

### Alerts / Banners

```
Padding:         16px 20px
Border-radius:   4px
Border-left:     4px solid [variant color]
Icon:            24x24, left-aligned, color matches border
Title:           Inter 600, 14px
Body:            Inter 400, 14px, gray-700
```

### Navigation

#### Top Nav (Desktop)
```
Height:          72px
Background:      white or black-900
Border-bottom:   1px solid gray-200 (light) or transparent (dark)
Logo:            32px height, left
Links:           Inter 600, 14px, uppercase, 0.05em tracking
Link gap:        32px
Hover:           color red-500
Active:          color red-500, underline 2px below
```

#### Mobile Nav
```
Hamburger icon → full-screen overlay
Background:      black-900
Links:           Bebas Neue, text-4xl, white
Active link:     red-500
Padding:         48px 24px
```

### Modals / Dialogs

```
Backdrop:        black, 80% opacity, blur 8px
Container:       white background
Max-width:       560px
Border-radius:   4px
Padding:         32px
Close button:    top-right, 24x24, gray-500, hover red-500
Header:          Bebas Neue, text-3xl, uppercase
Body:            Inter 400, 16px
Action buttons:  right-aligned, gap 12px
```

---

## 7. Iconography

### Style Direction
- **Line weight:** 2px stroke, consistent across the icon set
- **Style:** Geometric, slightly rounded line caps, no flourishes
- **Grid:** 24x24px artboard with 20x20px live area
- **Corners:** 2px outer radius, square inner intersections
- **Color:** Single color (currentColor), recolor via parent

**Recommended icon libraries** (any will fit the system):
- Lucide (preferred — clean, 2px strokes, athletic feel)
- Phosphor Icons (Regular weight)
- Tabler Icons

### Icon Sizes

| Size | Use |
|---|---|
| 16px | Inline with text, dense UI |
| 20px | Form fields, list items |
| 24px | Default UI, buttons |
| 32px | Feature lists, navigation |
| 48px+ | Hero icons, empty states |

### Brand Icon Treatment
For hero moments, custom icons can use a **red-on-black square badge**: 64x64px black square, white 32px icon centered, optional red corner accent. Use sparingly — once per page maximum.

---

## 8. Illustration & Photography

### Photography Direction

The visual heart of TripleOneBars. Strong, athletic, real.

#### Style
- **High contrast** — deep blacks, bright whites, no flat midtones
- **Action over portrait** — athletes mid-rep, mid-pull, mid-effort
- **Sweat is welcome** — authenticity beats polish
- **Diverse athletes** — calisthenics, CrossFit, gym, mixed body types and skill levels
- **Equipment-forward** — bars, rigs, plates as hero elements

#### Color Treatment
- Desaturated by 15–25% with crushed blacks
- Optional duotone treatment: black + red-500 for editorial moments
- Skin tones must remain natural — desaturation never on people's faces
- Backgrounds: gym environments, concrete, brick, industrial

#### Composition
- Strong diagonals (athletes mid-movement)
- Negative space on one side for type overlay
- Tight crops on grip, muscle, sweat, focus
- Avoid: studio-lit "fitness model" stock photos, over-polished gym selfies

### Illustration Style (when needed)

- **Geometric**, built from rectangles and triangles — never overly organic
- **Limited palette**: black, white, red-500, one neutral
- **Flat with intentional weight** — no gradients, occasional grain texture
- **Use cases**: empty states, error pages, abstract concepts, onboarding

### Texture & Grain

Subtle grain overlay (5–10% opacity) on hero imagery adds editorial weight. Never use plastic/sleek vector backgrounds.

---

## 9. Motion & Animation

Movement should feel **decisive**, not bouncy. Athletes don't waste energy — neither should the UI.

### Easing Curves

| Token | Curve | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, reveals (default) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, dismissals |
| `ease-snap` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Quick UI feedback |
| `ease-linear` | linear | Progress bars, timers, loaders |

### Duration

| Token | Value | Use |
|---|---|---|
| `duration-instant` | 100ms | Hover state changes |
| `duration-fast` | 150ms | Button presses, small transitions |
| `duration-base` | 200ms | Most UI animations |
| `duration-slow` | 300ms | Modals, drawers, larger reveals |
| `duration-hero` | 500ms | Page transitions, hero sequences |

### Motion Rules
- **Reduced motion**: respect `prefers-reduced-motion` — disable parallax, autoplay, decorative motion
- **No bouncing**: avoid spring easings that overshoot — feels childish, off-brand
- **Slide and reveal** over fade-only — direction implies energy
- **Numeric counters**: animate up on scroll (rep counts, stats, member numbers)

---

## 10. Voice & Tone

### How TripleOneBars Talks

**We say:**
- "Train harder. Train smarter."
- "Built for the bar."
- "Your next PR starts here."
- "Sets, reps, repeat."
- "Hit the rig."

**We don't say:**
- "Maximize your fitness journey" *(corporate)*
- "Embrace wellness" *(soft)*
- "Unleash your inner champion" *(cliché)*
- "Synergize with our community" *(jargon)*

### Tone by Context

| Context | Tone | Example |
|---|---|---|
| Marketing / Hero | Bold, commanding | "Get on the bar. Today." |
| Product copy | Direct, spec-driven | "31mm steel. 1000lb static load. Knurled grip." |
| Confirmation | Encouraging, brief | "Logged. Hit it again tomorrow." |
| Error states | Helpful, no drama | "That email's not in the system. Try another?" |
| Empty states | Motivating | "No workouts logged yet. Time to fix that." |
| Onboarding | Welcoming but tough | "You showed up. That's step one." |

### Writing Rules
- **Sentences under 15 words** wherever possible
- **Active voice always**
- **Numbers as numerals** (3 reps, not three reps) — looks athletic, scans fast
- **Cut filler**: very, really, actually, just
- **Imperative mood for CTAs**: "Start training" beats "Get started"

---

## 11. Do's and Don'ts

### Color

✅ **DO**
- Use red as the accent — a sharp 10–20% of any composition
- Default backgrounds to white or black
- Use red on black only for headlines (32pt+)
- Maintain WCAG AA contrast at all times

❌ **DON'T**
- Use red as a full-page background (it screams, then exhausts)
- Combine red with secondary brand colors not in this system (no blues, oranges, purples)
- Use red and error-red side by side — pick one context
- Drop opacity on the brand red below 100% for type

### Typography

✅ **DO**
- Use Bebas Neue for headlines, hero numbers, and short impact phrases
- Pair it with Inter for everything readable
- Keep body line length under 70 characters
- Use tabular numerals for stats and timers

❌ **DON'T**
- Set body copy in Bebas Neue (uppercase + condensed = unreadable at length)
- Mix more than two typefaces on a single screen (mono optional, for stats)
- Italicize Bebas Neue (fake italic looks broken)
- Use system fonts as a "shortcut" — always load the real fonts

### Layout

✅ **DO**
- Respect the 4px grid and the 8px primary rhythm
- Use generous whitespace — bold doesn't mean cramped
- Anchor compositions with a strong vertical or diagonal
- Lead with a hero element, then ladder down

❌ **DON'T**
- Stack too many CTAs in one section (one primary, max one secondary)
- Center-align long-form body copy
- Use floating drop shadows on everything — keep elevation purposeful
- Break the grid for no reason — energy comes from rhythm, not chaos

### Imagery

✅ **DO**
- Use real athletes in real environments
- Embrace high contrast, deep shadows, gritty texture
- Crop tight on action moments
- Leave intentional negative space for type

❌ **DON'T**
- Use sterile, smiley stock fitness photography
- Apply heavy filters that flatten or recolor skin tones
- Mix illustration styles on the same page
- Use red-tinted photos as backgrounds for body copy

### Components

✅ **DO**
- Keep buttons square or barely rounded (2–4px max)
- Use uppercase tracked labels for buttons and form labels
- Anchor cards with a clear hierarchy: image → headline → meta → CTA
- Add a 4px red accent stripe to feature cards for brand presence

❌ **DON'T**
- Use pill-shaped primary buttons (loses athletic edge)
- Add gradients to buttons (cheapens the brand)
- Layer translucent glassmorphism — it fights the brand's solidity
- Use emoji as UI icons in product surfaces

---

## 12. Application Examples

### Hero Section (Marketing)
```
Background:  black-900 full-bleed image of athlete on rings
Overlay:     linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.2))
Headline:    Bebas Neue, text-7xl, white, "BUILT FOR THE BAR"
Sub:         Inter 500, text-lg, gray-300, max-w-md
CTA:         Primary red button "Shop the Rigs"
            + Tertiary ghost button "Watch the Film"
```

### Product Page
```
Layout:      2-column desktop (image left 60%, info right 40%)
Image:       black background, 1:1 ratio, optional 360° rotation
Title:       Bebas Neue, text-4xl, "TRIPLE-RING PRO 31MM"
Price:       Inter 700, text-3xl, red-500
Specs:       Mono table, gray-700 labels, gray-900 values
CTA:         Primary button, full-width on mobile
```

### Workout Card (App)
```
Card:        black-900 background, 4px radius
Border-left: 4px red-500
Title:       Bebas Neue, text-2xl, white
Stats:       3-column grid — Sets | Reps | Time
Stat label:  Inter 600, text-xs, uppercase, gray-400
Stat value:  Mono, text-3xl, white, tabular-nums
Action:      Ghost button "Start" with red play icon
```

### Email Newsletter
```
Container:   600px max-width, white background
Header:      72px tall, black-900, logo + nav
Hero:        full-bleed image, type overlay
Body:        Inter 400, 16px, gray-700, 1.6 line-height
Headlines:   Bebas Neue, text-3xl, uppercase
CTA:         Red button, centered, 240px wide
Footer:      black-900, white text, social icons
```

---

## Implementation Notes

### Recommended Tech
- **Tailwind CSS** — configure `tailwind.config.js` with the tokens above
- **CSS Custom Properties** — for non-Tailwind contexts, expose tokens as `--color-red-500` etc.
- **Figma** — set up styles + variables matching every token in this doc
- **Font hosting** — self-host Inter and Bebas Neue via `@font-face` for performance and reliability

### Token Naming Convention
```
[category]-[name]-[scale]
color-red-500
space-4
text-lg
shadow-md
radius-sm
```

### Versioning
This is version **1.0**. Future changes should be logged with semantic versioning:
- **Major** (2.0): visual identity overhaul, new typeface
- **Minor** (1.1): new components, expanded scales
- **Patch** (1.0.1): bug fixes, clarifications

---

## Quick Reference Card

```
PRIMARY RED      #E10600
DEEP BLACK       #0A0A0A
PURE WHITE       #FFFFFF

DISPLAY FONT     Bebas Neue (uppercase only)
BODY FONT        Inter (400/500/600/700)
MONO FONT        JetBrains Mono (stats)

BASE UNIT        4px (snap everything to it)
DEFAULT RADIUS   0–4px (stay sharp)
DEFAULT CTA      Red, square, uppercase, tracked

VOICE            Direct. Confident. Athletic.
MOTION           Decisive, never bouncy.
IMAGERY          Real athletes. High contrast. Grit.
```

---

*TripleOneBars Design System v1.0 — built to be referenced, extended, and held to.*
