# Build Plan — Salita.chat

Spec-driven, phase-by-phase. Each phase is independently shippable and leaves the project in a working state. Phases 0–4 deliver working chat. Phases 5–6 deliver the full product.

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
    page.tsx                          Landing (Create only)
    _components/
      create-room-form.tsx            Create room form (uses button + input recipes)
    globals.css                       PandaCSS layers (unchanged)
  catalog/
    schema.ts                         Zod prop schemas + AI system prompt string (workerd-safe, no React)
    index.ts                          defineCatalog (7 components)
    registry.tsx                      defineRegistry (React implementations)
  components/
    text-message.tsx
    link-preview.tsx                  uses card recipe
    repo-card.tsx                     uses card recipe
    code-block.tsx                    chartreuse language label
    table.tsx                         sage header row
    poll.tsx                          orange progress bar
    image-card.tsx                    yellow caption label
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

| Milestone     | Phases | Deliverable                                                     |
| ------------- | ------ | --------------------------------------------------------------- |
| Foundation    | 0      | Buildable project, font, metadata                               |
| Design system | 1      | Complete token layer, four recipe primitives                    |
| Working chat  | 2      | Create room, share link, real-time messaging, room dissolution  |
| Component UI  | 3      | 7 message-type components styled with recipes and accent colors |
| Full product  | 4 → 5  | Landing page, room page with AI-classified message rendering    |
