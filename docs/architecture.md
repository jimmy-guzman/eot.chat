# Architecture — Salita.chat

---

## Effect-TS Usage Boundaries

Effect (`effect` v3) is used as a **pipeline assembler on the PartyKit server only**. It never enters the browser bundle.

### What uses Effect

| File                | Pattern                              | APIs                                                                                           |
| ------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `party/types.ts`    | Schema definitions for wire types    | `Schema.Struct`, `Schema.Union`, `Schema.Literal`, `Schema.Type`                               |
| `party/classify.ts` | AI classification pipeline           | `Effect.gen`, `Effect.tryPromise`, `Effect.timeout`, `Schema.decodeUnknown`, `Effect.catchAll` |
| `party/index.ts`    | Message routing + handler boundaries | `Match.value`, `Match.tag`, `Match.exhaustive`, `Effect.runPromise`                            |

### What does not use Effect

- **`party/token-bucket.ts`** — rate limiting is a plain TypeScript class. Effect's `RateLimiter` relies on fiber scheduling that is incompatible with the workerd runtime.
- **`src/catalog/schema.ts`** — Zod is used here, as required by `@json-render/react`'s `defineCatalog` API.
- **`src/app/`** — React client components use plain TypeScript and React hooks. Effect's fiber model does not compose with React hooks.

### workerd compatibility

Effect computations run inside standard `Promise` boundaries (`Effect.runPromise`). Each `onMessage` and `onRequest` call constructs an `Effect.gen(...)` program and executes it at the boundary — Effect as a description language, `runPromise` as the executor. workerd supports `Promise` natively so this pattern is safe.

The `@/` path alias is a TypeScript compiler alias only. `party/classify.ts` imports `src/catalog/schema.ts` via a **relative path** (`../../src/catalog/schema`) to ensure esbuild can resolve it when bundling the party worker.

---

## System Topology

```
┌─────────────────────────────────┐     ┌──────────────────────────────────────┐
│         Vercel (Next.js)        │     │       PartyKit hosted (workerd)      │
│                                 │     │                                      │
│  /                (landing)     │     │  party/index.ts                      │
│  /r/[id]          (room page)   │◄────┤                                      │
│                                 │     │  HTTP (onRequest):                   │
│                                 │     │    POST /parties/main/:id            │
│                                 │     │      (X-Action: create)              │
│                                 │     │                                      │
│                                 │     │  WebSocket (onConnect/onMessage):    │
│                                 │     │    real-time message broadcast       │
│                                 │     │    AI classification per message     │
│                                 │     │                                      │
│                                 │     │  Storage:                            │
│                                 │     │    room.storage → name               │
│                                 │     │  In-memory:                          │
│                                 │     │    participants Map                   │
│                                 │     │    messages[]                        │
└─────────────────────────────────┘     │                                      │
                                        │  Outbound:                           │
                                        │    OpenRouter API (AI classification)│
                                        └──────────────────────────────────────┘
```

**Next.js on Vercel** — UI shell only. No API routes for room management. No database client. Serves the landing page and room page. All room logic is delegated to PartyKit.

**PartyKit hosted** — `workerd` runtime (Cloudflare-based). Owns all room logic: creation, participant tracking, message history, AI classification, and room dissolution. Uses `onRequest` for HTTP room creation and `onConnect` / `onMessage` for WebSocket real-time messaging.

There is no database and no password/token auth. The room ID is the only access control — it is a nanoid and is unguessable. Room state is split between:

- `room.storage` (key-value, persists across hibernation): `name` only
- In-memory class state (lost on hibernation if room is empty): `participants`, `messages[]`

---

## Data Model

### Room (in PartyKit)

| Field       | Where            | Notes                                                            |
| ----------- | ---------------- | ---------------------------------------------------------------- |
| `id`        | PartyKit room ID | URL-safe nanoid — unguessable, serves as the only access control |
| `name`      | `room.storage`   | Human-readable name                                              |
| `createdAt` | in-memory only   | ISO timestamp                                                    |

### Participant (in-memory)

| Field         | Where     | Notes                                    |
| ------------- | --------- | ---------------------------------------- |
| `displayName` | in-memory | Chosen at room entry, unique within room |
| `joinedAt`    | in-memory | ISO timestamp                            |

### Message (in-memory)

| Field               | Where     | Notes                                            |
| ------------------- | --------- | ------------------------------------------------ |
| `id`                | in-memory | nanoid                                           |
| `authorDisplayName` | in-memory | Display name of sender                           |
| `rawInput`          | in-memory | The original text the user sent                  |
| `component`         | in-memory | AI-classified `{ type, props }` per `catalog.md` |
| `sentAt`            | in-memory | ISO timestamp                                    |

---

## PartyKit HTTP Endpoints (`onRequest`)

PartyKit's `onRequest` handler intercepts HTTP requests to the room URL before the WebSocket upgrade.

All responses include CORS headers (`Access-Control-Allow-Origin: *`) so the Next.js frontend (different port in dev, different domain in production) can call the PartyKit API from the browser. `OPTIONS` preflight requests are handled and return `204`.

### `GET /parties/main/:id`

Returns the room name if the room exists.

**Response:** `200 { id, name }` if the room exists; `404` if not.

Used by the Next.js room page (`/r/[id]/page.tsx`) at render time to fetch the room name for display, and to redirect to `/` if the room does not exist.

### `POST /parties/main/:id` with header `X-Action: create`

Creates a new room.

**Request body:** `{ name: string }`

**Behavior:**

1. Check `room.storage.get("name")` — if already set, return `409 Conflict`
2. `room.storage.set("name", name)`
3. Return `200 { id, name }`

