# Build Plan — Salita.chat

Spec-driven, phase-by-phase. Each phase is independently shippable and leaves the project in a working state. Phases 0–3 deliver working chat. Phases 4–6 deliver the full product.

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

## Phase 1 — PartyKit server

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
  - `leave` → remove from map, broadcast `left`
- `onClose` — same as `leave`; if map reaches 0, delete `name` from `room.storage`, clear `messages[]`

**`party/classify.ts`** — new

- Pure `Effect.gen` pipeline: `Effect.tryPromise` → `Effect.timeout("8 seconds")` → `Schema.decodeUnknown` → `Effect.catchAll` fallback
- Returns `Effect.Effect<Classification, never>` (error channel fully collapsed by `catchAll`)
- Falls back to `{ type: "TextMessage", props: { body } }` on any failure (timeout, invalid JSON, unknown type)

**Testing:** Write `party/classify.spec.ts`, `party/types.spec.ts`, and `party/token-bucket.spec.ts`. See `docs/testing.md` for coverage requirements and Effect test patterns.

**Verification:** `pnpm test --run` green; room creation `POST` returns `200 { id, name }`; WebSocket `join` → `init` round-trip works via `npx partykit dev`.

---

## Phase 2 — Component catalog

_The 7 React components. These are what the room page renders for each message._

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
- Styled with PandaCSS tokens from Phase 0
- `index.ts` barrel export

**Testing:** Write `src/catalog/schema.spec.ts` and one `*.spec.tsx` per component in `src/components/`. See `docs/testing.md` for coverage requirements.

**Verification:** All component unit tests pass; `pnpm build` succeeds.

---

## Phase 3 — Landing page

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

**Verification:** Form creates a room and redirects; `pnpm typecheck` clean.

---

## Phase 4 — Room page

_The live chat surface. Delivers the full working product._

**`src/app/r/[id]/page.tsx`** — new (Server Component)

- Fetches room name from PartyKit via `GET /parties/main/<id>`
- If room not found (empty storage / 404) → `redirect('/')`
- Passes `{ id, name }` as props to `<RoomClient>` (rendered from `room-client.tsx`)

**`src/app/r/[id]/room-client.tsx`** — new (`'use client'`)

- On mount: checks `sessionStorage` for `room:${id}:displayName`
- If not found: renders the inline display name prompt form
  - On submit: stores `displayName` in sessionStorage, triggers connection
- Connects to PartyKit via `partysocket` once `displayName` is known
- On connect: sends `{ type: "join", displayName }`
- Receives `{ type: "init", messages[], participants[] }` → populates local state
- Incoming `message` → append to local messages list
- Incoming `joined` / `left` → update participant list display
- Incoming `error` with reason `"room not found"` → `router.push('/')`
- For each message, renders the `component` field via `registry.render({ type, props })`
- Own messages left-aligned, others right-aligned
- Message input → sends `{ type: "message", body }`
- `Copy Link` → `navigator.clipboard.writeText(window.location.href)`
- `Exit Room` → sends `{ type: "leave" }` → `router.push('/')`

Header:

- "You Are Now in Room: `<name>`"
- Shareable link bar: `https://salita.chat/r/<id>` + copy button

**Testing:** Write `e2e/chat.spec.ts` with the full happy-path flow. Update `playwright.config.ts` to start both Next.js and PartyKit as `webServer` entries. See `docs/testing.md` for the complete flow.

**Verification:** `pnpm e2e` green (full happy path passes).

---

## File map at completion

```
src/
  app/
    r/
      [id]/page.tsx             Room page server component (fetches room name, redirects if not found)
      [id]/room-client.tsx      Room page client component (WS, displayName prompt, message rendering)
    layout.tsx                  Font + metadata
    page.tsx                    Landing (Create only)
    globals.css                 PandaCSS layers (unchanged)
  catalog/
    schema.ts                   Zod prop schemas + AI system prompt string (workerd-safe, no React)
    index.ts                    defineCatalog (7 components)
    registry.tsx                defineRegistry (React implementations)
  components/
    text-message.tsx
    link-preview.tsx
    repo-card.tsx
    code-block.tsx
    table.tsx
    poll.tsx
    image-card.tsx
    index.ts

party/
  index.ts                      PartyKit server (HTTP + WebSocket handler boundaries)
  classify.ts                   AI classification Effect pipeline via OpenRouter
  types.ts                      Effect Schema definitions — ClientMessage / ServerMessage / Message / Participant
  token-bucket.ts               Plain token bucket class for rate limiting (workerd-safe)

.env.local.example
```

---

## Milestone summary

| Milestone    | Phases | Deliverable                                                    |
| ------------ | ------ | -------------------------------------------------------------- |
| Working chat | 0 → 1  | Create room, share link, real-time messaging, room dissolution |
| Component UI | 2      | 7 message-type components styled and registered                |
| Full product | 3 → 4  | Landing page, room page with AI-classified message rendering   |
