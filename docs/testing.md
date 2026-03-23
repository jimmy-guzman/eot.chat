# Testing — eot.chat

---

## Commands

```sh
pnpm test               # Vitest unit tests (watch mode)
pnpm test --run         # Vitest single run (CI)
pnpm typecheck          # tsc --noEmit
pnpm lint               # ESLint
pnpm e2e                # Playwright E2E (auto-starts both servers)
pnpm e2e:ui             # Playwright interactive UI mode
```

---

## Local development setup

Two servers are required to run the full application locally:

| Server   | Command             | URL                     |
| -------- | ------------------- | ----------------------- |
| Next.js  | `pnpm dev`          | `http://localhost:3000` |
| PartyKit | `pnpm partykit:dev` | `http://localhost:1999` |

`.env.local` must contain:

```sh
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
PARTYKIT_URL=http://localhost:1999
```

---

## Unit tests (Vitest)

Tests are co-located with the files they cover. The MSW server is started globally in `src/testing/vitest.setup.ts` with `onUnhandledRequest: "error"` — any `fetch` not explicitly mocked will throw, keeping tests honest.

### File locations

```
party/
  index.spec.ts
  types.spec.ts
src/
  server/
    partykit-client.spec.ts
  app/r/[id]/_components/
    room-machine.spec.ts
    status-bar.spec.tsx
```

### Coverage per file

| File                                         | What to test                                                                                                                                                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `party/types.ts`                             | Valid `ClientMessage` and `ServerMessage` shapes decode successfully (including `typing`); invalid shapes return `Left`                                                                                                                                           |
| `party/index.ts`                             | `join` → `init` response; `message` broadcast; `clear` clears history and broadcasts `cleared`; any leave clears and broadcasts; `typing` broadcasts to all except sender; `typing` no-op if sender has not joined; room dissolution when last participant leaves |
| `src/server/partykit-client.ts`              | `getRoomName` returns name on `200`; returns `null` on `404`; `createPartyKitRoom` posts with correct headers and returns `{ id, name }`                                                                                                                          |
| `src/app/r/[id]/_components/room-machine.ts` | State transitions (connecting → connected → disconnected); `typingNames` added on `SOCKET_TYPING`; duplicate names deduplicated; names expire after 3 s; timer resets on repeated `SOCKET_TYPING` from same name                                                  |
| `src/app/r/[id]/_components/status-bar.tsx`  | Renders "X is typing…" for 1 name; "X and Y are typing…" for 2; "X, Y and Z are typing…" for 3+                                                                                                                                                                   |

### Effect test patterns

**Schema — success path**

```ts
import { Schema } from "effect";

const result = Schema.decodeUnknownSync(ClientMessageSchema)({ type: "leave" });
expect(result).toStrictEqual({ type: "leave" });
```

**Schema — error path**

```ts
import { Either, Schema } from "effect";

const result = Schema.decodeUnknownEither(ClientMessageSchema)({
  type: "unknown",
});
expect(Either.isLeft(result)).toBe(true);
```

**Effect with typed error channel**

When the effect has a typed `E`, use `Effect.runPromiseExit` — it always resolves and never rejects:

```ts
import { Cause, Effect, Exit, Option } from "effect";

const exit = await Effect.runPromiseExit(someEffect);
expect(Exit.isFailure(exit)).toBe(true);
if (Exit.isFailure(exit)) {
  const err = Cause.failureOption(exit.cause); // Option<E>
  expect(Option.isSome(err)).toBe(true);
}
```

### Mocking PartyKit HTTP with MSW

MSW intercepts `fetch` transparently at the network layer — no module mocks needed for `src/lib/partykit-client.ts`. Add per-test handlers with `server.use(...)` and they are torn down automatically after each test.

```ts
import { http, HttpResponse } from "msw";
import { server } from "@/testing/mocks/server";

server.use(
  http.get("http://localhost:1999/parties/main/:id", () =>
    HttpResponse.json({ id: "abc", name: "My Room" }),
  ),
);
```

### Mocking Server Actions in component tests

Server Actions (`"use server"`) cannot run in the Vitest/happy-dom environment. Mock the action module directly:

```ts
vi.mock("@/app/_actions/create-room", () => ({
  createRoom: vi.fn(),
}));
```

---

## E2E tests (Playwright)

Playwright runs against both local servers simultaneously. `playwright.config.ts` starts `pnpm dev` (Next.js) and `pnpm partykit:dev` (PartyKit) as `webServer` entries — no manual setup needed before running `pnpm e2e`.

The suite uses real WebSockets against the real local PartyKit server.

### Happy-path flow (`e2e/chat.spec.ts`)

1. Navigate to `/` — Create Room form is visible
2. Fill `roomName` and `displayName`, submit → redirect to `/r/<id>`
3. Room header shows the correct room name
4. Send a plain text message → message appears in the chat
5. Open a second browser context at the same `/r/<id>` URL → display name prompt is shown
6. Second context enters a display name and joins → first context sees the updated participant list
7. Second context sends a message → first context receives and renders it
8. Second context clicks Exit Room → first context sees the participant leave
9. First context clicks Exit Room → navigating back to `/r/<id>` redirects to `/`
