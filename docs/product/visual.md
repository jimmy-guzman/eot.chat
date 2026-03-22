# Visual Identity — eot.chat

## Reference Collection: Cosmos

Curated set in `docs/reference/cosmos/`:

| File        | Subject                                          |
| ----------- | ------------------------------------------------ |
| `csms--001` | GRiD Compass — gloss black magnesium, amber bars |
| `csms--002` | Minitel — chocolate brown chassis, pale screen   |
| `csms--003` | Minitel — dark taupe, greenish phosphor text     |
| `csms--004` | Minitel — near-black bezel, cream casing         |
| `csms--005` | GRiD Compass — matte black, amber phosphor text  |
| `csms--006` | Casio C-80 ad — black plastic, yellow-green LCD  |
| `csms--007` | Soviet terminal — battleship gray, orange keys   |
| `csms--008` | French Minitel — dark brown, blue-tinted screen  |

---

## Core Thesis

**Computing as artifact.** These are objects from the terminal room, not the workshop bench. Machines built for function in low light — phosphor glowing in dark chassis, orange keys punched by someone who knows what they're doing. The emotional register is dense, purposeful, slightly austere. No decoration. Everything on screen earned its place.

The identity lives in a single mode: **dark**. There is no light mode. The terminal does not have a light mode.

The palette is pulled directly from hardware surfaces and phosphor emissions — not designed, extracted.

---

## Color

Single dark mode. No mode switching.

### Token Philosophy

Tokens use semantic role names only. Components reference `primary`, `base-200`, `base-content` — never raw hex. This keeps theming a pure token swap and component code clean.

### Semantic Token System

#### Base surface layers

| Token          | Value     | Source                                                       |
| -------------- | --------- | ------------------------------------------------------------ |
| `base-100`     | `#0C0B09` | Deep near-black of GRiD chassis in dark room — csms--001/005 |
| `base-200`     | `#1A1310` | Chocolate brown Minitel body — csms--002/008                 |
| `base-300`     | `#2E2219` | Dark key surround, bezel edge — csms--003/004                |
| `base-content` | `#E8E0D0` | Phosphor cream text on dark screen — csms--005               |

#### Primary — main interactive color

| Token             | Value     | Source                                                       |
| ----------------- | --------- | ------------------------------------------------------------ |
| `primary`         | `#F5A800` | Amber phosphor glow — csms--005/001. More yellow than orange |
| `primary-content` | `#0C0B09` | Near-black chassis — legible against amber at any weight     |

#### Secondary — supporting interactive color

| Token               | Value     | Source                                            |
| ------------------- | --------- | ------------------------------------------------- |
| `secondary`         | `#CC4E18` | Orange accent keys on Soviet terminal — csms--007 |
| `secondary-content` | `#E8E0D0` | Phosphor cream — readable on orange               |

#### Accent — highlight and focus

| Token            | Value     | Source                                          |
| ---------------- | --------- | ----------------------------------------------- |
| `accent`         | `#7AAF6E` | Terminal-green function key — csms--003/004/008 |
| `accent-content` | `#0C0B09` | Near-black — legible against green              |

#### Error — destructive actions

| Token           | Value     | Source                                                         |
| --------------- | --------- | -------------------------------------------------------------- |
| `error`         | `#CC4E18` | Same orange as secondary — hardware used one accent for danger |
| `error-content` | `#E8E0D0` | Phosphor cream                                                 |

#### Palette tokens (non-semantic, reference only)

Not used in components. Raw palette values for illustration or future use.

| Token            | Value     | Source                                               |
| ---------------- | --------- | ---------------------------------------------------- |
| `lcd-yellow`     | `#C8C44A` | Casio C-80 LCD display — csms--006                   |
| `phosphor-green` | `#8AB87A` | Greenish phosphor tint on Minitel screen — csms--003 |
| `battleship`     | `#6B7270` | Soviet terminal chassis gray — csms--007             |
| `walnut`         | `#5E3D22` | Dark wood grain — csms--005                          |

**Rule:** No synthetic neutrals. No pure black, no cool gray. Every surface pulls from a real material in the reference set. `#000000` is never used — the darkest value is `#0C0B09`.

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

Radius values tightened from previous version. The GRiD and Minitel chassis have almost no rounding — `8px` is the ceiling, not the floor.

---

## Shadows

Amber-tinted shadows. Depth reads like phosphor spill, not office ceiling light.

