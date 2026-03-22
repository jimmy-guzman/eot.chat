# Testing — Salita.chat

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

| Server   | Command            | URL                     |
| -------- | ------------------ | ----------------------- |
| Next.js  | `pnpm dev`         | `http://localhost:3000` |
| PartyKit | `npx partykit dev` | `http://localhost:1999` |

`.env.local` must contain:

```sh
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

`OPENROUTER_API_KEY` must also be set in `.env.local` for AI classification to work locally. See `.env.local.example` for the full template.

---

## Unit tests (Vitest)

Tests are co-located with the files they cover. The MSW server is started globally in `src/testing/vitest.setup.ts` with `onUnhandledRequest: "error"` — any `fetch` not explicitly mocked will throw, keeping tests honest.

### File locations

```
party/
  classify.spec.ts
  types.spec.ts
  token-bucket.spec.ts
src/
  catalog/
    schema.spec.ts
  components/
    text-message.spec.tsx
    link-preview.spec.tsx
    repo-card.spec.tsx
    code-block.spec.tsx
    table.spec.tsx
    poll.spec.tsx
    image-card.spec.tsx
```

### Coverage per file

| File                    | What to test                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `party/classify.ts`     | Valid OpenRouter response → correct `Classification`; 8s timeout → `TextMessage` fallback; malformed JSON response → `TextMessage` fallback; unknown `type` in response → `TextMessage` fallback |
| `party/types.ts`        | Valid `ClientMessage` shapes decode successfully; invalid shapes (missing fields, wrong `type`) return `Left`; valid `ServerMessage` shapes decode successfully                                  |
| `party/token-bucket.ts` | `consume()` returns `true` within burst capacity; `consume()` returns `false` when empty; tokens refill correctly after elapsed time                                                             |
| `src/catalog/schema.ts` | Each Zod schema accepts valid props; each schema rejects missing required fields with a `ZodError`                                                                                               |
| `src/components/*.tsx`  | Each component renders without throwing given valid props                                                                                                                                        |

### Effect test patterns

**`E = never` — effect cannot fail**

`party/classify.ts` collapses all errors via `catchAll`, so the error channel is `never`. Use `Effect.runPromise` directly:

```ts
const result = await Effect.runPromise(classify("some text", "sk-key"));
expect(result).toMatchObject({
  type: "TextMessage",
  props: { body: "some text" },
});
```

**Asserting on a failure branch**

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

**Schema — success path**

```ts
import { Schema } from "effect";

const result = Schema.decodeUnknownSync(ClientMessageSchema)({ type: "leave" });
expect(result).toEqual({ type: "leave" });
```

**Schema — error path**

```ts
import { Either, Schema } from "effect";

const result = Schema.decodeUnknownEither(ClientMessageSchema)({
  type: "unknown",
});
expect(Either.isLeft(result)).toBe(true);
```

**Mocking OpenRouter with MSW**

MSW intercepts `fetch` transparently — `Effect.tryPromise(() => fetch(...))` sees the mock with no special setup. Add per-test handlers with `server.use(...)` and they are torn down automatically after each test.

The global setup in `src/testing/vitest.setup.ts` passes `onUnhandledRequest: "error"` to `server.listen()` — any `fetch` without a matching handler throws immediately. This means mocks **must** target the exact endpoint the SDK actually calls. The `@openrouter/sdk` `callModel().getText()` uses the [OpenRouter Responses API](https://openrouter.ai/docs/responses-api) at `POST /v1/responses`.

Return a **non-streaming JSON response** (Content-Type: `application/json`). The SDK detects non-streaming responses via the presence of an `output` field and the absence of `toReadableStream`. Required fields include `usage.input_tokens_details` and `usage.output_tokens_details` — omitting them causes `ResponseValidationError`.

```ts
import { http, HttpResponse } from "msw";
import { server } from "@/testing/mocks/server";

const content = '{"type":"TextMessage","props":{"body":"hi"}}';

server.use(
  http.post("https://openrouter.ai/api/v1/responses", () =>
    HttpResponse.json({
      id: "resp_1",
      object: "response",
      output: [
        {
          id: "msg_1",
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: content }],
        },
      ],
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15,
        input_tokens_details: { cached_tokens: 0 },
        output_tokens_details: { reasoning_tokens: 0 },
      },
    }),
  ),
);
```

---

## E2E tests (Playwright)

Playwright runs against both local servers simultaneously. `playwright.config.ts` starts `pnpm dev` (Next.js) and `npx partykit dev` (PartyKit) as `webServer` entries — no manual setup needed before running `pnpm e2e`.

The suite uses real WebSockets against the real local PartyKit server. AI classification calls hit OpenRouter — `OPENROUTER_API_KEY` must be set in the environment for E2E to pass.

### Happy-path flow (`e2e/chat.spec.ts`)

1. Navigate to `/` — Create Room form is visible
2. Fill `roomName` and `displayName`, submit → redirect to `/r/<id>`
3. Room header shows the correct room name
4. Send a plain text message → `TextMessage` component renders
5. Send a GitHub URL → `RepoCard` component renders
6. Open a second browser context at the same `/r/<id>` URL → displayName prompt is shown
7. Second context enters a display name and joins → first context sees the updated participant list
8. Second context sends a message → first context receives and renders it
9. Second context clicks Exit Room → first context sees the participant leave
10. First context clicks Exit Room → navigating back to `/r/<id>` redirects to `/`

---

## Verification checklist

What "done" looks like at the end of each phase:

| Phase                 | Gate                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Foundation        | `pnpm build` succeeds; `pnpm typecheck` clean; M PLUS Rounded 1c renders in the browser                                                     |
| 1 — Design system     | `pnpm build` succeeds; `pnpm typecheck` clean; Panda `styled-system/` output contains recipe classes                                        |
| 2 — PartyKit server   | `pnpm test --run` green; room creation `POST` returns `200 { id, name }`; WebSocket `join` → `init` round-trip works via `npx partykit dev` |
| 3 — Component catalog | All component unit tests pass; `pnpm build` succeeds                                                                                        |
| 4 — Landing page      | Form creates a room and redirects; `pnpm typecheck` clean                                                                                   |
| 5 — Room page         | `pnpm e2e` green (full happy path passes)                                                                                                   |
