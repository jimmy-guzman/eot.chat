# Build Plan — Salita.chat

Spec-driven, phase-by-phase. Each phase is independently shippable and leaves the project in a working state. Phases 0–5 deliver a working product. Phase 6 adds clear-chat. Phase 7 delivers the visual identity. Phase 8 delivers the generative UI expansion.

---

## Effect-TS Strategy

Effect is used as a **pipeline assembler on the server only** — never in the browser bundle.

| Where                   | Usage                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `party/classify.ts`     | Full `Effect.gen` pipeline — `tryPromise` → `timeout("8 seconds")` → `Schema.decodeUnknown` → `catchAll` fallback to `TextMessage`             |
| `party/index.ts`        | `Match.value(...).pipe(Match.tag(...), Match.exhaustive)` for routing `ClientMessage` types; `Effect.runPromise(...)` at each handler boundary |
| `party/types.ts`        | `Schema.Struct` / `Schema.Union` / `Schema.Literal` to define wire types — single source of truth for runtime parsing and TypeScript types     |
| `src/catalog/schema.ts` | Zod only — required by `@json-render/react`'s `defineCatalog` API                                                                              |
| `src/app/` (React)      | No Effect — plain TypeScript and React hooks                                                                                                   |

Rate limiting uses a plain `TokenBucket` class (`party/token-bucket.ts`) rather than Effect's `RateLimiter`. Effect's `RateLimiter` depends on fiber scheduling that is unsafe in the workerd runtime.

---

## Design system strategy

Component-driven from the token layer up. The approach mirrors building a private shadcn: tokens → recipes → blocks. Nothing in a block is hand-rolled.

| Layer   | What it is                                              | Where                               |
| ------- | ------------------------------------------------------- | ----------------------------------- |
| Tokens  | Colors, spacing, radius, shadow, typography, sizes      | `panda.config.ts`                   |
| Recipes | cva-backed primitives: button, input, card, badge       | `panda.config.ts` → `theme.recipes` |
| Blocks  | Catalog components and page UI composed from primitives | `src/components/`, `src/app/`       |

---

## Phase 0 — Foundation

_Get the project buildable with the correct design system before touching features._

**Install dependency** — `pnpm add nanoid` (required for nanoid room ID generation in Phase 3 and message IDs in Phase 1; `zod` is already installed)

**`panda.config.ts`**

- Add all 12 color tokens from `docs/product/visual.md` as semantic tokens
- Add spacing, radius, shadow tokens
- Add font CSS variable for M PLUS Rounded 1c

**`src/app/layout.tsx`**

- Replace Geist with M PLUS Rounded 1c via `next/font/google` (weights 400, 700, 800)
- Wire font CSS variable onto `<html>`
- Update metadata: title → "Salita", description → project tagline

**Verification:** `pnpm build` succeeds; `pnpm typecheck` clean; M PLUS Rounded 1c renders in the browser.

---

## Phase 1 — Design system

_Build the token layer and recipe primitives before touching any component or page. Establishes the vocabulary everything else is built from._

**`panda.config.ts`** — extend tokens and add recipes:

- `semanticTokens.colors`: add `surface: "#FFFEF7"` (warm off-white for card and panel backgrounds — replaces raw `"white"` everywhere)
- `tokens.fontSizes`: `xs` (0.75rem), `sm` (0.875rem), `base` (1rem), `lg` (1.25rem), `xl` (1.5rem), `2xl` (2rem)
- `tokens.fontWeights`: `regular` (400), `bold` (700), `extrabold` (800)
- `tokens.lineHeights`: `body` (1.65), `code` (1.6), `tight` (1.2)
- `tokens.letterSpacings`: `display` (0.01em), `tight` (-0.01em)
- `tokens.sizes`: `card` (400px), `bubble` (480px)
- `theme.recipes.button` — variants: `variant` (primary / secondary / ghost / danger), `size` (sm / md)
  - `primary`: `cobalt` bg, `surface` text, full radius
  - `secondary`: `mint` bg, `ink` text
  - `ghost`: transparent, `ink` text, `soft-pink` border
  - `danger`: `red` bg, `surface` text
  - Shared: `bold` weight, focus ring, hover shadow, disabled opacity
- `theme.recipes.input` — single variant
  - `bg` background, `soft-pink` border (2px), `cobalt` focus border, `sm` radius, `base` font size
- `theme.recipes.card` — variants: `default`, `flat`
  - `default`: `surface` bg, `md` radius, `sm` shadow
  - `flat`: `surface` bg, `md` radius, `soft-pink` border, no shadow
