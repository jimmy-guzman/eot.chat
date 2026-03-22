# Visual Identity — Salita.chat

## Reference Collection: Cosmos

The visual identity is derived from 10 reference assets in `docs/reference/cosmos/`.

---

## Core Thesis

**Rooms as private universes.** Every space in the reference set is over-personalised — crammed with objects, art, and life to the point where the room itself becomes a self-portrait. The emotional register is warm, sincere, and slightly impossible: water flooding a floor, an ocean above a glass ceiling, a doorway made of teeth. The uncanny is never frightening — it coexists with the domestic as naturally as a houseplant.

The identity sits at the intersection of **Japanese illustration culture** (kawaii isometric, painterly anime) and **maximalist interior boldness**, filtered through spaces that feel lived-in to the point of overflow.

---

## Medium

**Illustration-first.** Everything should feel drawn, not photographed or rendered. Ink line weight, hand-drawn warmth, and deliberate imprecision are welcome. Flat vectors are acceptable only if they carry visible craft. Avoid frictionless digital polish — the aesthetic is analog warmth, not tech smoothness.

---

## Color

Two registers, used deliberately:

### Soft / Pastel register

Drawn from csms--003, csms--004, csms--008, csms--009: soft pink, mint, warm cream, lavender, chartreuse, powder blue. Intimate, kawaii-adjacent, nostalgic. Use for UI backgrounds, empty states, ambient surfaces.

| Token         | Value     | Source feel                                 |
| ------------- | --------- | ------------------------------------------- |
| `bg`          | `#FEFAE8` | Warm cream — csms--008 plaster              |
| `surface`     | `#FFFEF7` | Warm off-white — card and panel backgrounds |
| `soft-pink`   | `#F7C5D0` | Anthurium pink — csms--003, 004             |
| `mint`        | `#B6EDE6` | Teal flood water — csms--003                |
| `chartreuse`  | `#C9EB8A` | Lime accent — csms--009 borders             |
| `powder-blue` | `#A9D9EC` | Sky / kawaii ceiling — csms--008            |
| `lavender`    | `#D3B8E2` | Purple sofa glow — csms--001                |

Use `surface` for all card and panel backgrounds. Reserve pure `#FFFFFF` for borders and line work only.

### Saturated / Bold register

Drawn from csms--001, csms--002, csms--005, csms--006, csms--010: fire red, cobalt blue, sunflower yellow, orange, ink black. Use for emphasis, interactive states, illustration accents, and graphic moments — never as a background fill.

| Token    | Value     | Source feel                                          |
| -------- | --------- | ---------------------------------------------------- |
| `red`    | `#E8291C` | Red chairs / gallery frames — csms--005              |
| `cobalt` | `#1A3ABF` | Cobalt wall / poster blue — csms--006                |
| `yellow` | `#F5E135` | Sunflower chairs, acid poster — csms--006, csms--002 |
| `orange` | `#F47B1F` | Orange chairs / warm lamp — csms--005, csms--001     |
| `sage`   | `#5A8A6A` | Mural sage — csms--010                               |
| `ink`    | `#1A1A1A` | Line art ink — csms--003, csms--004                  |

**Rule:** No desaturated neutrals as a primary choice. Even "neutral" surfaces carry a subtle warm tint. Pure `#FFFFFF` and `#000000` are reserved for line work only.

### Accent color assignments

Bold-register accent colors are assigned to specific catalog components for visual identity:

| Color        | Component   | Usage                     |
| ------------ | ----------- | ------------------------- |
| `chartreuse` | `CodeBlock` | Language label background |
| `orange`     | `Poll`      | Vote count / progress bar |
| `sage`       | `Table`     | Header row background     |
| `yellow`     | `ImageCard` | Caption label background  |

---

## Spacing

8px base unit. Nothing too tight — density is achieved through layering objects, not compressing whitespace.

| Token      | Value  | Usage                                         |
| ---------- | ------ | --------------------------------------------- |
| `space.1`  | `4px`  | Tight internal gaps (icon padding, hairlines) |
| `space.2`  | `8px`  | Default inner padding, small chip gaps        |
| `space.3`  | `12px` | Component inner padding                       |
| `space.4`  | `16px` | Standard section gaps, card padding           |
| `space.5`  | `24px` | Comfortable layout breathing room             |
| `space.6`  | `32px` | Section separation                            |
| `space.8`  | `48px` | Large section gaps                            |
| `space.10` | `64px` | Page-level spacing                            |

---

## Radius

Very rounded throughout. Soft edges reinforce the kawaii-adjacent warmth — nothing should feel sharp or corporate.

| Token         | Value    | Usage                                         |
| ------------- | -------- | --------------------------------------------- |
| `radius.sm`   | `8px`    | Subtle rounding — inputs, tags, small chips   |
| `radius.md`   | `16px`   | Cards, message components, form surfaces      |
| `radius.lg`   | `24px`   | Panels, modal-like surfaces, large containers |
| `radius.full` | `9999px` | Pills, avatar bubbles, round buttons          |

---

## Shadows

Warm-tinted shadows only. No cold gray — even depth should feel like it belongs in the same sunlit room.

| Token       | Value                            | Usage                            |
| ----------- | -------------------------------- | -------------------------------- |
| `shadow.sm` | `0 1px 4px rgba(26,26,26,0.08)`  | Subtle card lift, resting state  |
| `shadow.md` | `0 4px 16px rgba(26,26,26,0.12)` | Floating components, hover state |
| `shadow.lg` | `0 8px 32px rgba(26,26,26,0.16)` | Prominent cards, modal surfaces  |

