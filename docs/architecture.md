# Architecture — Salita.chat

---

## System Topology

```
┌─────────────────────────────────┐     ┌──────────────────────────────────┐
│         Vercel (Next.js)        │     │     PartyKit hosted (workerd)    │
│                                 │     │                                  │
│  /                (landing)     │     │  party/index.ts                  │
│  /r/[id]          (room page)   │     │                                  │
│  /api/rooms       (create)      │     │  - in-memory participant map     │
│  /api/rooms/[id]  (get state)   │     │  - WebSocket broadcast           │
│  /api/rooms/[id]/join           │     │  - writes to Supabase via        │
│                                 │     │    @supabase/supabase-js         │
│  DB client: drizzle-orm         │     │                                  │
│           + postgres driver     │     └──────────────┬───────────────────┘
└────────────────┬────────────────┘                    │
                 │ SQL (TCP)                            │ HTTPS (REST/PostgREST)
                 └──────────────────┬──────────────────┘
                                    │
                         ┌──────────▼─────────┐
                         │  Supabase (Postgres) │
                         │                     │
                         │  rooms              │
                         │  messages           │
                         └─────────────────────┘
```

**Next.js on Vercel** — Node.js runtime. Uses `drizzle-orm` + `postgres` driver over a direct TCP connection to Supabase. Handles room creation, join validation, and initial state fetch.

**PartyKit hosted** — `workerd` runtime (Cloudflare-based). Cannot use the `postgres` TCP driver. Uses `@supabase/supabase-js` (fetch/HTTP-based) to write messages and update room state. Manages the live participant list in memory.

**Supabase** — Postgres database. Single source of truth for rooms and message history. Both services write to the same database via different client libraries.

---

## Database Schema

```sql
CREATE TABLE rooms (
  id               TEXT PRIMARY KEY,         -- nanoid, e.g. "v7k2mxp"
  name             TEXT NOT NULL,
  password_hash    TEXT NOT NULL,            -- bcrypt hash
  layout           JSONB NOT NULL,           -- current json-render spec tree
  created_at       TIMESTAMPTZ DEFAULT now(),
  last_active_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id                   TEXT PRIMARY KEY,     -- nanoid
  room_id              TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_display_name  TEXT NOT NULL,
  body                 TEXT NOT NULL,
  is_command           BOOLEAN NOT NULL DEFAULT false,
  sent_at              TIMESTAMPTZ DEFAULT now()
);
```

**What lives where:**

| Data                            | Where                                             |
| ------------------------------- | ------------------------------------------------- |
| Room metadata, layout, messages | Supabase (persisted)                              |
| Active participant list         | PartyKit in-memory only                           |
| User identity (displayName)     | `sessionStorage` in the browser, keyed by room ID |

---

## PartyKit Message Protocol

All messages are JSON strings. Each has a `type` discriminant.

### Client → Server

```typescript
type ClientMessage =
  | { type: "join"; displayName: string }
  | { type: "message"; body: string }
  | { type: "reshape"; prompt: string }
  | { type: "leave" };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "joined"; participant: Participant; participants: Participant[] }
  | { type: "message"; message: Message }
  | { type: "left"; displayName: string; participants: Participant[] }
  | { type: "reshaped"; spec: JsonRenderSpec }
  | { type: "error"; reason: string };

type Participant = {
  displayName: string;
  joinedAt: string; // ISO timestamp
};

type Message = {
  id: string;
  roomId: string;
  authorDisplayName: string;
  body: string;
  isCommand: boolean;
  sentAt: string; // ISO timestamp
};
```

---

## Data Flow

### Create a Room

```
Browser → POST /api/rooms { name, password, displayName }
       ← { id, name }
Browser → sessionStorage.set(`room:${id}:displayName`, displayName)
Browser → router.push(`/r/${id}`)
```

Next.js API route: generates a nanoid room ID, bcrypt-hashes the password, inserts into `rooms` with the default chat layout spec, returns `{ id, name }`.

### Join a Room

```
Browser → POST /api/rooms/[id]/join { name, password, displayName }
       ← 200 { id, name } | 401 | 404
Browser → sessionStorage.set(`room:${id}:displayName`, displayName)
Browser → router.push(`/r/${id}`)
```

Next.js API route: looks up room by ID, compares bcrypt hash, returns room info on success.

### Enter the Room Page

```
Browser → GET /api/rooms/[id]
       ← { room, messages[] }          (initial state, server render)
Browser → PartyKit WebSocket connect
       → { type: "join", displayName }
       ← { type: "joined", participant, participants[] }
```

### Send a Message

```
Browser → PartyKit WS: { type: "message", body }
PartyKit → INSERT INTO messages (...)
PartyKit → room.broadcast({ type: "message", message })
         → UPDATE rooms SET last_active_at = now()
All clients ← { type: "message", message }
```

### `/reshape` Command

```
Browser → PartyKit WS: { type: "reshape", prompt: "make this a kanban board" }
PartyKit → reshape pipeline:
           1. Build system prompt from component catalog
           2. Call OpenRouter (streaming) → json-render spec
           3. Validate spec against catalog (reject unknown component types)
           4. UPDATE rooms SET layout = <new spec>
           5. room.broadcast({ type: "reshaped", spec })
All clients ← { type: "reshaped", spec }
All clients → re-render from new spec tree
```

If validation fails, PartyKit sends `{ type: "error", reason: "..." }` back to the sender only. The room layout is unchanged.

### Exit Room / Disconnect

```
Browser → PartyKit WS: { type: "leave" }  (or connection closes)
PartyKit → remove from in-memory participant map
         → room.broadcast({ type: "left", displayName, participants[] })

if participants.length === 0:
  PartyKit → DELETE FROM rooms WHERE id = $roomId  (via supabase-js)
```

---

## Room Dissolution

A room is deleted when the last participant disconnects. PartyKit handles this in `onClose` — if the in-memory participant map reaches zero, it deletes the room row from Supabase (cascading to messages via `ON DELETE CASCADE`).

A safety-net cleanup runs via a Vercel cron at `GET /api/cron/cleanup` (daily): deletes rooms where `last_active_at < now() - interval '24 hours'`. This catches rooms where PartyKit hibernated before the deletion could run.

---

## Environment Variables

| Variable                    | Used by  | Description                                                 |
| --------------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`              | Next.js  | Supabase Postgres connection string (pooled)                |
| `NEXT_PUBLIC_SUPABASE_URL`  | PartyKit | Supabase project URL                                        |
| `SUPABASE_SERVICE_ROLE_KEY` | PartyKit | Supabase service role key (bypasses RLS)                    |
| `NEXT_PUBLIC_PARTYKIT_HOST` | Browser  | PartyKit host, e.g. `salita-chat-party.<user>.partykit.dev` |
| `OPENROUTER_API_KEY`        | PartyKit | OpenRouter API key for the reshape pipeline                 |

PartyKit env vars are set via `partykit env add` (stored in PartyKit's hosted secrets, accessible via `this.room.env`).

Next.js env vars are set in Vercel project settings or `.env.local` for development.