- `theme.recipes.badge` — variants: `default`, `active`
  - `default`: `lavender` bg, `ink` text, `full` radius
  - `active`: `cobalt` bg, `surface` text, `full` radius

**Verification:** `pnpm build` succeeds; `pnpm typecheck` clean; Panda `styled-system/` output contains recipe classes.

---

## Phase 2 — PartyKit server

_Replace the boilerplate with the real typed message protocol. Delivers room creation and working real-time chat._

**`party/types.ts`** — new

- Effect `Schema.Struct` / `Schema.Union` / `Schema.Literal` definitions for `ClientMessage` and `ServerMessage`
- `Participant` and `Message` types inferred from schemas via `Schema.Type`

**`party/token-bucket.ts`** — new

- Plain `TokenBucket` class (no Effect); workerd-safe
- Capacity 3, refill 1 per 3s per connection

**`party/index.ts`** — rewrite

- In-memory `participants: Map<connectionId, Participant>` and `messages: Message[]`
- Per-connection token bucket map for rate limiting: capacity 3, refill 1 per 3s
- `onRequest` — HTTP handler:
  - `X-Action: create` → read `{ name }`, check storage not already set, `room.storage.set("name", name)`, return `{ id, name }`
  - Any other request → `405 Method Not Allowed`
- `onConnect` — send `{ type: "init", messages[], participants[] }` to the new connection; if `room.storage.get("name")` is unset, send `{ type: "error", reason: "room not found" }` and close
- `onMessage` — parse with `Schema.decodeUnknownEither`, route with `Match.tag`, `Effect.runPromise` at boundary:
  - `join` → validate displayName unique, add to map, broadcast `joined`
  - `message` → validate non-empty, check rate limit bucket (fallback to `TextMessage` if empty), call AI classification, build `Message`, push to `messages[]`, broadcast `message`
  - `clear` → clear `messages[]`, broadcast `cleared`
  - `leave` → remove from map, clear `messages[]`, broadcast `cleared`, broadcast `left`
- `onClose` — same as `leave`; additionally if map reaches 0, delete `name` from `room.storage`

**`party/classify.ts`** — new

- Pure `Effect.gen` pipeline: `Effect.tryPromise` → `Effect.timeout("8 seconds")` → `Schema.decodeUnknown` → `Effect.catchAll` fallback
- Returns `Effect.Effect<Classification, never>` (error channel fully collapsed by `catchAll`)
- Falls back to `{ type: "TextMessage", props: { body } }` on any failure (timeout, invalid JSON, unknown type)

**Testing:** Write `party/classify.spec.ts`, `party/types.spec.ts`, and `party/token-bucket.spec.ts`. See `docs/testing.md` for coverage requirements and Effect test patterns.

**Verification:** `pnpm test --run` green; room creation `POST` returns `200 { id, name }`; WebSocket `join` → `init` round-trip works via `npx partykit dev`.

---

## Phase 3 — Component catalog

_The 7 React components. These are what the room page renders for each message. Built from the recipe primitives established in Phase 1._

**`src/catalog/schema.ts`** — new

- Pure TypeScript + Zod only (no React, no JSX) — importable by both Next.js and the PartyKit workerd bundle
- Zod prop schemas for all 7 components per `docs/product/catalog.md`
- Exports the component names array, prop schemas, and the AI system prompt string
- Imported by `party/classify.ts` via relative path (`../../src/catalog/schema`) — no `@/` alias, workerd-safe

**`src/catalog/index.ts`** — new

- `defineCatalog` using `@json-render/react` + schemas from `schema.ts`
- Exports `catalog` (used on the room page)

**`src/catalog/registry.tsx`** — new

- `defineRegistry` wiring catalog components to React implementations
- Exports `registry` (used on the room page to render each message component)

**`src/components/`** — 7 new files

- `src/components/text-message.tsx`, `link-preview.tsx`, `repo-card.tsx`, `code-block.tsx`, `table.tsx`, `poll.tsx`, `image-card.tsx`
- Styled with recipe primitives and named tokens from Phase 1 — no raw `fontSize`, `fontWeight`, or `lineHeight` values
- `link-preview.tsx`, `repo-card.tsx` — use `card` recipe
- `code-block.tsx` — `chartreuse` accent for language label background
- `poll.tsx` — `orange` accent for progress bar
- `table.tsx` — `sage` accent for header row background
- `image-card.tsx` — `yellow` accent for caption label background
- All surfaces use `surface` token — no raw `"white"`
- `index.ts` barrel export

