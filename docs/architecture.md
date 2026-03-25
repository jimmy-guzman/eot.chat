# Architecture — eot.chat

---

## Effect-TS Usage Boundaries

Effect (`effect` v3) is used as a **pipeline assembler on the PartyKit server only**. It never enters the browser bundle.

### What uses Effect

| File                            | Pattern                              | APIs                                                                                        |
| ------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `party/types.ts`                | Schema definitions for wire types    | `Schema.Struct`, `Schema.Union`, `Schema.Literal`, `Schema.Type`                            |
| `party/index.ts`                | Message routing + handler boundaries | `Match.value`, `Match.tag`, `Match.exhaustive`, `Effect.runPromise`, `Effect.gen`, `Logger` |
| `src/server/partykit-client.ts` | HTTP client for PartyKit API         | `Effect.gen`, `HttpClient`, `HttpClientRequest`, `HttpClientResponse`                       |

### What does not use Effect

- **`src/app/`** — React client components use plain TypeScript and React hooks. Effect's fiber model does not compose with React hooks.

### workerd compatibility

Effect computations run inside standard `Promise` boundaries (`Effect.runPromise`). Each `onMessage` and `onRequest` call constructs an `Effect.gen(...)` program and executes it at the boundary — Effect as a description language, `runPromise` as the executor. workerd supports `Promise` natively so this pattern is safe.

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
│                                 │     │                                      │
│                                 │     │  Storage:                            │
│                                 │     │    room.storage → name               │
│                                 │     │  In-memory:                          │
│                                 │     │    participants Map                   │
│                                 │     │    messages[]                        │
└─────────────────────────────────┘     │                                      │
                                        └──────────────────────────────────────┘
```

**Next.js on Vercel** — UI shell only. No API routes for room management. No database client. Serves the landing page, join pages, and room page. Server Actions (next-safe-action) handle room creation, joining, leaving, and join code rotation. All room logic is delegated to PartyKit.

**PartyKit hosted** — `workerd` runtime (Cloudflare-based). Owns all room logic: creation, participant tracking, message history, and room dissolution. Uses `onRequest` for HTTP room creation and `onConnect` / `onMessage` for WebSocket real-time messaging.

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

| Field               | Where     | Notes                           |
| ------------------- | --------- | ------------------------------- |
| `id`                | in-memory | nanoid                          |
| `authorDisplayName` | in-memory | Display name of sender          |
| `rawInput`          | in-memory | The original text the user sent |
| `sentAt`            | in-memory | ISO timestamp                   |

---

## PartyKit HTTP Endpoints (`onRequest`)

PartyKit's `onRequest` handler intercepts HTTP requests to the room URL before the WebSocket upgrade.

All responses include CORS headers (`Access-Control-Allow-Origin: *`) so the Next.js frontend (different port in dev, different domain in production) can call the PartyKit API from the browser. `OPTIONS` preflight requests are handled and return `204`.

### `GET /parties/main/:id`

Returns the room name if the room exists.

**Response:** `200 { id, name }` if the room exists; `404` if not.

Used by the Next.js room layout (`/r/[id]/layout.tsx`) and room page (`/r/[id]/@room/page.tsx`) at render time to fetch the room name for display, and to redirect to `/` if the room does not exist.

### `POST /parties/main/:id` with header `X-Action: create`

Creates a new room.

**Request body:** `{ name: string }`

**Behavior:**

1. Check `room.storage.get("name")` — if already set, return `409 Conflict`
2. `room.storage.put("name", name)`
3. Return `200 { id, name }`

The room ID is determined by `:id` in the URL — generated server-side (nanoid) inside the `createRoom` Server Action.

---

## PartyKit Message Protocol

All WebSocket messages are JSON strings. Each has a `type` discriminant.

### Client → Server

```typescript
type ClientMessage =
  | { type: "join"; displayName: string }
  | { type: "message"; body: string }
  | { type: "clear" }
  | { type: "leave" }
  | { type: "typing" };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "init"; messages: Message[]; participants: Participant[] }
  | { type: "joined"; participant: Participant; participants: Participant[] }
  | { type: "message"; message: Message }
  | { type: "left"; displayName: string; participants: Participant[] }
  | { type: "cleared"; displayName: string }
  | { type: "typing"; displayName: string }
  | { type: "error"; reason: string };

type Participant = {
  displayName: string;
  joinedAt: string; // ISO timestamp
};