| Token       | Value                           | Usage                            |
| ----------- | ------------------------------- | -------------------------------- |
| `shadow.sm` | `0 1px 4px rgba(20,10,4,0.40)`  | Subtle card lift, resting state  |
| `shadow.md` | `0 4px 16px rgba(20,10,4,0.60)` | Floating components, hover state |
| `shadow.lg` | `0 8px 32px rgba(20,10,4,0.80)` | Prominent cards, modal surfaces  |
| `glow.sm`   | `0 0 8px rgba(245,168,0,0.15)`  | Subtle amber phosphor glow       |
| `glow.md`   | `0 0 20px rgba(245,168,0,0.25)` | Active elements, focused inputs  |

Glow tokens are new — phosphor screens emit light, they don't just reflect it. Active states should feel lit from within, not highlighted from above.

---

## Typography

**Typeface: IBM Plex Mono** — direct lineage to the machines in the reference set. Warm for a monospace, humanist proportions. The amber dot-matrix and keyboard labels throughout the reference images are this voice.

| Role              | Weight | Usage                                   |
| ----------------- | ------ | --------------------------------------- |
| Display / heading | 700    | Room names, large labels, splash text   |
| UI / emphasis     | 600    | Buttons, nav, participant names         |
| Body / ambient    | 400    | Message text, descriptions, form labels |

### Token Scale

| Token                   | Value    | Usage                                     |
| ----------------------- | -------- | ----------------------------------------- |
| `fontSize.xs`           | 0.75rem  | Labels, captions, timestamps              |
| `fontSize.sm`           | 0.875rem | Secondary text, descriptions, form labels |
| `fontSize.base`         | 1rem     | Body text, inputs, default UI             |
| `fontSize.lg`           | 1.25rem  | Sub-headings, card titles                 |
| `fontSize.xl`           | 1.5rem   | Section headings                          |
| `fontSize.2xl`          | 2rem     | Display / splash text                     |
| `fontWeight.regular`    | 400      |                                           |
| `fontWeight.bold`       | 600      |                                           |
| `fontWeight.extrabold`  | 700      |                                           |
| `lineHeight.body`       | 1.65     | Message text                              |
| `lineHeight.code`       | 1.6      | Code blocks                               |
| `lineHeight.tight`      | 1.2      | Headings, labels                          |
| `letterSpacing.display` | 0.04em   | Display weights — wider tracking for mono |
| `letterSpacing.tight`   | -0.01em  | Compact labels                            |

Tracking on display weights opened up from `0.02em` to `0.04em` — monospace headings need more air to read like terminal output, not compressed UI text.

---

## Recipes

Four shared primitives. Semantic token names only — no raw hex, no mode conditionals (there is only one mode).

| Recipe   | Variants                                   | Key tokens used                                             |
| -------- | ------------------------------------------ | ----------------------------------------------------------- |
| `button` | primary, secondary, ghost, danger / sm, md | primary/content, secondary/content, base-300, error/content |
| `input`  | (single)                                   | base-200 bg, base-300 border, glow.md focus                 |
| `card`   | default, flat                              | base-200, md radius, shadow.sm / none                       |
| `badge`  | default, active                            | base-300/content · primary/content                          |

### Button Variants

| Variant     | Background  | Text                | Notes                           |
| ----------- | ----------- | ------------------- | ------------------------------- |
| `primary`   | `primary`   | `primary-content`   | Amber — the phosphor action     |
| `secondary` | `secondary` | `secondary-content` | Orange — the hardware accent    |
| `ghost`     | transparent | `base-content`      | `base-300` border               |
| `danger`    | `error`     | `error-content`     | Same orange — hardware used one |

### Input focus

Focused inputs use `glow.md` instead of a simple border color change. The field should feel like it's emitting light, not just gaining an outline.

---

## Motion

Terminal cursors blink. They do not ease.

| Property | Value                  | Usage                                    |
| -------- | ---------------------- | ---------------------------------------- |
| Blink    | `1s step-end infinite` | Cursor, active indicators                |
| Snap     | `0ms`                  | State changes — no easing on mode shifts |
| Fast     | `80ms ease-out`        | Hover states only                        |
| Enter    | `120ms ease-out`       | Components appearing                     |

No spring physics, no bounce, no elaborate enter/exit choreography. Things appear and disappear. The cursor blinks at 1hz. That's the motion language.

---

## What to Avoid

- Any light mode or light surface treatment
- Pure `#000000` or `#FFFFFF` — use `base-100` and `base-content`
- Cool gray neutrals — every surface has warmth or purposeful temperature
- Geometric sans-serifs — IBM Plex Mono only
- Rounded corners above `8px`
- Glow effects on non-interactive elements — glow is earned, not decorative
- Neon or high-saturation color — amber and orange are warm, not electric
- Modern SaaS aesthetics — drop shadows with cool tones, flat color fills, rounded everything
- Reference color names in component code — always semantic names
