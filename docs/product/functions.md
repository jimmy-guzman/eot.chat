# Function Definition — Salita.chat

Derived from wireframes in `docs/prompts/excalidraw.md` and the Excalidraw diagram.

---

## Application Overview

Salita.chat is a minimal, ephemeral chat application organized around **Rooms**. Users create or join a room with a password, then exchange messages in real time. There are no user accounts — identity is a display name chosen at entry.

---

## Screens

### Screen 1 — Create a Room

**Purpose:** Entry point for a user who wants to start a new chat room.

**Inputs:**

- `roomName` — string, required. The name of the room to create.
- `password` — string, required. Password that others must use to join.
- `displayName` — string, required. The name this user will appear as in the room.

**Action:**

- `Create` button — submits the form, creates the room, and transitions the user directly into the Chat Room screen as the first participant.

**Navigation:**

- The landing page (`/`) is the only entry point for creating a room. Nav links to "Create a Room" (current) and "Join a Room".

---

### Screen 2 — Join a Room

**Purpose:** Entry point for a user who has a room link. Collects the room URL (or bare room ID) and navigates to it. The actual credential entry (password + display name) happens on the room page itself.

**Inputs:**

- `roomLink` — string, required. A full `https://salita.chat/r/<room-id>` URL or a bare room ID.

**Action:**

- `Join` button — extracts the room ID from the input and navigates to `/r/<room-id>`.

**Navigation:**

- Nav links to "Create a Room" and "Join a Room" (current)

**Note:** Password and display name are not collected here. They are collected on the room page (`/r/<room-id>`) when a user arrives without an active session for that room.

---

### Screen 3 — Chat Room

**Purpose:** The primary surface. A live, shared message thread inside a named room.

**Header:**

- Room name displayed as: `You Are Now in Room: <Room Name>`
- Shareable link bar: `https://salita.chat/r/<room-id>` with a one-click copy action

**Message Area:**

- Scrollable list of messages, ordered chronologically
- Each message displays: `displayName: message text`
- The current user's own messages are visually distinguished and left-aligned
- Other participants' messages are right-aligned
- Messages are separated by a horizontal rule

**Message Input:**

- Wide text field with placeholder: `Message or /reshape the room...`
- Supports a `/reshape` slash command (see below)

**Actions:**

- `Send` — submits the typed message to the room
- `Copy Link` — copies the shareable room URL to clipboard
- `Exit Room` — removes the user from the room and returns them to the home/landing state

---

## Slash Commands

### `/reshape`

Typed into the message input field. Triggers an AI-driven UI transformation that affects all participants simultaneously.

**Syntax:** `/reshape <natural language prompt>`

**Examples:**

- `/reshape make this a standup board`
- `/reshape turn this into a kanban board with three columns`
- `/reshape show messages as a timeline`

**Behavior:**

1. Client sends a `reshape` message to the PartyKit server with the prompt text
2. PartyKit server invokes the reshape pipeline (OpenRouter → validated spec)
3. AI generates a new json-render spec tree, constrained to the component catalog
4. The new spec replaces the entire current layout — it is not a partial update
5. PartyKit broadcasts the new spec to all connected participants
6. Every client re-renders immediately from the new spec tree

**Constraints:**

- The AI may only use components defined in the component catalog — unknown component types are rejected and the reshape is aborted
- The reshape command is visible in the message thread as a system event

The `/reshape` command is a power-user affordance, not a primary CTA — surfaced in the input placeholder text.

---

## Data Model

### Room

| Field            | Type      | Notes                                                     |
| ---------------- | --------- | --------------------------------------------------------- |
| `id`             | string    | URL-safe identifier, used in shareable link               |
| `name`           | string    | Human-readable name                                       |
| `password_hash`  | string    | Bcrypt hash of the room password                          |
| `layout`         | jsonb     | Current json-render spec tree; updated on each `/reshape` |
| `created_at`     | timestamp |                                                           |
| `last_active_at` | timestamp | Updated on each message; used for room dissolution        |

### Participant

Participants are not persisted to the database. They exist only in PartyKit's in-memory room state for the duration of their connection.

| Field         | Type      | Notes                                    |
| ------------- | --------- | ---------------------------------------- |
| `displayName` | string    | Chosen at room entry, unique within room |
| `joinedAt`    | timestamp |                                          |

### Message

| Field                 | Type      | Notes                           |
| --------------------- | --------- | ------------------------------- |
| `id`                  | string    |                                 |
| `room_id`             | string    | Foreign key → Room.id           |
| `author_display_name` | string    |                                 |
| `body`                | string    |                                 |
| `sent_at`             | timestamp |                                 |
| `is_command`          | boolean   | True if message begins with `/` |

---

## URL Structure

| Path           | Screen                         |
| -------------- | ------------------------------ |
| `/`            | Landing — Create or Join entry |
| `/r/<room-id>` | Chat Room for the given room   |

---

## Key Constraints

- No user accounts or authentication beyond the room password
- Display names are scoped to a single room session
- Rooms are identified by a short URL-safe ID
- The shareable link (`/r/<room-id>`) is the primary invite mechanism
- The `/reshape` command is a power-user affordance, not a primary CTA