**Testing:** Write `src/catalog/schema.spec.ts` and one `*.spec.tsx` per component in `src/components/`. See `docs/testing.md` for coverage requirements.

**Verification:** All component unit tests pass; `pnpm build` succeeds.

---

## Phase 4 — Landing page

_The Create entry point at `/`._

**`src/app/page.tsx`** — rewrite

- Single "Create a Room" form — no tabs, no Join tab
- Fields: `roomName`, `displayName`
- On submit:
  - Generate nanoid room ID client-side
  - `POST /parties/main/<id>` with `X-Action: create` `{ name }`
  - Store `displayName` in `sessionStorage` keyed by room ID
  - `router.push('/r/<id>')`
- Visual identity: warm cream background, M PLUS Rounded 1c, dense layout per `docs/product/visual.md`
- Uses `button` (primary) and `input` recipes

**Verification:** Form creates a room and redirects; `pnpm typecheck` clean.

---

## Phase 5 — Room page

_The live chat surface. Delivers the full working product._

**`src/app/r/[id]/page.tsx`** — new (Server Component)

- Fetches room name from PartyKit via `GET /parties/main/<id>`
- If room not found (empty storage / 404) → `redirect('/')`
- Passes `{ id, name }` as props to `<RoomClient>` (rendered from `room-client.tsx`)

**`src/app/r/[id]/room-client.tsx`** — new (`'use client'`)

- On mount: checks `sessionStorage` for `room:${id}:displayName` via `useSyncExternalStore` (server snapshot returns `null`, client snapshot reads storage — prevents hydration mismatch)
- If not found: renders the inline display name prompt form
  - On submit: stores `displayName` in sessionStorage, triggers connection
- Connects to PartyKit via `partysocket` once `displayName` is known
- On connect: sends `{ type: "join", displayName }`
- Receives `{ type: "init", messages[], participants[] }` → populates local state
- Incoming `message` → append to local messages list
- Incoming `joined` / `left` → update participant list display
- Incoming `cleared` → reset local messages list to `[]`
- Incoming `error` with reason `"room not found"` → `router.push('/')`
- For each message, renders the `component` field via `registry.render({ type, props })`
- Own messages left-aligned, others right-aligned
- Message input → sends `{ type: "message", body }`
- `Copy Link` → `navigator.clipboard.writeText(window.location.href)`
- `Clear Chat` → sends `{ type: "clear" }` → optimistically resets local messages to `[]`
- `Exit Room` → sends `{ type: "leave" }` → `router.push('/')`
- Uses `button` (secondary for Copy Link, ghost for Clear Chat, danger for Exit Room), `input`, `badge` (default/active for participant pills) recipes

Header:

- "You Are Now in Room: `<name>`"
- Shareable link bar: `https://salita.chat/r/<id>` + copy button

**Testing:** Write `e2e/chat.spec.ts` with the full happy-path flow. Update `playwright.config.ts` to start both Next.js and PartyKit as `webServer` entries. See `docs/testing.md` for the complete flow.

**Verification:** `pnpm e2e` green (full happy path passes).

---

## Phase 6 — Clear chat

_Add the ability to wipe the message history, and auto-dissolve rooms cleanly on any leave._

**`party/types.ts`** — extend protocol:

- Add `{ type: "clear" }` to `ClientMessageSchema`
- Add `{ type: "cleared" }` to `ServerMessageSchema`

**`party/index.ts`** — extend handlers:

- `clear` message → clear `messages[]`, broadcast `{ type: "cleared" }`
- Any `leave` / `onClose` → clear `messages[]`, broadcast `{ type: "cleared" }`, then broadcast `{ type: "left" }`

**`src/app/r/[id]/_components/room-client.tsx`** — extend client:

- Handle `{ type: "cleared" }` → reset local messages to `[]`
- Add "Clear Chat" button (ghost variant) → sends `{ type: "clear" }`, optimistically resets messages

**Testing:** Add `clear` message and mid-session leave clearing tests to `party/index.spec.ts`.

**Verification:** `pnpm typecheck` clean; `pnpm lint` clean; `pnpm test --run` green; `pnpm build` succeeds.

---

## Phase 7 — Visual identity

_Make the UI feel warm, maximalist, and illustration-first per the "Cosmos" reference set in `docs/product/visual.md`._

**`src/components/illustrations.tsx`** — new

