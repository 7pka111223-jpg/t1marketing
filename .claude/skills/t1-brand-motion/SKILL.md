---
name: t1-brand-motion
description: >
  TripleOneBars brand pack for huashu-motion. Load this together with the
  huashu-motion skill whenever making motion graphics, an animated Reel, a
  Reel cover, a kinetic-type post, a coach talking-head package or any video
  for TripleOneBars / T1. It fixes the palette, fonts (Bebas Neue, Inter,
  JetBrains Mono, Cairo for Egyptian Arabic), motion rules, 9:16 Reel
  layout, language and CTA rules, so the film is on-brand without
  re-deriving the brand from the design-system doc.
---

# TripleOneBars motion brand pack

This is an overlay on [huashu-motion](https://github.com/alchaincyf/huashu-motion), not a fork of it.
huashu-motion still directs the film (directions, rhythm, sound, render, QA). This skill answers
everything huashu-motion would otherwise go and find: the brand's colours, type, motion feel,
format and voice. Where the two disagree, this file wins for T1 films.

Sources, in order of authority:
1. `docs/tripleonebars_design_system.md` (v1.0): colour, type, motion, imagery.
2. `docs/strategy/instagram-content-strategy.md`: Reel structure (§19), language (§21), visual direction (§30), covers (§31).
3. `CONTEXT.md`: Lead Keywords, Proof Records, Lanes.

Where the design system's voice examples talk about selling gear ("Shop the Rigs", "31mm steel"), ignore them. TripleOneBars is a
calisthenics gym selling training. Copy follows the strategy doc.

## Setup for every film

1. huashu-motion must be installed (`npx skills add alchaincyf/huashu-motion -a claude-code`, or clone it and
   symlink `skills/huashu-motion` into `~/.claude/skills/`). It needs Chrome: on a machine without Google
   Chrome, set `OM_CHROME` to a Chromium binary.
2. After `om new <dir>`, copy the brand pack in:
   ```sh
   mkdir -p <dir>/assets/fonts
   cp .claude/skills/t1-brand-motion/fonts/*.woff2 <dir>/assets/fonts/
   cp .claude/skills/t1-brand-motion/t1-brand.css <dir>/t1-brand.css
   ```
   Then add `<link rel="stylesheet" href="t1-brand.css">` to `index.html`, delete the template's own
   `@font-face` lines and fonts, and use the `--t1-*` variables and `.t1-*` classes.
3. **Logo.** No logo file is in this repo yet. huashu-motion's rule holds: the logo on screen is the real file,
   never redrawn. If `.claude/skills/t1-brand-motion/assets/logo.svg` (or `.png`) does not exist, ask the user
   for it before the end card. The red square with "T1" in the dashboard sidebar is a UI placeholder, not the logo.
4. **Signature.** huashu-motion puts "Made with huashu-motion" on the last 1.2 s by default. The owner has not
   decided whether T1's posts carry it. Ask once before the first render and record the answer here.

## Palette lines for direction cards

Use these instead of finding colours. Every direction uses one of them. The three directions differ in
motion language and material, not in colour (huashu-motion `colour.md` §1 is already answered).

```
Palette:  ground #0A0A0A 75 · surface #1A1A1A 10 · ink #FFFFFF · muted #A3A3A3 · accent #E10600 15 — from: T1 brand design system §2, app/globals.css (signature: black + white + red)
Palette:  ground #FFFFFF 75 · surface #F4F4F4 10 · ink #0A0A0A · muted #525252 · accent #E10600 15 — from: T1 brand design system §2, app/globals.css (workhorse: white + black + red)
Palette:  ground #0A0A0A 70 · surface #1A1A1A 10 · ink #FFFFFF · accent #E10600 15 · flood #E10600 — from: T1 brand design system §2 + §8 (black/red duotone footage, red flood on the beat)
```

Keep the word "brand" in each `— from:`. `om swatch` only treats a palette as the product's own when its source
names one (`brand`, `css`, `logo`…); otherwise it flags T1 Red as its "warm orange-red house look" and tells the
agent to change a direction's hue. For T1 that warning is wrong: the red is the brand. Never change it to satisfy the check.

Rules huashu-motion will not know:
- **Red is the accent at 10–20% of the frame.** That is more than huashu-motion's "a few per cent" default; the brand doc sets it.
- **No full-frame red that holds.** A red flood is allowed as a wipe or a single hero beat of 1 s at most, twice per film at most.
  Red with copy on it is a band (a strip across the frame), not the whole frame. White type only on red.
- **Red type on black only at display size.** At 1080 wide, that means Bebas Neue at 64 px or more. Captions and small text are white.
- **No other hues.** No blues, oranges, purples, no gradients on shapes, no glow, no glassmorphism. The only gradient allowed is a black legibility scrim over footage.
  The semantic colours (success green etc.) are UI-only and never appear in a film.
- **Light is grain, not glow.** Ground gets a 5–10% film grain and a vignette in the ground's own black, never a coloured bloom.

## Type

| Role | Face | How |
|---|---|---|
| Headlines, hook words, cover titles, big numbers | Bebas Neue | `.t1-display`: uppercase only, never italic, never mixed case |
| Supporting English lines, labels | Inter 500–700 | `.t1-body`; labels uppercase with 0.05–0.1em tracking |
| Reps, sets, times, Proof numbers | JetBrains Mono 500 | `.t1-mono`, tabular numerals, count up on the beat |
| Egyptian Arabic | Cairo 700/900 for hooks, 400 for lines | `.t1-ar`; English terms inside an Arabic line go in `<span class="en">` |

- Bebas has no Arabic. Never let an Arabic line fall back from Bebas; set it in `.t1-ar`.
- Digits are Western (3 sets, 8 reps), in Arabic lines too, matching the strategy doc's examples.
- On-screen text: one idea per frame, at most about 6 words per line, at most 2 lines. "Too much text on Reel frames" is a listed failure.
- Never more than two faces in one frame (mono for a stat is the allowed third).

## Motion

The brand's rule is "decisive, never bouncy". In huashu-motion terms:

| Brand token | In a GSAP timeline |
|---|---|
| `ease-out` `cubic-bezier(0.22,1,0.36,1)` (entrances, default) | `power4.out` (same quint-out curve) |
| `ease-in` `cubic-bezier(0.4,0,1,1)` (exits) | `power2.in` |
| `ease-snap` `cubic-bezier(0.2,0.8,0.2,1)` (hits, quick feedback) | `power3.out` |
| any spring | `OM.spring(0)` only. Bounce 0 is critically damped and never overshoots. Never `OM.spring(0.1)` or higher. |

- Slide and reveal over fade: things enter from a direction (a mask wipe, a slam from off-frame, a red band wiping across), never a plain opacity fade.
- Entrances settle in 0.3–0.5 s; a hero move takes up to 0.8 s. Nothing drifts or floats.
- Numbers count up (reps, sets, weeks), and land on the beat.
- Diagonals: the brand composes on strong diagonals (an athlete mid-movement), so a camera move or wipe on a diagonal fits.

Template fit (`om templates`):
- **Good fits:** `kinetic-type` (key word slams in, colour band wipes: make the band T1 red), `talking-head` (coach and member Reels in 9:16), `blank`, `finance-chart` restyled for a Proof Record number, `object-3d` for the logo once a real file exists.
- **Restyle or avoid:** `keynote-ui` (glow, blur and glass cards break the brand), `vox-collage` (paper and string), `storytime`, `kurzgesagt`, `math-3b1b`, `whiteboard`. Each brings its own world, and T1's world is the gym.

## Reel format

- Canvas `data-width="1080" data-height="1920"`, 30 fps. Make 16:9 or 4:5 cuts with `om fork <dir> <newdir> --size 1080x1350`.
- **Safe area:** keep type and faces out of the top 250 px, the bottom 420 px (caption and buttons) and the right 140 px (like/comment/share).
  These margins are estimates of Instagram's overlay and should be checked against a real upload. Run `om check` for cut-off text.
- **Grid crop:** the profile grid shows a 3:4 centre crop (1080×1440), so cover titles sit in the middle 1440 px.
- **Structure** (strategy §19): hook 0–2 s with a strong visual already on frame 0; setup 2–6 s; demonstration or escalation 6–18 s; payoff 18–25 s; CTA 25–30 s only if needed.
  Humour runs 8–18 s. Not every Reel reaches 30 s.
- **Cover families** (strategy §31), title in Bebas: SKILL ("CAN YOU DO THIS?", athlete mid-skill), LEARN ("FIX YOUR PULL-UP", technique frame), T1 ("COACH LOGIC #01", character image).
  Same hierarchy every time, not identical layouts.

## Material and imagery

- The "product" is real training: real members and coaches, real footage. Never AI-generated athletes or stock fitness imagery.
- Footage treatment: high contrast, crushed blacks, desaturated 15–25%, never on skin. Black + red duotone only for editorial moments.
- Leave negative space on one side of footage for type.
- **Numbers:** any result shown (3 → 8 pull-ups) must come from a Proof Record in T1 Context, with the person's on-camera consent. Never invent or round a result.

## Language and CTA

- Egyptian Arabic + English, written from the idea, not translated (strategy §21). Gym terms stay English: pull-up, muscle-up, handstand, transition, set, reps, drill, clean reps.
- Voice: direct, confident, athletic, sentences under 15 words, imperative CTAs, numerals for numbers. Never "fitness journey", "unleash", "wellness".
- **End card CTA uses a Lead Keyword**, always in English and in its canonical spelling: "DM PULL-UP", "DM MU", "DM START". Online Lane films use only COACHING, ONLINE or PLAN.
  A Comment Keyword ("Comment MU") is engagement, not a lead; never present it as the sign-up path.
- End on the brand: real logo, `tripleonebars.com`, one CTA. One primary CTA, never two.

## Before render

- [ ] Palette is one of the three lines above; `om swatch directions.md` shows no contrast warnings
- [ ] Only Bebas / Inter / JetBrains Mono / Cairo from `assets/fonts/`; no template fonts left in the project
- [ ] Every ease is from the motion table; no spring with bounce above 0
- [ ] No full-frame red held over 1 s; red text only at display size
- [ ] Text inside the safe area; `om check` passes
- [ ] Real logo file, or the end card waits for it
- [ ] Every number traces to a Proof Record
- [ ] CTA is one canonical Lead Keyword
- [ ] Signature decision applied
