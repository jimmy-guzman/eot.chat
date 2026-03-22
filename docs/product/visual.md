# Visual Identity — eot.chat

## Reference Collection: Cosmos

Five images in `docs/reference/cosmos/`. This is the complete set — nothing outside it is a valid reference.

| File        | Subject                                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| `csms--001` | Soviet military terminal — near-black textured chassis, mauve/rose keys, white screen emission          |
| `csms--002` | Soviet terminal render — battleship gray chassis, orange-red function keys, cool gray alphanumeric keys |
| `csms--003` | Minitel 1 — dark chocolate chassis, tan outer casing, warm brown keys, one green key, screen off        |
| `csms--004` | Minitel with live screen — dark gray-brown chassis, tan shell, amber-olive phosphor text on near-black  |
| `csms--005` | Minitel museum shot — warm taupe outer, near-black bezel and keyboard, warm brown keys, one green key   |

---

## Core Thesis

**Two machines. One palette.** The Soviet industrial terminal and the Minitel are separated by culture and purpose but share the same material logic: dark chassis, deliberate key accent, functional screen. Dense. Purposeful. No decoration earns its place unless it communicates something.

Dark only. No light mode. The terminal does not have a light mode.

The palette is extracted directly from hardware surfaces — not designed, not interpolated. Every token traces back to a specific material in the reference set.

---

## Color

Single dark mode. All tokens are single values — no `{ base, _dark }` structures.

### Token Philosophy

Tokens use semantic role names only. Components reference `primary`, `base-200`, `base-content` — never raw hex. Theming is a pure token swap; component code is never touched.

**One accent color.** The consistent, deliberate accent across both machines is orange-red (Soviet function keys, csms--002). The single green Minitel key is a physical artifact, not a UI color. It lives in the palette only.

### Semantic Token System

#### Base surface layers

| Token          | Value     | Source                                                                         |
| -------------- | --------- | ------------------------------------------------------------------------------ |
| `base-100`     | `#0D0E10` | Soviet terminal chassis, near-black with cool blue-black undertone — csms--001 |
| `base-200`     | `#1A1410` | Minitel inner bezel and keyboard, very dark warm brown — csms--004             |
| `base-300`     | `#2C1E14` | Minitel dark chocolate body — csms--003                                        |
| `base-content` | `#E0D8C0` | Phosphor screen text, warm cream with slight yellow cast — csms--004           |

The surface stack moves from cool (Soviet near-black) through warm (Minitel chocolate). This is the depth of the room — the machine sits in shadow, the screen emits warmth.

#### Primary — main interactive color

| Token             | Value     | Source                                                                                     |
| ----------------- | --------- | ------------------------------------------------------------------------------------------ |
| `primary`         | `#D44E1A` | Orange-red function keys — csms--002. The one consistent action color across both machines |
| `primary-content` | `#F5EEE0` | Warm cream — legible on orange-red at all weights                                          |

#### Secondary — supporting interactive color

| Token               | Value     | Source                                                    |
| ------------------- | --------- | --------------------------------------------------------- |
| `secondary`         | `#3A3530` | Battleship gray lifted surface — csms--002 chassis panels |
| `secondary-content` | `#E0D8C0` | Phosphor cream — readable on gray                         |

#### Accent — highlight and focus

Accent is primary. There is one accent color in this reference set. `accent` and `primary` share the same value so that focus rings, active states, and interactive elements all speak the same color.

| Token            | Value     | Source                      |
| ---------------- | --------- | --------------------------- |
| `accent`         | `#D44E1A` | Same as primary — csms--002 |
| `accent-content` | `#F5EEE0` | Warm cream                  |

#### Error — destructive actions

| Token           | Value     | Source                                                                    |
| --------------- | --------- | ------------------------------------------------------------------------- |
| `error`         | `#D44E1A` | Same orange-red — hardware used one key color for action and danger alike |
| `error-content` | `#F5EEE0` | Warm cream                                                                |

#### Palette tokens (non-semantic, reference only)

Not used in components. Raw palette values preserved for illustration or future use.

| Token            | Value     | Source                                                                  |
| ---------------- | --------- | ----------------------------------------------------------------------- |
| `minitel-green`  | `#4A7A3A` | Single green function key — csms--003/004/005. One key. Not a UI color. |
| `phosphor-olive` | `#B8A832` | Live screen text tint, amber-olive — csms--004                          |
| `mauve-key`      | `#8A6070` | Dusty mauve/rose function keys — csms--001                              |
| `battleship`     | `#6B6860` | Soviet chassis lighter gray panels — csms--002                          |

**Rule:** No pure `#000000` or `#FFFFFF`. The darkest value is `#0D0E10` — a near-black with cool undertone, not void. The lightest content value is `#F5EEE0` — warm cream, not paper white.

---

## Spacing

8px base unit. Density over airiness — these machines packed every control deliberately.

| Token      | Value  | Usage                               |
| ---------- | ------ | ----------------------------------- |
| `space.1`  | `4px`  | Tight internal gaps, hairlines      |
| `space.2`  | `8px`  | Default inner padding, chip gaps    |
| `space.3`  | `12px` | Component inner padding             |
| `space.4`  | `16px` | Standard section gaps, card padding |
| `space.5`  | `24px` | Comfortable layout breathing room   |
| `space.6`  | `32px` | Section separation                  |
| `space.8`  | `48px` | Large section gaps                  |
| `space.10` | `64px` | Page-level spacing                  |