- `PlantMotif` — inline SVG, ink-line overgrown tropical plant (monstera/anthurium), using `chartreuse` / `mint` / `sage` fills per `visual.md`. Positioned absolutely so it slightly overflows its container, creating the "plants overflowing out of frame" identity.
- `CatMotif` — inline SVG, small sitting cat in `ink` line art. Small and incidental — never the main subject.

**`src/app/page.tsx`** — update

- Make the card `position: "relative"` so `PlantMotif` can be absolutely positioned in the top-right corner, slightly overflowing
- Heading "Salita": `fontSize: "2xl"`, `color: "cobalt"`, `letterSpacing: "display"`, `fontWeight: "extrabold"`
- Tagline: add `lineHeight: "body"`

**`src/app/r/[id]/_components/display-name-form.tsx`** — update

- Add `CatMotif` sitting quietly at the bottom of the card (small, incidental)
- Heading: same `fontSize: "2xl"`, `color: "cobalt"`, `letterSpacing: "display"`, `fontWeight: "extrabold"` treatment

**`src/app/r/[id]/_components/room-client.tsx`** — update

- Room name header: strip "You Are Now in Room:" prose — show only the room name at `fontSize: "lg"` with `color: "cobalt"` + `letterSpacing: "display"`
- Message bubble alignment: **fix the inversion** — `isOwn ? "flex-end" : "flex-start"` (own messages should be right-aligned)
- Empty state: add `PlantMotif` SVG centered above copy; change copy to "The room is waiting." at `opacity: 0.5`
- `CodeBlock` `<pre>` element: add `backgroundColor: "surface"` so the code area has a warm background

**`src/components/link-preview.tsx`** — add `lineHeight: "body"` to description `<p>`

**`src/components/repo-card.tsx`** — add `lineHeight: "body"` to description `<p>`

**Verification:** `pnpm typecheck` clean; `pnpm lint` clean; `pnpm test --run` green; `pnpm build` succeeds.

---

## Phase 8 — Generative UI expansion

_Expand the component catalog so the AI can return rich composed spec trees, not just flat single-component leaves. Replace the flat `{ type, props }` wire format with a unified spec tree format._

**Install dependency** — `pnpm add recharts`

### Wire format migration

The `component` field on `Message` is migrated from the flat `{ type, props }` leaf format to a unified spec tree format:

```typescript
// Old (flat leaf — Phase 3–7)
component: {
  type: string;
  props: Record<string, unknown>;
}

// New (spec tree — Phase 8+)
component: {
  elements: Record<string, { type: string; props: Record<string, unknown> }>;
  root: string;
}
```

Single-component messages are represented as `{ elements: { root: { type, props } }, root: "root" }`. The AI can now return a composed tree by referencing multiple elements.

**`party/types.ts`** — update `ComponentSchema`:

- Replace `Schema.Struct({ type, props })` with a spec tree schema:
  ```
  Schema.Struct({
    elements: Schema.Record({ key: Schema.String, value: Schema.Struct({ type: Schema.String, props: Schema.Record(...) }) }),
    root: Schema.String,
  })
  ```

**`party/classify.ts`** — update system prompt and classification schema:

- The AI now returns a spec tree JSON object in `{ elements, root }` format
- Single-component results are wrapped by `classify()` before returning: `{ elements: { root: { type, props } }, root: "root" }`
- The AI can also return a composed tree directly (e.g. `Stack > [Metric, Metric, BarChart]`)
- Add all 6 new component types to the catalog context in the system prompt

**`src/app/r/[id]/_components/room-client.tsx`** — update `makeSpec()`:

- Since `Message.component` is now always a spec tree, `makeSpec()` is no longer needed — pass `msg.component` directly to `<Renderer spec={msg.component} />`

### New components

**`src/components/bar-chart.tsx`** — new

- Wraps recharts `BarChart` with Panda-token colors (no shadcn, no CSS variables)
- Props: `data: { label: string; value: number }[]`, `title?: string`, `color?: string` (defaults to `cobalt`)

**`src/components/line-chart.tsx`** — new

- Wraps recharts `LineChart` with Panda-token colors
- Props: `data: { label: string; value: number }[]`, `title?: string`, `color?: string` (defaults to `cobalt`)

**`src/components/metric.tsx`** — new

- Displays a single KPI: large `value`, smaller `label`, optional `detail` subtext, optional `trend: "up" | "down" | "neutral"`
- Uses `cobalt` for up-trend, `red` for down-trend, `ink` for neutral

**`src/components/callout.tsx`** — new

