# Build Plan — Salita.chat

Spec-driven, phase-by-phase. Each phase is independently shippable and leaves the project in a working state. Phases 0–3 deliver working chat. Phases 4–6 deliver the full product.

---

## Phase 0 — Foundation

_Get the project buildable with the correct design system before touching features._

**Install dependency** — `pnpm add zod` (required by `@json-render/react` for `defineCatalog` prop schemas in Phase 2)

**`panda.config.ts`**

- Add all 12 color tokens from `docs/product/visual.md` as semantic tokens
- Add spacing, radius, shadow tokens
- Add font CSS variable for M PLUS Rounded 1c

**`src/app/layout.tsx`**

- Replace Geist with M PLUS Rounded 1c via `next/font/google` (weights 400, 700, 800)
- Wire font CSS variable onto `<html>`
- Update metadata: title → "Salita", description → project tagline

**`src/app/page.module.css`**

- Delete — default scaffold file, never used

**`.env.local.example`** — new

```
NEXT_PUBLIC_PARTYKIT_HOST=
OPENROUTER_API_KEY=
```

---

## Phase 1 — PartyKit server

_Replace the boilerplate with the real typed message protocol. Delivers room creation and working real-time chat._

**`party/types.ts`** — new

- `ClientMessage` and `ServerMessage` union types per `docs/architecture.md`
- `Participant` and `Message` types

**`party/index.ts`** — rewrite

- In-memory `participants: Map<connectionId, Participant>` and `messages: Message[]`
- Per-connection token bucket map for rate limiting: capacity 3, refill 1 per 3s
- `onRequest` — HTTP handler:
  - `X-Action: create` → read `{ name }`, check storage not already set, `room.storage.set("name", name)`, return `{ id, name }`
  - Any other request → `405 Method Not Allowed`
- `onConnect` — send `{ type: "init", messages[], participants[] }` to the new connection; if `room.storage.get("name")` is unset, send `{ type: "error", reason: "room not found" }` and close
- `onMessage` — routes by `type`:
  - `join` → validate displayName unique, add to map, broadcast `joined`
  - `message` → validate non-empty, check rate limit bucket (fallback to `TextMessage` if empty), call AI classification, build `Message`, push to `messages[]`, broadcast `message`
  - `leave` → remove from map, broadcast `left`
- `onClose` — same as `leave`; if map reaches 0, delete `name` from `room.storage`, clear `messages[]`

**`party/classify.ts`** — new

- Single `fetch` to OpenRouter with the catalog system prompt
- Returns `{ type, props }` or falls back to `{ type: "TextMessage", props: { body } }` on any failure

---

## Phase 2 — Component catalog

_The 7 React components. These are what the room page renders for each message._

**`src/catalog/index.ts`** — new

- `defineCatalog` using `@json-render/react/schema` + Zod
- All 7 components with prop schemas per `docs/product/catalog.md`
- Exports `catalog` (used by PartyKit for AI prompt generation)

**`src/catalog/registry.tsx`** — new

- `defineRegistry` wiring catalog components to React implementations
- Exports `registry` (used on the room page to render each message component)

**`src/components/`** — 7 new files

- `TextMessage.tsx`, `LinkPreview.tsx`, `RepoCard.tsx`, `CodeBlock.tsx`, `Table.tsx`, `Poll.tsx`, `ImageCard.tsx`
- Styled with PandaCSS tokens from Phase 0
- `index.ts` barrel export

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

---

## Phase 4 — Room page

_The live chat surface. Delivers the full working product._

**`src/app/r/[id]/page.tsx`** — new (Server Component)

- Fetches room name from PartyKit via `GET /parties/main/<id>`
- If room not found (empty storage / 404) → `redirect('/')`
- Passes `{ id, name }` as props to `<RoomClient>`

**`src/app/r/[id]/RoomClient.tsx`** — new (`'use client'`)

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

---

## File map at completion

```
src/
  app/
    r/
      [id]/page.tsx             Room page server component (fetches room name, redirects if not found)
      [id]/RoomClient.tsx       Room page client component (WS, displayName prompt, message rendering)
    layout.tsx                  Font + metadata
    page.tsx                    Landing (Create only)
    globals.css                 PandaCSS layers (unchanged)
  catalog/
    index.ts                    defineCatalog (7 components)
    registry.tsx                defineRegistry (React implementations)
  components/
    TextMessage.tsx
    LinkPreview.tsx
    RepoCard.tsx
    CodeBlock.tsx
    Table.tsx
    Poll.tsx
    ImageCard.tsx
    index.ts

party/
  index.ts                      PartyKit server (HTTP + WebSocket + rate limiting)
  classify.ts                   AI classification via OpenRouter
  types.ts                      ClientMessage / ServerMessage / Message / Participant

.env.local.example
```

---

## Milestone summary

| Milestone    | Phases | Deliverable                                                    |
| ------------ | ------ | -------------------------------------------------------------- |
| Working chat | 0 → 1  | Create room, share link, real-time messaging, room dissolution |
| Component UI | 2      | 7 message-type components styled and registered                |
| Full product | 3 → 4  | Landing page, room page with AI-classified message rendering   |
