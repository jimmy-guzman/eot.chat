# Visual Identity — eot.chat

## Reference Collection: Cosmos

Two curated sets in `docs/reference/cosmos/`:

| Set   | Files                          | Role                                                    |
| ----- | ------------------------------ | ------------------------------------------------------- |
| Light | `light/csms--001–004, 008`     | Light mode surfaces, ambient tones, background register |
| Dark  | `dark/csms--005–007, 009, 010` | Dark mode surfaces, bold accents, phosphor register     |

---

## Core Thesis

**Computing as artifact.** The reference set is entirely vintage computing hardware from the late 1970s–1980s: portable terminals, wall-mounted mainframes, product advertisements, knolled hardware on wood. The emotional register is warm, tactile, and purposeful — objects made before software was ubiquitous, where every knob and key had deliberate weight.

The identity sits at the intersection of **retrocomputing collector culture** and **product photography minimalism**: hardware isolated against clean backgrounds, color used for functional differentiation (amber for live data, green for action, orange for brand identity).

Light mode is the workshop bench — cream putty plastic, teal cutting mat, warm overhead light. Dark mode is the terminal room — near-black chassis, amber phosphor glow on screen, the hum of something running.

---

## Medium

**Photography-informed minimalism.** Reference images are real objects — physical hardware with texture, weight, and patina. UI surfaces should feel like materials: matte plastic, anodized metal, aged paper. No flat gradient fills, no glassy sheens. Warmth comes from color temperature, not softness.

---

## Color

Two modes, system-driven. Defaults to dark.

### Token Philosophy

Tokens use **semantic role names**, not reference names. A token named `primary` tells you _what it is for_ — it is the main interactive color. The actual hex value behind it changes between light and dark mode, but no component code ever needs to know which mode is active. This follows the same pattern as DaisyUI: `primary`, `primary-content`, `base-100`, etc.

This means:

- Components reference only semantic names (`primary`, `base-200`, `base-content`, etc.)
- Themes are purely a token value swap — no `_dark:` conditionals in component code
- Adding a new theme requires only adding new token values, touching zero component files

### Semantic Token System

Each token has a `base` (light) value and a `_dark` value. Color values are derived from the reference images.

#### Base surface layers

These form the layered background system — the "paper" the UI sits on.

| Token          | Role                                    | Light     | Dark      | Source                                                                        |
| -------------- | --------------------------------------- | --------- | --------- | ----------------------------------------------------------------------------- |
| `base-100`     | Page background                         | `#E2EBE5` | `#1A1614` | Teal/mint desk — csms--001 · Near-black chassis — csms--010                   |
| `base-200`     | Cards, panels — elevated above page     | `#F0EDE4` | `#241C19` | Cream putty casing — csms--002/004 · Dark brown terminal — csms--005/006      |
| `base-300`     | Borders, dividers, subtle fills         | `#D4CEBC` | `#3A302A` | Keyboard keycap off-white — csms--002/004 · Dark key surround — csms--006/007 |
| `base-content` | Default text and icons on base surfaces | `#1A1A1A` | `#EDE8DF` | Printed text — csms--003 · Phosphor cream — csms--005                         |

#### Primary — main interactive color

| Token             | Role                             | Light     | Dark      | Source                                                             |
| ----------------- | -------------------------------- | --------- | --------- | ------------------------------------------------------------------ |
| `primary`         | Primary buttons, active badges   | `#28211E` | `#E8850A` | Dark chassis body — csms--006/007 · Amber phosphor — csms--005/010 |
| `primary-content` | Text/icons on `primary` surfaces | `#F0EDE4` | `#28211E` | Cream surface over chassis · Chassis over amber                    |

#### Secondary — supporting interactive color

| Token               | Role                       | Light     | Dark      | Source                           |
| ------------------- | -------------------------- | --------- | --------- | -------------------------------- |
| `secondary`         | Secondary buttons, accents | `#2D7A6A` | `#2D7A6A` | Teal desk background — csms--001 |
| `secondary-content` | Text/icons on `secondary`  | `#F0EDE4` | `#F0EDE4` | Cream surface — csms--002/004    |

