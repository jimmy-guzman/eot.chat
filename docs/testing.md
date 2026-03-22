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
    bar-chart.spec.tsx
    line-chart.spec.tsx
    metric.spec.tsx
    callout.spec.tsx
    timeline.spec.tsx
    stack.spec.tsx
```

### Coverage per file

| File                        | What to test                                                                                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `party/classify.ts`         | Valid OpenRouter response → correct spec tree; 8s timeout → `TextMessage` spec tree fallback; malformed JSON response → fallback; unknown `type` in response → fallback; single-component result wrapped in spec tree |
| `party/types.ts`            | Valid `ClientMessage` shapes decode successfully; invalid shapes (missing fields, wrong `type`) return `Left`; valid `ServerMessage` shapes decode successfully; `Message.component` decodes as spec tree             |
| `party/token-bucket.ts`     | `consume()` returns `true` within burst capacity; `consume()` returns `false` when empty; tokens refill correctly after elapsed time                                                                                  |
| `src/catalog/schema.ts`     | Each Zod schema accepts valid props; each schema rejects missing required fields with a `ZodError` — including all 6 Phase 8 schemas                                                                                  |
| `src/components/*.tsx`      | Each component renders without throwing given valid props                                                                                                                                                             |
| `src/components/bar-chart`  | Renders with `data` array; renders with optional `title`; renders without crashing when `data` is empty                                                                                                               |
| `src/components/line-chart` | Renders with `data` array; renders with optional `title`; renders without crashing when `data` is empty                                                                                                               |
| `src/components/metric`     | Renders `label` and `value`; renders `trend: "up"` / `"down"` / `"neutral"` indicator; renders without `trend` prop                                                                                                   |
| `src/components/callout`    | Renders `type: "info"`, `"tip"`, `"warning"` each with correct background token class; renders optional `title`                                                                                                       |
| `src/components/timeline`   | Renders all items; renders `status: "completed"`, `"current"`, `"upcoming"` with correct dot colors; renders item without optional fields                                                                             |
| `src/components/stack`      | Renders with `direction: "vertical"` (default); renders with `direction: "horizontal"`; renders with custom `gap`                                                                                                     |

### Mocking recharts in Vitest

recharts components use `ResizeObserver` and SVG APIs that are not available in happy-dom. Mock the entire `recharts` module in the spec file:

```ts
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  CartesianGrid: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));
```

Place this at the top of the spec file, before any imports that trigger the module.

### Effect test patterns

**`E = never` — effect cannot fail**

`party/classify.ts` collapses all errors via `catchAll`, so the error channel is `never`. Use `Effect.runPromise` directly:

```ts
const result = await Effect.runPromise(
  classify("some text", "sk-key", systemPrompt),
);
expect(result).toMatchObject({
  elements: { root: { type: "TextMessage", props: { body: "some text" } } },
  root: "root",
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

### Mocking OpenRouter with MSW

MSW intercepts `fetch` transparently — `Effect.tryPromise(() => fetch(...))` sees the mock with no special setup. Add per-test handlers with `server.use(...)` and they are torn down automatically after each test.

The global setup in `src/testing/vitest.setup.ts` passes `onUnhandledRequest: "error"` to `server.listen()` — any `fetch` without a matching handler throws immediately. This means mocks **must** target the exact endpoint the SDK actually calls. The `@openrouter/sdk` `callModel().getText()` uses the [OpenRouter Responses API](https://openrouter.ai/docs/responses-api) at `POST /v1/responses`.

Return a **non-streaming JSON response** (Content-Type: `application/json`). The SDK detects non-streaming responses via the presence of an `output` field and the absence of `toReadableStream`. Required fields include `usage.input_tokens_details` and `usage.output_tokens_details` — omitting them causes `ResponseValidationError`.

For Phase 8, the mock response must return a valid spec tree JSON string. Example:

```ts
import { http, HttpResponse } from "msw";
import { server } from "@/testing/mocks/server";

const specTree = JSON.stringify({
  elements: { root: { type: "TextMessage", props: { body: "hi" } } },
  root: "root",
});

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
          content: [{ type: "output_text", text: specTree }],
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
| 6 — Clear chat        | `pnpm typecheck` clean; `pnpm lint` clean; `pnpm test --run` green; `pnpm build` succeeds                                                   |
| 7 — Visual identity   | `pnpm typecheck` clean; `pnpm lint` clean; `pnpm test --run` green; `pnpm build` succeeds                                                   |
| 8 — Generative UI     | `pnpm typecheck` clean; `pnpm lint` clean; `pnpm test --run` green; `pnpm build` succeeds                                                   |
