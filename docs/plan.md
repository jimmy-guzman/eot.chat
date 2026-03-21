# Build Plan — Salita.chat

Spec-driven, phase-by-phase. Each phase is independently shippable and leaves the project in a working state. Phases 0–3 deliver working chat. Phases 4–7 deliver the full product.

---

## Phase 0 — Foundation

*Get the project buildable with the correct design system before touching features.*

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
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PARTYKIT_HOST=
OPENROUTER_API_KEY=
```

**Install**
- `@supabase/supabase-js` — needed by PartyKit (not yet in `package.json`)

---

## Phase 1 — Database layer

*Schema + Drizzle client. No features, just the data foundation.*

**`drizzle.config.ts`** — new
- Points at `src/db/schema.ts`, outputs migrations to `drizzle/`, reads `DATABASE_URL`

**`src/db/schema.ts`** — new
- Drizzle table definitions for `rooms` and `messages` per `docs/architecture.md`
- `rooms`: `id`, `name`, `password_hash`, `layout` (jsonb), `created_at`, `last_active_at`
- `messages`: `id`, `room_id` (FK → rooms), `author_display_name`, `body`, `is_command`, `sent_at`
- Export inferred TypeScript types

**`src/db/index.ts`** — new
- Drizzle client using `postgres` driver + `DATABASE_URL`
- Exported as `db`

**`drizzle/`** — generated via `drizzle-kit generate`

---

## Phase 2 — API routes

*The Next.js endpoints the UI and PartyKit depend on.*

**`src/app/api/rooms/route.ts`** — `POST`
- Body: `{ name, password }`
- Generates nanoid room ID, bcrypt-hashes password
- Inserts room with default layout spec from `docs/product/catalog.md`
- Returns `{ id, name }`

**`src/app/api/rooms/[id]/route.ts`** — `GET`
- Returns `{ room: { id, name, layout }, messages[] }` (50 most recent)
- Returns 404 if room not found

**`src/app/api/rooms/[id]/join/route.ts`** — `POST`
- Body: `{ password, displayName }`
- Compares bcrypt hash
- Returns `{ id, name }` on success, `401` on wrong password, `404` if room not found

**`src/app/api/cron/cleanup/route.ts`** — `GET`
- Deletes rooms where `last_active_at < now() - interval '24 hours'`
- Protected by `CRON_SECRET` header

---

## Phase 3 — PartyKit server

*Replace the boilerplate with the real typed message protocol. Delivers working real-time chat.*

**`party/types.ts`** — new
- `ClientMessage` and `ServerMessage` union types per `docs/architecture.md`

**`party/db.ts`** — new
- `@supabase/supabase-js` client reading from `this.room.env`
- Helpers: `insertMessage`, `updateLastActive`, `deleteRoom`

**`party/index.ts`** — rewrite
- In-memory `participants: Map<connectionId, Participant>`
- `onConnect` — sends current participant list to new connection
- `onMessage` — routes by `type`:
  - `join` → add to map, broadcast `joined`, call `updateLastActive`
  - `message` → validate non-empty, call `insertMessage`, broadcast `message`, call `updateLastActive`
  - `reshape` → stub: reply `{ type: "error", reason: "not implemented" }` to sender (Phase 7)
  - `leave` → remove from map, broadcast `left`
- `onClose` — same as `leave`; if map reaches 0, call `deleteRoom`

---

## Phase 4 — Component catalog

*The 9 React components. These are what json-render renders and what the AI is constrained to.*

**`src/catalog/index.ts`** — new
- `defineCatalog` using `@json-render/react/schema` + Zod
- All 9 components with prop schemas per `docs/product/catalog.md`
- Exports `catalog` (used by the reshape pipeline for AI prompt generation)

**`src/catalog/registry.tsx`** — new
- `defineRegistry` wiring catalog components to React implementations
- Exports `registry` (used by `<Renderer />` on the room page)

**`src/components/`** — 9 new files
- `Column.tsx`, `Row.tsx`, `Card.tsx`, `MessageBubble.tsx`, `Header.tsx`, `TextInput.tsx`, `Button.tsx`, `Badge.tsx`, `Divider.tsx`
- Styled with PandaCSS tokens from Phase 0
- `Button` and `TextInput` use Base UI primitives for accessibility
- `index.ts` barrel export

---

## Phase 5 — Landing page

*The Create / Join entry point at `/`.*

**`src/app/page.tsx`** — rewrite
- Two tabs: "Create a Room" / "Join a Room" using Base UI Tabs

- **Create a Room tab:** form with `roomName`, `password`, `displayName` → `POST /api/rooms` → store `displayName` in `sessionStorage` keyed by room ID → `router.push('/r/<id>')`

- **Join a Room tab:** single field accepting a full `https://salita.chat/r/<id>` URL or a bare room ID → extracts the ID → `router.push('/r/<id>')`. Password and display name are collected on the room page itself.