#### Accent — highlight and focus

| Token            | Role                                  | Light     | Dark      | Source                                      |
| ---------------- | ------------------------------------- | --------- | --------- | ------------------------------------------- |
| `accent`         | Focus rings, active indicators, links | `#E8850A` | `#E8850A` | Amber dot-matrix glow — csms--002/005/010   |
| `accent-content` | Text/icons on `accent` surfaces       | `#28211E` | `#28211E` | Dark chassis — always legible against amber |

#### Error — destructive actions

| Token           | Role                           | Light     | Dark      | Source                                 |
| --------------- | ------------------------------ | --------- | --------- | -------------------------------------- |
| `error`         | Danger buttons, destructive UI | `#D4541A` | `#D4541A` | Brand badge orange — csms--001/003/004 |
| `error-content` | Text/icons on `error` surfaces | `#F0EDE4` | `#F0EDE4` | Cream surface — readable on orange     |

#### Palette tokens (non-semantic, reference only)

These are not used in components. They exist as raw palette values for one-off use or future theming reference.

| Token            | Light     | Dark      | Source                                  |
| ---------------- | --------- | --------- | --------------------------------------- |
| `terminal-green` | `#3D6B4A` | `#4A8A5E` | Function key accent — csms--006/007/009 |
| `walnut`         | `#8C6E4A` | `#6B4E2E` | Warm wood surface — csms--004/005       |

**Rule:** No synthetic neutrals. Every surface carries either warmth (putty/cream) or purposeful temperature (teal, chassis). Pure `#FFFFFF` and `#000000` are reserved for extreme contrast only.

---

## Spacing

8px base unit. Density is achieved through deliberate proximity of functional elements, not compression of whitespace. Hardware panels pack controls tightly but with clear grouping.

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

Tighter than a typical consumer UI. Industrial hardware has squared corners, beveled edges, and functional geometry — not soft curves. Pills are reserved for badges and chips only.

| Token         | Value    | Usage                                    |
| ------------- | -------- | ---------------------------------------- |
| `radius.sm`   | `4px`    | Inputs, tags, small chips                |
| `radius.md`   | `8px`    | Cards, message components, form surfaces |
| `radius.lg`   | `12px`   | Panels, large containers                 |
| `radius.full` | `9999px` | Pills, badges, round buttons             |

---

## Shadows

Warm-tinted shadows. No cold gray — depth should read like light from a desk lamp, not an office ceiling.

| Token       | Value                            | Usage                            |
| ----------- | -------------------------------- | -------------------------------- |
| `shadow.sm` | `0 1px 4px rgba(26,26,26,0.08)`  | Subtle card lift, resting state  |
| `shadow.md` | `0 4px 16px rgba(26,26,26,0.12)` | Floating components, hover state |
| `shadow.lg` | `0 8px 32px rgba(26,26,26,0.16)` | Prominent cards, modal surfaces  |

---

## Typography

**Typeface: IBM Plex Mono** — the typeface of the terminal era. Warm for a monospace, humanist proportions, designed at IBM with direct lineage to the machines in the reference set. Works across Latin scripts. Reflects the amber dot-matrix and keyboard-label typography throughout csms--002, 003, 004, 005, 010.

Avoid geometric sans-serifs (Inter, DM Sans) and kawaii-rounded faces. The register is purposeful and technical, not cold.

| Role              | Weight | Usage                                   |
| ----------------- | ------ | --------------------------------------- |
| Display / heading | 700    | Room names, large labels, splash text   |
| UI / emphasis     | 600    | Buttons, nav, participant names         |
| Body / ambient    | 400    | Message text, descriptions, form labels |

Moderate tracking on display weights. Comfortable line height (1.6–1.65) on body. Monospace columns should feel like a well-set terminal buffer — not compressed.

### Token Scale

