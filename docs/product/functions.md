# Function Definition — eot.chat

---

## Application Overview

eot.chat is an ephemeral real-time chat room. Send messages, they appear as plain text. When everyone leaves, the room dissolves.

There are no user accounts — identity is a display name chosen at entry.

---

## Screens

### Screen 1 — Create a Room

**Purpose:** Entry point for a user who wants to start a new chat room.

**Inputs:**

- `roomName` — string, required. The name of the room to create.
- `displayName` — string, required. The name this user will appear as in the room.

**Action:**

- `Create` button — submits the form, creates the room, and transitions the user directly into the Chat Room screen as the first participant.

**Navigation:**

- The landing page (`/`) is the only screen here. After creating a room the creator is taken directly into it. Share the join link (`/join?code=<join-code>`) with intended participants.

---

### Screen 2 — Join

**Purpose:** Entry point for a user who has received a join link (`/join?code=<join-code>`).

**Inputs:**

- `joinCode` — pre-filled from the `?code=` query parameter, editable.
- `displayName` — string, required. The name this user will appear as in the room.

**Action:**

- `Enter Room` button — validates the join code, sets a session cookie, and redirects to `/r/<room-id>`.

**Note:** The join code is the only access control. Navigating directly to `/r/<room-id>` without a valid session redirects back to `/join`.

---

### Screen 3 — Chat Room

**Purpose:** The primary surface. A live, shared message thread inside a named room.

**Header:**

- Room name displayed as: `<Room Name>`
- Shareable link bar: `https://eot.chat/r/<room-id>` with a one-click copy action

**Message Area:**

- Scrollable list of messages, ordered chronologically
- Each message is rendered as a plain text bubble
- The current user's own messages are visually distinguished (primary-colored bubble, right-aligned)
- Other participants' messages are left-aligned
- New participants receive the full message history from the start of the session

**Message Input:**

- Multi-line text area with placeholder: `Send anything...`. `Enter` submits; `Shift+Enter` inserts a newline.

**Actions:**

- `Send` — submits the input, broadcasts the message to all participants
- `Copy Link` — copies the shareable room URL to clipboard
- `Clear Chat` — clears all messages for every participant in the room immediately; also triggered automatically when any participant leaves
- `Exit Room` — removes the user from the room and returns them to the landing page

---

## Data Model

### Room

Room state lives entirely in PartyKit's in-memory server and storage. Nothing is persisted to a database.

| Field       | Type      | Notes                                                                  |
| ----------- | --------- | ---------------------------------------------------------------------- |
| `id`        | string    | URL-safe nanoid, used in shareable link — also the only access control |
| `name`      | string    | Human-readable name — stored in PartyKit `room.storage`                |
| `createdAt` | timestamp | In-memory only                                                         |

### Participant

Participants live in PartyKit's in-memory room state for the duration of their connection.

| Field         | Type      | Notes                                    |
| ------------- | --------- | ---------------------------------------- |
| `displayName` | string    | Chosen at room entry, unique within room |
| `joinedAt`    | timestamp |                                          |

### Message

Messages live in PartyKit's in-memory room state. They are sent to new participants on join but are not persisted after the room dissolves.

| Field               | Type      | Notes                           |
| ------------------- | --------- | ------------------------------- |
| `id`                | string    | nanoid                          |
| `authorDisplayName` | string    |                                 |
| `rawInput`          | string    | The original text the user sent |
| `sentAt`            | timestamp |                                 |

---

## URL Structure

| Path           | Screen                         |
| -------------- | ------------------------------ |
| `/`            | Landing — Create or Join entry |
| `/r/<room-id>` | Chat Room for the given room   |

---

## Key Constraints

- No user accounts or authentication beyond knowing the join code
- Share the join link (`/join?code=<join-code>`) only with intended participants; room links (`/r/<room-id>`) are not usable without first completing the join flow
- Display names are scoped to a single room session
- Rooms are identified by a short URL-safe ID; the canonical join entrypoint is `/join?code=<join-code>`
- Completing the join flow sets a session cookie required to access `/r/<room-id>`; navigating directly to a room without a valid session redirects to `/join`
- Rooms and messages are ephemeral — no database, no persistence after dissolution
- Messages are cleared immediately when any participant leaves, or when any participant manually triggers a clear