type Message = {
  id: string;
  authorDisplayName: string;
  rawInput: string;
  sentAt: string; // ISO timestamp
};
```

---

## Data Flow

### Create a Room

```
Browser → submit createRoom Server Action (next-safe-action + valibot)
Server  → generate nanoid room ID
        → POST /parties/main/<id> (X-Action: create) { name }
        ← { id, name }
Server  → set HttpOnly cookie display-name-{id}
            (path: /r/{id}, maxAge: 86400, sameSite: lax)
        → redirect(/r/{id})
```

### Enter the Room Page (authenticated)

```
layout.tsx        → reads room-session-{id} cookie
                  → verifyRoomSessionToken → valid
                  → renders @room slot (passes through to RoomClient)
@room/page.tsx    → reads display-name-{id} cookie
                  → if missing: redirect(/r/{id}/join)
Browser           → PartyKit WebSocket connect to room <id>
                  → { type: "join", displayName }
                  ← { type: "init", messages[], participants[] }   (full history)
                  ← { type: "joined", participant, participants[] } (broadcast to others)
```

### Enter the Room Page (unauthenticated)

```
layout.tsx → reads room-session-{id} cookie → missing or invalid
           → renders gate UI (200 response — no HTTP redirect)
           → "Join room" link → /join?code=<code> (if ?code= was in original URL)
                              → /join             (if no code in URL)
```

The gate always returns HTTP 200 so crawlers receive the correct OG metadata from `generateMetadata` in `@room/page.tsx` regardless of auth state.

### Join a Room (via /join or /r/[id]/join)

```
Browser → submit joinRoom Server Action { displayName, joinCode }
Server  → resolveJoinCode(joinCode) → roomId (PartyKit HTTP lookup)
        → mintRoomSessionToken(roomId)
        → set cookies: display-name-{roomId}, room-session-{roomId}, room-session-id-{roomId}
        → return { displayName, roomId }
Browser → router.push(/r/{roomId})
```

If `room.storage` has no `name` (room does not exist), PartyKit sends `{ type: "error", reason: "room not found" }` and closes the connection. The room page redirects to `/`.

### Send a Message

```
Browser → PartyKit WS: { type: "message", body }
PartyKit → build Message { id, authorDisplayName, rawInput, sentAt }
PartyKit → push to in-memory messages[]
PartyKit → room.broadcast({ type: "message", message })
All clients ← { type: "message", message }
```

### Clear Chat

```
Browser → PartyKit WS: { type: "clear" }
PartyKit → in-memory messages[] = []
         → room.broadcast({ type: "cleared" })
All clients ← { type: "cleared" }
```

### Typing Indicator

```
Browser → PartyKit WS: { type: "typing" }    (throttled to once per second)
PartyKit → look up sender's displayName from participants map
         → if not found: no-op (must have joined first)
         → room.broadcast({ type: "typing", displayName }, except sender)
Other clients ← { type: "typing", displayName }
             → add displayName to typingNames[] in XState context
             → start 3 s auto-expiry timer per name
             → cleared immediately when a "message" arrives from that name
```

The `typing` message type is ephemeral — it is never stored in `messages[]` and is not replayed on join.

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

## Environment Variables

| Variable                        | Runtime                  | Description                                                                                                |
| ------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_PARTYKIT_HOST`     | Browser + Server         | PartyKit host, e.g. `eot-chat.<user>.partykit.dev`                                                         |
| `PARTYKIT_URL`                  | Server only              | Full PartyKit base URL, e.g. `https://eot-chat.<user>.partykit.dev`. Used by Effect HTTP client            |
| `ROOM_CRYPTO_SECRET`            | Server + PartyKit        | Shared secret (≥ 32 chars) for signing and verifying room session JWTs. Must be identical in both runtimes |
| `VERCEL_ENV`                    | Server (build + runtime) | Vercel environment: `production`, `preview`, or `development`                                              |
| `VERCEL_URL`                    | Server (build + runtime) | Current deployment URL (e.g. `eot-git-feat-foo.vercel.app`). Used as `metadataBase` fallback               |
| `VERCEL_PROJECT_PRODUCTION_URL` | Server (build + runtime) | Shortest production domain (e.g. `eot.chat`). Used as `metadataBase` in production                         |

`ROOM_CRYPTO_SECRET` must be set in **both** PartyKit (via `npx partykit env add ROOM_CRYPTO_SECRET`) and the Next.js hosting environment (Vercel project settings). If they differ, all room joins will fail with an authorization error.

`VERCEL_*` variables are automatically injected by Vercel — do not set them manually. `NEXT_PUBLIC_PARTYKIT_HOST` and `PARTYKIT_URL` are set in Vercel project settings or `.env.local` for local development.