| Token                   | Value    | Usage                                         |
| ----------------------- | -------- | --------------------------------------------- |
| `fontSize.xs`           | 0.75rem  | Labels, captions, domain names                |
| `fontSize.sm`           | 0.875rem | Secondary text, descriptions, form labels     |
| `fontSize.base`         | 1rem     | Body text, inputs, default UI                 |
| `fontSize.lg`           | 1.25rem  | Sub-headings, card titles                     |
| `fontSize.xl`           | 1.5rem   | Section headings                              |
| `fontSize.2xl`          | 2rem     | Display / splash text                         |
| `fontWeight.regular`    | 400      | Body / ambient text                           |
| `fontWeight.bold`       | 600      | UI / emphasis                                 |
| `fontWeight.extrabold`  | 700      | Display / headings                            |
| `lineHeight.body`       | 1.65     | Message text, descriptions                    |
| `lineHeight.code`       | 1.6      | Code blocks                                   |
| `lineHeight.tight`      | 1.2      | Headings, labels                              |
| `letterSpacing.display` | 0.02em   | Display weights — open tracking for monospace |
| `letterSpacing.tight`   | -0.01em  | Compact labels where needed                   |

---

## Recipes

Four shared primitives. All UI is built from these. All color references use semantic token names only — no raw hex values, no mode conditionals.

| Recipe   | Variants                                   | Key tokens used                                             |
| -------- | ------------------------------------------ | ----------------------------------------------------------- |
| `button` | primary, secondary, ghost, danger / sm, md | primary/content, secondary/content, base-300, error/content |
| `input`  | (single)                                   | base-100 bg, base-300 border, accent focus                  |
| `card`   | default, flat                              | base-200, md radius, sm/none shadow                         |
| `badge`  | default, active                            | base-300/content · primary/content                          |

### Button Variants

| Variant     | Background  | Text                               |
| ----------- | ----------- | ---------------------------------- |
| `primary`   | `primary`   | `primary-content`                  |
| `secondary` | `secondary` | `secondary-content`                |
| `ghost`     | transparent | `base-content` / `base-300` border |
| `danger`    | `error`     | `error-content`                    |

Because `primary` is `#28211E` in light and `#E8850A` in dark (and `primary-content` flips accordingly), buttons automatically adapt to both modes with no per-component dark-mode logic.

---

## Illustration Language

No recurring motifs. The visual weight comes from color and typography alone. Hardware objects are the reference — they need no decoration.

---

## Tonal Influences (by reference)

| Asset             | What it contributes                                                            |
| ----------------- | ------------------------------------------------------------------------------ |
| `light/csms--001` | Teal/mint ambient background; orange CRT; product-photography minimalism       |
| `light/csms--002` | Warm putty chassis; amber dot-matrix display; orange function buttons          |
| `light/csms--003` | Aged print ad warmth; cream terminal on gray-blue gradient; orange brand badge |
| `light/csms--004` | Knolling precision; walnut wood surface; cream plastic; orange keycap accents  |
| `light/csms--008` | Matte speckled concrete casing; black screen; teal cutting mat                 |
| `dark/csms--005`  | Matte black GRiD chassis; amber phosphor text; warm wood grain                 |
| `dark/csms--006`  | Dark chocolate-brown Minitel; brown keys; green function key; pale screen      |
| `dark/csms--007`  | Very dark Minitel body; amber/olive keys; green accent; greenish phosphor      |
| `dark/csms--009`  | Taupe mushroom-brown terminal; dark bezel; green key; gray screen              |
| `dark/csms--010`  | All-black GRiD Compass; amber bar chart; gloss magnesium surface               |

---

## What to Avoid

- Clean minimal tech aesthetics — the reference set has texture and weight
- Pure white or cool-gray backgrounds without warmth
- Geometric sans-serifs (Inter, DM Sans) as the primary type voice
- Soft rounded corners — corners are functional, not decorative
- Empty airy layouts — functional density is intentional
- Neon or high-saturation accents — amber and orange are warm, not electric
- Anything that reads as modern SaaS or developer tooling
- Reference color names (`amber`, `chassis`, `putty`) in component code — always use semantic names
