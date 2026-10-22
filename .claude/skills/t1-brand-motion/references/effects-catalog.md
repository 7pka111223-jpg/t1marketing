# Effects catalog: two reference videos analysed for T1

Source videos (analysed 2026-10-22 through Composio + Apify; frames, cut detection and OCR run in a remote sandbox):

| | [@taki.gpt](https://www.tiktok.com/@taki.gpt/video/7698412619572481281) | [@justyn.ai](https://www.tiktok.com/@justyn.ai/video/7698961002590833940) |
|---|---|---|
| Length | 59 s (effects run 3–40 s, then CTA talking head) | 23 s |
| Views | 140K, 11.2K saves | 3.4K |
| Effects | 18 named, about 2 s each | 21 named, under 1 s each |
| Hard cuts | ~11 in 59 s | 4 in 23 s, none after 6 s |
| Base footage | one warm-beige talking-head shot (`#BEAE9D`, `#786054`) | dark green-black set (`#0F110D`, `#2A3429`) |
| Persistent layer | header "20 Video Effects / Created by Claude" + numbered label per effect ("04) Snap Zoom") | progress checklist "IN THIS VIDEO 07 / 20" ticking off each effect name |

**What makes both work** [Certain, from cut counts and OCR]: the effects are continuous transformations of one shot,
not cut-based edits. A persistent progress device (a numbered label, an n/20 counter) tells the viewer how far through
they are, which is why a list video holds attention. Copy the structure, not just the effects: one base shot, one
persistent counter, one effect per beat.

**Evidence column.** *Seen*: confirmed by OCR text, colour or cut data at that timestamp. *Name*: inferred from the
effect's spoken name only; the frames were not inspected by eye (Drive was full and the container blocks the CDN),
so check these against the video before building.

## Taki Wong: 20 Video Effects

| t | Effect | What it is | Evidence | Build in huashu-motion | Matte? | T1 fit |
|---|---|---|---|---|---|---|
| 3 s | Orbit chat takeover | chat bubbles orbit the speaker, then fill the frame | Name | DOM bubbles on `OM.camera` orbit path; `OM.spring(0)` entrances | no | **Restyle**: DMs arriving ("PULL-UP", "MU") for a Lead Keyword CTA |
| 6 s | Frame escape | the frame shrinks to a card on black; the subject breaks out of its border | Seen (ground `#110E0E`) | scale video into a card; matted athlete layer drawn above the card edge | **yes** | **Use**: an athlete's legs/arm leaving the frame on a muscle-up, the hero shot |
| 8 s | Snap zoom | instant punch-in on a word | Seen ("04) Snap Zoom") | `scale` 1→1.35 in 0.12 s, `power4.out`, on the beat | no | **Use**: on the rep's lockout |
| 10 s | Checklist pop | list items tick in beside the speaker ("Edit / Captions / Effects") | Seen ("05) Checklist Pop") | stacked rows, mask-wipe in, check-mark stroke draw | no | **Use**: form cues ("FULL LOCKOUT ✓ SCAPULA ✓") |
| 12 s | Headline storm | many headlines slam in around the speaker | Name | kinetic-type template, staggered slams | no | **Use** as the 0–2 s hook, Bebas only |
| 14 s | Zoom portal | push into a shape that opens onto the next shot | Seen ("Zoom Portal") | `OM.camera` push into a masked shape; next clip inside the mask | no | **Use**: push into the bar, land in the next athlete's clip |
| 16 s | Growth curve | line chart draws on a dark ground | Seen (ground `#0E0C0E`, "Curve") | finance-chart template restyled; stroke-dash draw | no | **Use** for Proof Records only (3 → 8 pull-ups), real numbers |
| 18 s | Studio reveal | speaker revealed in a dark studio set | Seen ("Studio Reveal", ground `#050404`) | dark set behind matted subject, light sweep | **yes** | Maybe: coach intros |
| 20 s | B-roll overlay | cutaway clip framed over the talking head | Seen ("B-roll Overlay") | talking-head template card slot | no | **Use**: the drill clip over the coach explaining it |
| 22 s | Paper cut-out | subject as a paper cut-out with white border | Name | matted subject + white stroke + drop shadow | **yes** | **Skip**: paper/collage fights the brand's hard, gritty look |
| 24 s | Dolly zoom | background stretches while the subject holds size | Seen ("12 Dolly Zoom") | needs a matte to separate the layers; or scale the bg against the subject | **yes** (for the real effect) | **Use**: on a held skill (planche, front lever) |
| 27 s | Magazine cover | frame becomes a cover with masthead and cover lines | Seen ("13) Magazine Cover") | Bebas masthead behind matted subject, cover lines in Inter | **yes** (to tuck the head over the masthead) | **Use**: "COACH LOGIC #01" covers, member of the month |
| 29 s | Liquid glass | frosted refracting glass panels | Seen ("14 Liquid Glass") | huashu-motion `liquid-glass` language | no | **Skip**: brand bans glassmorphism |
| 31 s | Zoom-through cut | zoom into something and cut on the motion blur | Seen (cut at 31.2 s) | speed-ramped push + `om render --blur` + cut at peak | no | **Use**: the cleanest gym transition |
| 32.5 s | Green screen cut | subject keyed onto a new background | Name | matted subject over new plate | **yes** | Low: T1's real gym is the asset; don't replace it |
| 34 s | Frame break | subject breaks a frame edge or a shape | Seen ("Frame Break") | as frame escape | **yes** | **Use**: same as frame escape |
| 35.5 s | Digital zoom | crop zoom with a digital/scanline look, colour shifts blue-violet | Seen (`#5A5AB2`, `#20234B`) | scale + scanline overlay + RGB split | no | Restyle: drop the blue (no other hues), keep the zoom |
| 37 s | Phone mockup | clip placed inside a phone frame | Seen ("Phone Mockup") | screen in a device frame (`OM3.screen` or flat SVG) | no | **Use** for the Online lane: the coaching webapp on a phone |

## Justyn: 20 of 40+ effects

| t | Effect | What it is | Evidence | Build in huashu-motion | Matte? | T1 fit |
|---|---|---|---|---|---|---|
| 0–1 s | Hook card + effect list | "20 effects. 20 seconds." with the full list visible | Seen | kinetic-type card; list rows | no | **Use** the pattern: promise + count up front |
| whole video | Progress counter | "IN THIS VIDEO nn / 20", each item checked off | Seen at every sample | persistent HUD, number ticks on each beat, tabular mono | no | **Use**: "DRILL 2 / 5" in JetBrains Mono |
| ~0.5 s | Magazine cover | as Taki's | Name | as above | yes | as above |
| ~1 s | Knockout captions | caption text sits behind the speaker's head | Name | text layer between bg and matted subject | **yes** | **Use**: big Bebas word behind the athlete |
| ~2 s | Live markup | hand-drawn annotations appear on the frame | Name | SVG stroke-dash draw on top of video | no | **Use, top pick**: draw the elbow path, the hollow body line, on a real rep |
| ~2.5 s | Film look | grain, gate weave, vignette | Name | grain + vignette overlay (already in the brand rules) | no | **Use** (brand calls for 5–10% grain) |
| ~3 s | Jiggle delete | iOS-style jiggle, then the element deletes | Name | rotation wobble + scale-out | no | **Skip**: jiggle is bouncy, banned |
| 4–5.5 s | Screenplay page | frame becomes a cream screenplay page ("INT. GREEN ROOM – DAY / JUSTYN (to camera)") | Seen (`#F1EDE1` page, OCR text) | full-frame paper card, Courier-style text types on | no | Humour only: "INT. T1 GYM – 7 PM" for character Reels |
| ~5 s | Grid collapse | a grid of clips collapses into one | Name | modular-grid language; tiles scale into one | no | **Use**: "Different athletes. One mindset." |
| ~6.5 s | Stamp ("CLAUDE EDITED") | a stamp slams onto the frame | Seen ("Claude Cooked", "CLAUDE EDITED") | scale 1.4→1 in 0.1 s, slight rotation, hit sfx | no | **Use**: "CLEAN REP" / "NO REP" stamps in Bebas, red |
| ~7 s | Prompt bar | an AI prompt bar types a command | Name | cursor-demo language | no | Skip (AI-tool content, not gym) |
| ~8.5 s | Contact sheet | frame becomes a sheet of film stills | Seen (full green flood `#193828`, "CONTACT SHEET") | grid of stills from the clip, one circled | no | **Use**: a rep broken into 6 frames, the faulty frame circled |
| ~9 s | Keycaps | keyboard keys press on screen | Name | 3D/flat keycap press | no | Skip |
| ~10 s | Comment drop | a comment bubble drops in ("drop EDIT") | Name | bubble slide-in with avatar | no | **Use** for the CTA: "DM PULL-UP" bubble (a Lead Keyword, never "comment") |
| ~13 s | Picture dive | push into a photo and through it | Name | camera push through an image plane | no | Use: dive into an old photo for then/now Sequels |
| ~14 s | NLE timeline | editing timeline UI appears | Name | flat UI rebuild | no | Skip |
| ~15 s | Playing grid | many clips playing in a grid | Name | modular-grid | no | Use with grid collapse |
| ~16 s | Serif stamp | serif-type stamp | Name | as stamp | no | Use only in Bebas, not serif |
| ~16.5 s | Icon strike | icons strike/cross out | Name | SVG line strike-through draw | no | **Use**: strike the wrong form ("✗ HALF REP") |
| ~17 s | Grease pencil sheet | grease-pencil drawing on a sheet | Name | as live markup on paper | no | Use as live markup |
| ~19 s | Lens ring | a lens/focus ring graphic | Name | ring rotates and the frame racks focus | no | Maybe |
| ~20 s | Reel cascade | many Reels cascade down the screen | Seen (counting numbers at 20.5 s) | stacked cards with stagger | no | **Use**: "238 posts, one gym" community moment |
| ~22 s | Video card | clip as a card with metadata | Name | card with title + stats | no | Use for coach cards |

## For T1: build order

Top picks for a calisthenics gym, all decisive (no bounce), all on real footage:
1. **Live markup / grease pencil** on a real rep: the core of every LEARN Reel. No matte needed.
2. **Snap zoom** on the lockout + **zoom-through cut** between athletes. No matte.
3. **Progress counter** ("DRILL 2 / 5") + **checklist pop** of form cues. No matte.
4. **Stamp** "CLEAN REP" / "NO REP" + **icon strike** on the wrong version. No matte.
5. **Contact sheet** of a rep with the faulty frame circled. No matte.
6. **Growth curve** for a Proof Record. No matte.
7. **Frame escape / frame break**, **knockout captions**, **magazine cover**, **dolly zoom**. These are the hero effects, and all need a matte.

**The matte gap.** huashu-motion has no person segmentation; its `--transparent` render only makes the graphics layer
transparent. Seven effects above need the athlete separated from the background, which means pre-processing the
footage into an alpha video with a matting model (e.g. Robust Video Matting or rembg, run before huashu-motion), then
layering background → graphics → matted athlete in the composition. Gym footage (bars, rigs, other people) is harder
to matte than a talking head in front of a plain wall. Test on one clip before promising these effects.