---

## Radius

Squared. Industrial hardware has beveled edges and functional geometry. Pills for badges only.

| Token         | Value    | Usage                                    |
| ------------- | -------- | ---------------------------------------- |
| `radius.sm`   | `2px`    | Inputs, tags, small chips                |
| `radius.md`   | `4px`    | Cards, message components, form surfaces |
| `radius.lg`   | `8px`    | Panels, large containers                 |
| `radius.full` | `9999px` | Pills, badges only                       |

The GRiD and Minitel chassis have almost no rounding — `8px` is the ceiling, not the floor.

---

## Shadows

Dark-tinted depth shadows plus orange-red glow for active and focus states. Shadows read like a dim room. Glow reads like a key backlit from below — not a CRT phosphor bloom.

| Token       | Value                            | Usage                            |
| ----------- | -------------------------------- | -------------------------------- |
| `shadow.sm` | `0 1px 4px rgba(13,14,16,0.60)`  | Subtle card lift, resting state  |
| `shadow.md` | `0 4px 16px rgba(13,14,16,0.80)` | Floating components, hover state |
| `shadow.lg` | `0 8px 32px rgba(13,14,16,0.90)` | Prominent cards, modal surfaces  |
| `glow.sm`   | `0 0 6px rgba(212,78,26,0.20)`   | Subtle active indicator          |
| `glow.md`   | `0 0 16px rgba(212,78,26,0.30)`  | Focused inputs, active elements  |

---

## Typography

**Typeface: IBM Plex Mono** — direct lineage to the machines in the reference set. The keyboard labels on the Minitel and Soviet terminal are this voice. Warm for a monospace, humanist proportions.

| Role              | Weight | Usage                                   |
| ----------------- | ------ | --------------------------------------- |
| Display / heading | 700    | Room names, large labels, splash text   |
| UI / emphasis     | 600    | Buttons, nav, participant names         |
| Body / ambient    | 400    | Message text, descriptions, form labels |

### Token Scale

| Token                   | Value    | Usage                                         |
| ----------------------- | -------- | --------------------------------------------- |
| `fontSize.xs`           | 0.75rem  | Labels, captions, timestamps                  |
| `fontSize.sm`           | 0.875rem | Secondary text, descriptions, form labels     |
| `fontSize.base`         | 1rem     | Body text, inputs, default UI                 |
| `fontSize.lg`           | 1.25rem  | Sub-headings, card titles                     |
| `fontSize.xl`           | 1.5rem   | Section headings                              |
| `fontSize.2xl`          | 2rem     | Display / splash text                         |
| `fontWeight.regular`    | 400      |                                               |
| `fontWeight.bold`       | 600      |                                               |
| `fontWeight.extrabold`  | 700      |                                               |
| `lineHeight.body`       | 1.65     | Message text                                  |
| `lineHeight.code`       | 1.6      | Code blocks                                   |
| `lineHeight.tight`      | 1.2      | Headings, labels                              |
| `letterSpacing.display` | 0.04em   | Display weights — monospace headings need air |
| `letterSpacing.tight`   | -0.01em  | Compact labels                                |

---

## Recipes

Four shared primitives. Semantic token names only — no raw hex.

| Recipe   | Variants                                   | Key tokens used                                             |
| -------- | ------------------------------------------ | ----------------------------------------------------------- |
| `button` | primary, secondary, ghost, danger / sm, md | primary/content, secondary/content, base-300, error/content |
| `input`  | (single)                                   | base-200 bg, base-300 border, glow.md focus                 |
| `card`   | default, flat                              | base-200, md radius, shadow.sm / none                       |
| `badge`  | default, active                            | base-300/content · primary/content                          |

### Button Variants

| Variant     | Background  | Text                | Notes                                   |
| ----------- | ----------- | ------------------- | --------------------------------------- |
| `primary`   | `primary`   | `primary-content`   | Orange-red — the action key             |
| `secondary` | `secondary` | `secondary-content` | Battleship gray — the passive surface   |
| `ghost`     | transparent | `base-content`      | `base-300` border                       |
| `danger`    | `error`     | `error-content`     | Same orange-red — one color, one intent |

### Input focus

Focused inputs use `glow.md` — orange-red box-shadow, no border color change. The field feels lit, not outlined.

---

## Motion

Terminal cursors blink. They do not ease.

| Property | Value                  | Usage                     |
| -------- | ---------------------- | ------------------------- |
| Blink    | `1s step-end infinite` | Cursor, active indicators |
| Snap     | `0ms`                  | State changes             |
| Fast     | `80ms ease-out`        | Hover states only         |
| Enter    | `120ms ease-out`       | Components appearing      |

---

## What to Avoid

- Any light mode or light surface treatment
- Pure `#000000` or `#FFFFFF`
- Cool gray neutrals without the warm undertone pulled from the reference set
- A second accent color — there is one: orange-red
- Green in the UI — the Minitel green key is a physical artifact, not a design token
- Amber in the UI — `phosphor-olive` is a palette reference, not a component color
- Rounded corners above `8px`
- Glow on non-interactive elements — glow is earned by focus or active state
- Modern SaaS aesthetics — drop shadows with cool tones, flat color fills, rounded everything
- Reference color names in component code — always semantic names
