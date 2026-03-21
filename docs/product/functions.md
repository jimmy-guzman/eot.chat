# Function Definition — Salita.chat

Derived from wireframes in `docs/prompt.excalidraw.md` and the Excalidraw diagram.

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

- Nav links to "Create a Room" (current) and "Join a Room"

---

### Screen 2 — Join a Room

**Purpose:** Entry point for a user who has been invited to an existing room.

**Inputs:**

- `roomName` — string, required. Must match an existing room.
- `password` — string, required. Must match the room's password.
- `displayName` — string, required. The name this user will appear as in the room.

**Action:**

- `Join` button — validates credentials against the existing room, then transitions the user into the Chat Room screen.

**Navigation:**

- Nav links to "Create a Room" and "Join a Room" (current)

---

### Screen 3 — Chat Room

**Purpose:** The primary surface. A live, shared message thread inside a named room.

**Header:**

- Room name displayed as: `You Are Now in Room: <Room Name>`
- Shareable link bar: `https://salita.chat/r/<room-id>` with a one-click copy action

**Message Area:**

- Scrollable list of messages, ordered chronologically
- Each message displays: `displayName: message text`
- The current user's own messages are visually distinguished (left-aligned in wireframe)
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

Typed into the message input field. Allows a participant to modify the room's configuration or behavior mid-session. Exact parameters TBD, but the command is a first-class affordance — surfaced in the placeholder text.

---

## Data Model (inferred)

### Room

| Field          | Type          | Notes                                       |
| -------------- | ------------- | ------------------------------------------- |
| `id`           | string        | URL-safe identifier, used in shareable link |
| `name`         | string        | Human-readable name                         |
| `password`     | string        | Required to join                            |
| `createdAt`    | timestamp     |                                             |
| `participants` | Participant[] | Active members                              |
| `messages`     | Message[]     | Ordered message history                     |

### Participant

| Field         | Type      | Notes                                    |
| ------------- | --------- | ---------------------------------------- |
| `displayName` | string    | Chosen at room entry, unique within room |
| `joinedAt`    | timestamp |                                          |

### Message

| Field               | Type      | Notes                           |
| ------------------- | --------- | ------------------------------- |
| `id`                | string    |                                 |
| `authorDisplayName` | string    |                                 |
| `body`              | string    |                                 |
| `sentAt`            | timestamp |                                 |
| `isCommand`         | boolean   | True if message begins with `/` |

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