---

## Typography

**Typeface: M PLUS Rounded 1c** — warm, rounded, slightly handmade. Japanese-designed, works across Latin and Japanese scripts. Reflects the kawaii-adjacent softness of csms--008 and the warm hand-lettered quality of the gallery-wall art in csms--001.

Avoid geometric sans-serifs that read as tech-neutral (Inter, DM Sans, etc.).

| Role              | Weight | Usage                                   |
| ----------------- | ------ | --------------------------------------- |
| Display / heading | 800    | Room names, large labels, splash text   |
| UI / emphasis     | 700    | Buttons, nav, participant names         |
| Body / ambient    | 400    | Message text, descriptions, form labels |

Loose tracking on display weights. Comfortable line height (1.6–1.7) on body. Never compressed.

### Token scale

| Token                   | Value    | Usage                                     |
| ----------------------- | -------- | ----------------------------------------- |
| `fontSize.xs`           | 0.75rem  | Labels, captions, domain names            |
| `fontSize.sm`           | 0.875rem | Secondary text, descriptions, form labels |
| `fontSize.base`         | 1rem     | Body text, inputs, default UI             |
| `fontSize.lg`           | 1.25rem  | Sub-headings, card titles                 |
| `fontSize.xl`           | 1.5rem   | Section headings                          |
| `fontSize.2xl`          | 2rem     | Display / splash text                     |
| `fontWeight.regular`    | 400      | Body / ambient text                       |
| `fontWeight.bold`       | 700      | UI / emphasis                             |
| `fontWeight.extrabold`  | 800      | Display / headings                        |
| `lineHeight.body`       | 1.65     | Message text, descriptions                |
| `lineHeight.code`       | 1.6      | Code blocks                               |
| `lineHeight.tight`      | 1.2      | Headings, labels                          |
| `letterSpacing.display` | 0.01em   | Display weights — open tracking           |
| `letterSpacing.tight`   | -0.01em  | Compact labels where needed               |

---

## Recipes

Four shared primitives. All catalog components and page UI are built from these — nothing is hand-rolled.

| Recipe   | Variants                                   | Key tokens used                       |
| -------- | ------------------------------------------ | ------------------------------------- |
| `button` | primary, secondary, ghost, danger / sm, md | cobalt, mint, soft-pink, red, surface |
| `input`  | (single)                                   | bg, soft-pink border, cobalt focus    |
| `card`   | default, flat                              | surface, md radius, sm/none shadow    |
| `badge`  | default, active                            | lavender / cobalt + surface           |

---

## Illustration Language

### Recurring Motifs (from the reference set)

- **Plants** — tropical, lush, overgrown. Monstera, anthuriums, ivy climbing out of frame (csms--003, csms--009)
- **Cats** — small, incidental, never the main subject (csms--004, csms--007)
- **Screens inside screens** — TVs, portals, media as a layer of reality (csms--007, csms--008)
- **Books and shelves** — accumulated objects as ambient texture (csms--007, csms--009)
- **A single human figure** — alone in a large, dense world; introspective, not lonely (csms--003, csms--009)
- **Art on walls** — gallery walls, posters, murals bleeding off frames (csms--001, csms--002, csms--006)

### Surreal Boundary Dissolve

Every illustration should contain one element where physical rules quietly break — matter-of-fact, never dramatic:

- Water flooding a domestic floor without panic (csms--003)
- The ocean existing above a glass ceiling (csms--007)
- A doorway becoming something organic (csms--004)
- The indoor and outdoor merging without acknowledgment (csms--009)

### Density and Detail

Spaces should feel lived-in to the point of overflow. Empty corners are an opportunity. Details reward close looking.

---

## Tonal Influences (by reference)

| Asset       | What it contributes                                                                   |
| ----------- | ------------------------------------------------------------------------------------- |
| `csms--001` | Warm pastel maximalism (real); purple + yellow + pink; "live life colourfully" energy |
| `csms--002` | Bold graphic poster art (real studio); primary colours; assertive, art-world          |
| `csms--003` | Flat ink line art; flooded-room surrealism; limited pastel palette; plant density     |
| `csms--004` | Surreal domestic cartoon; bubblegum pink; bold outlines; weird-cute                   |
| `csms--005` | Dark teal maximalism; tropical mural; saturated, Matisse-adjacent                     |
| `csms--006` | Cobalt + sunflower maximalism; pop art murals; zebra print; graphic boldness          |
| `csms--007` | Isometric cozy; underwater-above-interior; warm wood tones; @jarsarts                 |
| `csms--008` | Kawaii isometric; pastel ceiling; Sailor Moon; cream/mint/pink/yellow                 |
| `csms--009` | Painterly anime overhead; purple + peach + sage; glass ceiling; @qu.draws             |
| `csms--010` | Mexican hacienda (real); earthy plaster; sage + terracotta + ochre mural              |

---

## What to Avoid

- Clean, minimal, tech-neutral aesthetics
- Pure white backgrounds without warmth
- Geometric sans-serifs (Inter, DM Sans, etc.) as the primary type voice
- Flat vector illustration without craft or imperfection
- Empty, airy layouts — density is intentional
- Irony or detachment — the emotional register is sincere
- Cold blue-grays, slate, or anything that reads "SaaS dashboard"