- Visual identity: warm cream background, M PLUS Rounded 1c, dense layout per `docs/product/visual.md`

**URL flow:**
- Creator: `/` → Create tab → creates room → redirected to `/r/<id>`
- Invitee via link: `/r/<id>` directly → join credential form on room page
- Invitee via landing: `/` → Join tab → paste link → navigated to `/r/<id>` → join credential form

---

## Phase 6 — Room page

*The live chat surface. Delivers the full working product (minus `/reshape` AI).*

**`src/app/r/[id]/page.tsx`** — new

Server part:
- Fetches initial room state via `GET /api/rooms/[id]`
- If room not found → redirect to `/`
- If no `displayName` in `sessionStorage` → render join form (password + displayName → `POST /api/rooms/[id]/join` → store `displayName` → re-render as participant)
- Passes initial `{ room, messages }` as props to the client component

Client part:
- Connects to PartyKit via `partysocket`
- On mount: sends `{ type: "join", displayName }`
- Maintains local spec state: starts from server-fetched `room.layout`, mutates as messages arrive by injecting `MessageBubble` elements into `messages-col`
- Renders layout via `<Renderer spec={spec} registry={registry} />`
- Incoming `message` → inject `MessageBubble` into spec state
- Incoming `reshaped` → replace entire spec state → full re-render
- Incoming `left` / `joined` → update participant list display
- Message input: detects `/reshape ` prefix → sends `{ type: "reshape", prompt }`, otherwise sends `{ type: "message", body }`
- `Copy Link` → `navigator.clipboard.writeText(window.location.href)`
- `Exit Room` → sends `{ type: "leave" }` → `router.push('/')`

Header:
- "You Are Now in Room: `<name>`"
- Shareable link bar: `https://salita.chat/r/<id>` + copy button

---

## Phase 7 — `/reshape` AI pipeline

*Wires the full reshape flow end-to-end.*

**`src/lib/reshape.ts`** — new
- Effect-TS pipeline: `Effect<JsonRenderSpec, ReshapeError, never>`
- Steps:
  1. Build system prompt via `catalog.prompt()` with AI constraints from `docs/product/catalog.md`
  2. Call OpenRouter via `@openrouter/sdk`, streaming JSON
  3. Parse stream via `createSpecStreamCompiler` from `@json-render/core`
  4. Validate: every `type` in the spec must exist in `catalog.components`
  5. Return validated spec or `ReshapeError`

**`party/index.ts`** — update `reshape` handler
- Calls reshape pipeline
- On success: `UPDATE rooms SET layout = spec` via supabase-js → `room.broadcast({ type: "reshaped", spec })`
- On failure: `conn.send({ type: "error", reason })` to sender only

---

## Phase 8 — Cron + hygiene

*Safety net and production readiness.*

**`vercel.json`** — new
- Cron schedule: `GET /api/cron/cleanup` daily

**`partykit.json`**
- Add `onAlarm` for PartyKit-side stale room cleanup as belt-and-suspenders

---

## File map at completion

```
src/
  app/
    api/
      rooms/
        route.ts                POST create room
        [id]/
          route.ts              GET room state
          join/route.ts         POST join room
      cron/
        cleanup/route.ts        DELETE stale rooms
    r/
      [id]/page.tsx             Room page
    layout.tsx                  Font + metadata
    page.tsx                    Landing (create room)
    globals.css                 PandaCSS layers (unchanged)
  catalog/
    index.ts                    defineCatalog (9 components)
    registry.tsx                defineRegistry (React implementations)
  components/
    Column.tsx
    Row.tsx
    Card.tsx
    MessageBubble.tsx
    Header.tsx
    TextInput.tsx
    Button.tsx
    Badge.tsx
    Divider.tsx
    index.ts
  db/
    schema.ts
    index.ts
  lib/
    reshape.ts                  Effect-TS reshape pipeline

party/
  index.ts                      PartyKit server
  db.ts                         supabase-js helpers
  types.ts                      ClientMessage / ServerMessage types

drizzle/                        migration files (generated)
drizzle.config.ts
.env.local.example
vercel.json
```

---

## Milestone summary

| Milestone | Phases | Deliverable |
|---|---|---|
| Working chat | 0 → 3 | Create room, share link, real-time messaging, room dissolution |
| Full UI | 4 → 6 | Component catalog, landing page, room page with live rendering |
| Full product | 7 → 8 | `/reshape` AI pipeline, cron cleanup |