- Highlighted block with `type: "info" | "tip" | "warning"`, optional `title`, and `content`
- `info` → `powder-blue` bg; `tip` → `mint` bg; `warning` → `yellow` bg

**`src/components/timeline.tsx`** — new

- Vertical list of `items: { title: string; description?: string; date?: string; status?: "completed" | "current" | "upcoming" }[]`
- `completed` → `chartreuse` dot; `current` → `cobalt` dot; `upcoming` → `soft-pink` dot

**`src/components/stack.tsx`** — new

- Layout container for the AI to compose multiple components
- Props: `direction?: "horizontal" | "vertical"` (default `"vertical"`), `gap?: number`
- Renders as a flex container; children are rendered via the `@json-render/react` `Renderer`

**`src/components/index.ts`** — update barrel export to include all 6 new components

### Catalog updates

**`src/catalog/schema.ts`** — add 6 new Zod schemas: `Stack`, `Metric`, `BarChart`, `LineChart`, `Callout`, `Timeline`

**`src/catalog/index.ts`** — register 6 new components with descriptions

**`src/catalog/registry.tsx`** — wire 6 new components to React implementations

### Interactive component state

Poll vote state (and any future selection-based interactive component) is **local per-client only** in this phase — selections are not broadcast to other participants. No server protocol changes are needed. A future phase may add a `vote` / `interact` client message type and a corresponding server broadcast to sync interactive state across participants; that would require additions to `party/types.ts` and `party/index.ts`.

**Testing:** Write one `*.spec.tsx` per new component in `src/components/`. See `docs/testing.md` for coverage requirements.

**Verification:** `pnpm typecheck` clean; `pnpm lint` clean; `pnpm test --run` green; `pnpm build` succeeds.

---

## File map at completion

```
panda.config.ts                       Tokens (colors, spacing, radius, shadow, typography, sizes)
                                      + recipes (button, input, card, badge)

src/
  app/
    r/
      [id]/page.tsx                   Room page server component (fetches room name, redirects if not found)
      [id]/_components/
        room-client.tsx               Room page client component (WS, displayName prompt, message rendering)
        display-name-form.tsx         Inline display name prompt (uses button + input recipes)
    layout.tsx                        Font + metadata
    page.tsx                          Landing (Create only) + PlantMotif
    _components/
      create-room-form.tsx            Create room form (uses button + input recipes)
    globals.css                       PandaCSS layers (unchanged)
  catalog/
    schema.ts                         Zod prop schemas + AI system prompt string (workerd-safe, no React)
    index.ts                          defineCatalog (13 components)
    registry.tsx                      defineRegistry (React implementations)
  components/
    illustrations.tsx                 Inline SVG motifs: PlantMotif, CatMotif
    text-message.tsx
    link-preview.tsx                  uses card recipe
    repo-card.tsx                     uses card recipe
    code-block.tsx                    chartreuse language label
    table.tsx                         sage header row
    poll.tsx                          orange progress bar
    image-card.tsx                    yellow caption label
    bar-chart.tsx                     recharts BarChart with Panda tokens
    line-chart.tsx                    recharts LineChart with Panda tokens
    metric.tsx                        KPI metric with trend indicator
    callout.tsx                       info/tip/warning callout block
    timeline.tsx                      vertical timeline with status dots
    stack.tsx                         flex layout container for composed specs
    index.ts

party/
  index.ts                            PartyKit server (HTTP + WebSocket handler boundaries)
  classify.ts                         AI classification Effect pipeline via OpenRouter
  types.ts                            Effect Schema definitions — ClientMessage / ServerMessage / Message / Participant
  token-bucket.ts                     Plain token bucket class for rate limiting (workerd-safe)

.env.local.example
```

---

## Milestone summary

| Milestone       | Phases | Deliverable                                                          |
| --------------- | ------ | -------------------------------------------------------------------- |
| Foundation      | 0      | Buildable project, font, metadata                                    |
| Design system   | 1      | Complete token layer, four recipe primitives                         |
| Working chat    | 2      | Create room, share link, real-time messaging, room dissolution       |
| Component UI    | 3      | 7 message-type components styled with recipes and accent colors      |
| Full product    | 4 → 5  | Landing page, room page with AI-classified message rendering         |
| Clear chat      | 6      | Clear message history; auto-clear on any participant leave           |
| Visual identity | 7      | Illustration motifs, typography fixes, bubble alignment, empty state |
| Generative UI   | 8      | 6 new components, spec tree wire format, composed AI output          |