The room ID is determined by `:id` in the URL — generated client-side (nanoid) before the request.

---

## PartyKit Message Protocol

All WebSocket messages are JSON strings. Each has a `type` discriminant.

### Client → Server

```typescript
type ClientMessage =
  | { type: "join"; displayName: string }
  | { type: "message"; body: string }
  | { type: "clear" }
  | { type: "leave" };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "init"; messages: Message[]; participants: Participant[] }
  | { type: "joined"; participant: Participant; participants: Participant[] }
  | { type: "message"; message: Message }
  | { type: "left"; displayName: string; participants: Participant[] }
  | { type: "cleared" }
  | { type: "error"; reason: string };

type Participant = {
  displayName: string;
  joinedAt: string; // ISO timestamp
};

type Message = {
  id: string;
  authorDisplayName: string;
  rawInput: string;
  component: { type: string; props: Record<string, unknown> };
  sentAt: string; // ISO timestamp
};
```

---

## Data Flow

### Create a Room

```
Browser → generate nanoid room ID client-side
Browser → POST /parties/main/<id> (X-Action: create) { name }
        ← { id, name }
Browser → sessionStorage.set(`room:${id}:displayName`, displayName)
Browser → router.push(`/r/${id}`)
```

### Enter the Room Page (creator)

```
Browser → check sessionStorage for `room:${id}:displayName` → found
Browser → PartyKit WebSocket connect to room <id>
        → { type: "join", displayName }
        ← { type: "init", messages[], participants[] }   (full history)
        ← { type: "joined", participant, participants[] } (broadcast to others)
```

### Enter the Room Page (joiner via link)

```
Browser → check sessionStorage for `room:${id}:displayName` → not found
Browser → show inline displayName prompt
User    → enters displayName, submits
Browser → sessionStorage.set(`room:${id}:displayName`, displayName)
Browser → PartyKit WebSocket connect to room <id>
        → { type: "join", displayName }
        ← { type: "init", messages[], participants[] }
        ← { type: "joined", participant, participants[] } (broadcast to others)
```

If `room.storage` has no `name` (room does not exist), PartyKit sends `{ type: "error", reason: "room not found" }` and closes the connection. The room page redirects to `/`.

### Send a Message

```
Browser → PartyKit WS: { type: "message", body }
PartyKit → rate limit check (token bucket per connection, 1/3s, burst 3):
           - tokens available: consume 1, proceed to AI classification
           - no tokens: skip AI, use TextMessage fallback directly
PartyKit → AI classification (if not rate-limited):
           1. Call OpenRouter with catalog context
           2. Get back { type, props }
           3. Validate type is in catalog
           4. Build Message object
PartyKit → push to in-memory messages[]
PartyKit → room.broadcast({ type: "message", message })
All clients ← { type: "message", message }
```

If AI classification fails (timeout, invalid type, malformed JSON) or is rate-limited, PartyKit falls back to `{ type: "TextMessage", props: { body } }`. The message is always delivered — the fallback is silent.

### Clear Chat

```
Browser → PartyKit WS: { type: "clear" }
PartyKit → in-memory messages[] = []
         → room.broadcast({ type: "cleared" })
All clients ← { type: "cleared" }
```

### Exit Room / Disconnect

```
Browser → PartyKit WS: { type: "leave" }  (or connection closes)
PartyKit → remove from in-memory participants map
         → in-memory messages[] = []
         → room.broadcast({ type: "cleared" })
         → room.broadcast({ type: "left", displayName, participants[] })

if participants.length === 0:
  PartyKit → room.storage.delete("name")
```

---

## Room Dissolution

A room is dissolved when the last participant disconnects. PartyKit handles this in `onClose`:

1. Remove participant from in-memory map
2. Clear `messages[]` and broadcast `{ type: "cleared" }` to any remaining connections (same as any other leave)
3. If map reaches zero: delete `name` from `room.storage`
4. The room ID can then be reused (storage is empty, so `create` will succeed)

---

## Rate Limiting

AI classification (OpenRouter calls) is rate-limited per connection using a token bucket:

- **Capacity:** 3 tokens
- **Refill rate:** 1 token every 3 seconds
- **Behaviour on empty bucket:** skip AI, fall back to `TextMessage` silently
- **Implementation:** in-memory on the PartyKit connection object — no external dependency

This caps one participant from triggering more than ~20 AI calls per minute while still allowing short bursts of rapid messages.

---

## AI Classification

Single-shot: one OpenRouter call per message. The system prompt includes the full component catalog from `docs/product/catalog.md`.

**Model:** `google/gemini-2.0-flash-001` via OpenRouter.

**System prompt structure:**

```
You are a message classifier for a chat application.
Classify the user's message into exactly one component type from the catalog below.
Return only valid JSON: { "type": "...", "props": { ... } }
Do not include any explanation or wrapping text.

[catalog component descriptions and props schemas]
```

**Failure handling:** If the response is not valid JSON, or the `type` is not in the catalog, or required props are missing — fall back to `TextMessage`.

---

## Environment Variables

| Variable                    | Used by  | Description                                           |
| --------------------------- | -------- | ----------------------------------------------------- |
| `NEXT_PUBLIC_PARTYKIT_HOST` | Browser  | PartyKit host, e.g. `salita-chat.<user>.partykit.dev` |
| `OPENROUTER_API_KEY`        | PartyKit | OpenRouter API key for AI message classification      |

PartyKit env vars are set via `partykit env add` (stored in PartyKit's hosted secrets, accessible via `this.room.env`).

Next.js env vars are set in Vercel project settings or `.env.local` for development.
