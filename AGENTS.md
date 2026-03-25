# eot.chat — Agent Rules

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Server Components)
- **Language:** TypeScript (strict mode)
- **Real-time:** PartyKit (Cloudflare workerd) — owns all room state
- **Effect:** Effect-TS 3.x — used in `party/` and `src/server/` only, never in the browser
- **State machine:** XState v5 — room WebSocket lifecycle in `src/app/r/[id]/_components/room-machine.ts`
- **Actions:** `next-safe-action` + Valibot — type-safe server actions with schema validation
- **Forms:** TanStack Form — form state and field context; `SubmitButton` is only for full-width page flows (`block` primary). Modal footers compose `button({ size: "sm", ... })` with `useStore(form.store, (s) => s.isSubmitting)`.
- **Design system:** PandaCSS — design tokens, recipes, and utility classes
- **UI motion:** PandaCSS-first — use `durations.motion.{fast,normal,slow}`, `easings.motion.standard`, keyframes `enterFade` / `enterRaise`, and the `motionEnter` recipe (`preset`: `fade` | `raise`) for mount enter animations; overlay/dialog motion belongs on slot recipes: generic **`dialog`** (shadcn-style slots: `backdrop`, `content`, `header`, `title`, `description`, `body`, `footer`) for `Dialog` modals, and **`alertDialog`** for `AlertDialog` confirms. Compose with `motionEnter()` + `css()` via `cx()`. **`motion`** (`motion/react`) is allowed only for **`ParticipantStrip`** layout (`LazyMotion` + `domMax`, `layout` on chips): import spring config from `src/lib/layout-list-spring.ts`, use `useReducedMotion()`, and do not add Motion elsewhere without updating this doc
- **Linting:** ESLint 9 with `@jimmy.codes/eslint-config`
- **Formatting:** oxfmt (Prettier-compatible, Rust-based)
- **Testing:** Vitest + Testing Library + happy-dom (unit/component), Playwright (e2e), MSW (HTTP mocking)
- **Package manager:** pnpm

## Project Structure

```txt
party/                          # PartyKit server (Cloudflare workerd)
  index.ts                      # Server: onRequest (HTTP), onConnect/onMessage/onClose (WS)
  index.spec.ts
  types.ts                      # Effect Schema wire types — ClientMessage, ServerMessage, Message, Participant
  types.spec.ts

src/
  app/                          # Next.js App Router
    _actions/                   # Server Actions (next-safe-action + Valibot)
      create-room.ts            # Generate ID → POST to PartyKit → set cookie → redirect
      join-room.ts              # Resolve join code → set session cookies → return roomId
      leave-room.ts             # Delete all room-scoped cookies
      rotate-join-code.ts       # Host-only: rotate join code on PartyKit → return new code
    _components/                # Root route client components
      create-room-form.tsx      # Landing page form (TanStack Form)
      join-room-form.tsx        # Global join form — accepts initialJoinCode from ?code= param
      nuqs-provider.tsx         # NuqsAdapter for search param state
      site-footer.tsx
    join/
      page.tsx                  # /join — global join page, reads ?code= search param
      search-params.ts          # nuqs loader for ?code= param
    r/[id]/
      @room/
        default.tsx             # Parallel route fallback (returns null)
        page.tsx                # Authenticated room render + generateMetadata
      _components/              # Room route client components
        room-client.tsx         # Root "use client" orchestrator (useMachine)
        room-machine.ts         # XState v5 machine + PartySocket actor
        room-machine.spec.ts
        room-header.tsx
        message-list.tsx
        message-input.tsx
        participant-strip.tsx
        status-bar.tsx          # Server Component — receives StatusNotification prop
        status-bar.spec.tsx
        confirm-dialog.tsx
      join/
        _components/
          display-name-form.tsx # Room-scoped join form (TanStack Form)
        page.tsx                # /r/[id]/join — display name entry for known room
      error.tsx
      layout.tsx                # Auth gate: verifies session, renders @room slot or gate UI
      opengraph-image.tsx       # Per-room OG image (fetches room name from PartyKit)
    globals.css                 # PandaCSS @layer declaration
    layout.tsx                  # Root layout — IBM Plex Mono font, metadataBase
    opengraph-image.tsx         # Root OG image (static EOT wordmark)
    page.tsx                    # Landing page

  components/                   # Shared React components
    form/                       # TanStack Form-connected UI components
      submit-button.tsx         # Reads isSubmitting from form store
      text-field.tsx            # Labeled input with inline validation error

  lib/                          # Client-safe utilities (no server-only imports)
    app-url.ts                  # Canonical app URL (Vercel env-aware)
    form.ts                     # TanStack Form hook factory (useAppForm)
    layout-list-spring.ts       # Motion layout spring preset (ParticipantStrip only)
    safe-action.ts              # next-safe-action client instance
    join-code.ts                # Shared join code generator (nanoid alphabet)
    schemas.ts                  # Valibot schemas (displayName, roomName, join, leave)

  server/                       # Server-only code (never imported by client components)
    partykit-client.ts          # Effect HTTP client: getRoomName, createPartyKitRoom
    partykit-client.spec.ts

  testing/                      # Shared test infrastructure
    mocks/server.ts             # MSW node server
    utils.tsx                   # Custom render wrapper
    vitest.setup.ts

  env.ts                        # t3-oss/env-nextjs environment validation (Valibot)

e2e/
  chat.spec.ts                  # Playwright happy-path E2E test
  smoke.spec.ts
  tsconfig.json
```

## Architecture

See `docs/architecture.md` for the full system topology, Effect-TS boundaries, PartyKit protocol, and data flow diagrams.

Key ownership rules:

| Directory / alias | Rule                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `src/lib/`        | Client-safe only — no server env vars, no Effect HTTP client, importable by both Server and Client Components       |
| `src/server/`     | Server-only — may use `PARTYKIT_URL`, `@effect/platform`, Node APIs. Never imported by `"use client"` files         |
| `@party/*`        | Wire types shared across the `party/` ↔ `src/` boundary. Always use this alias — never traverse with relative paths |

## Commands

```txt
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm lint         # Lint (ESLint)
pnpm lint:fix     # Lint and auto-fix
pnpm format:fix   # Format (oxfmt)
pnpm typecheck    # Type check (tsc)
pnpm test         # Run tests (Vitest)
pnpm e2e          # Run e2e tests (Playwright)
pnpm e2e:ui       # Run e2e tests with UI
```

## Secrets

`ROOM_CRYPTO_SECRET` is used by **both** the PartyKit worker (to verify session tokens on join) and the Next.js server (to mint session tokens in server actions). Both runtimes must use the **identical** value — if they differ, token verification will fail and every join will be rejected with `unauthorized`.

### Local development

`partykit.json` contains a `vars.ROOM_CRYPTO_SECRET` placeholder for local development only. Copy the same value into `.env.local` so both runtimes agree:

```txt
# partykit.json vars.ROOM_CRYPTO_SECRET
ROOM_CRYPTO_SECRET="dev-only-replace-for-prod-min-32-chars"

# .env.local — must be identical
ROOM_CRYPTO_SECRET="dev-only-replace-for-prod-min-32-chars"
```

### Production

Set the real secret via the PartyKit CLI, then copy the same value into your hosting provider's environment (e.g. Vercel):

```txt
npx partykit env add ROOM_CRYPTO_SECRET
```

The value must be at least 32 characters. Generate one with:

```txt
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Verification

After **every** set of changes, run all of these checks before considering the task done. Do not skip any step — the build in particular catches errors (like missing Suspense boundaries) that other checks miss.

```txt
pnpm typecheck    # 1. Type check
pnpm lint         # 2. Lint (fix errors before proceeding)
pnpm test         # 3. Unit tests
pnpm build        # 4. Production build (MUST pass — catches SSR/prerender errors)
```

If any step fails, fix the issue and re-run from that step. Do not move on until all four pass.

---

## Conventions

- **Path aliases:** `@/*` → `./src/*`, `@party/*` → `./party/*`, `styled-system/*` → `./styled-system/*`.
- **Named exports** preferred over default exports (except Next.js pages and layouts).
- Use `satisfies` for type narrowing on config objects.
- Test files use the `.spec.ts` / `.spec.tsx` suffix and live next to the code they test.
- **Bottom-up file structure** — private helpers and sub-components at the top, the main exported item at the bottom. The file's public API is immediately visible when you scroll to the end.
- Use top-level `import type` declarations, not inline `import { type Foo }`.
- Sort object keys and import statements alphabetically.
- No comments in the codebase that are not JSDoc or TODO/FIXME notes.
- **Kebab-case filenames** — all files and directories use kebab-case (e.g. `room-client.tsx`, `token-bucket.ts`). Next.js reserved filenames (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, etc.) are exempt.
- **RSC boundaries** — keep `"use client"` as far down the tree as possible. Page files (`page.tsx`, `layout.tsx`) must be Server Components unless they contain no extractable static content. Extract interactive subtrees into a `_components/` folder co-located with the route. `src/server/` files must never be imported from `"use client"` components. `layout.tsx` may serve as an auth gate — verify session server-side and conditionally render a parallel route slot (authenticated path) or an inline interstitial (unauthenticated path) to keep the HTTP response always 200 so crawlers receive correct OG metadata.
- **Environment variables** are validated in `src/env.ts` using `@t3-oss/env-nextjs` with Valibot. Import from `@/env` — never use `process.env` directly. Server var: `PARTYKIT_URL`. Client var: `NEXT_PUBLIC_PARTYKIT_HOST`.

---

## Lint-enforced rules

These are caught by the linter, but following them preemptively avoids round-trips:

- Test titles (`it`/`test`) must start with `"should"` (`vitest/valid-title`).
- Use `toStrictEqual()` instead of `toEqual()` (`vitest/prefer-strict-equal`).
- Use top-level `import type` declarations, not inline `import { type Foo }` (`import-x/consistent-type-specifier-style`).
- Arrow functions: implicit return for single-expression bodies, explicit `return` for multi-line (`arrow-style/arrow-return-style`). Note: even single expressions that span multiple lines require explicit `return`.
- In tests, avoid direct DOM node access (`.closest()`, `.firstChild`, etc.) — use Testing Library queries instead (`testing-library/no-node-access`).
- Use `toHaveTextContent` instead of asserting on `.textContent` (`jest-dom/prefer-to-have-text-content`).
- Use template literals instead of string concatenation (`prefer-template`).
- Side-effect imports must come before value imports within the same group (`perfectionist/sort-imports`).
- Use `replaceAll()` instead of `replace()` with a global regex (`unicorn/prefer-string-replace-all`).
- Use `**` instead of `Math.pow()` (`prefer-exponentiation-operator`).
- Do not use `??` or `||` fallbacks when the left-hand side type is already non-nullable (`@typescript-eslint/no-unnecessary-condition`).
- Icons from `lucide-react` must use the `Icon` suffix (`PlusIcon` not `Plus`) — enforced in `eslint.config.ts`.

---

## Testing Notes

The project uses **happy-dom** as the test environment. MSW mocks the PartyKit HTTP API at the network layer — prefer MSW over module-level mocks for `src/server/partykit-client.ts`.

### Mocking patterns

- **PartyKit HTTP:** Use MSW handlers in `src/testing/mocks/server.ts`. The test env injects `PARTYKIT_URL=http://localhost:1999` and `NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999`.
- **Server actions:** Mock the action module (e.g. `vi.mock("@/app/_actions/create-room", () => ({ createRoom: vi.fn() }))`) to avoid `"use server"` context errors in component tests.
- **XState actors:** Use `createActor(roomMachine, { input: { ... } })` directly in unit tests — no React rendering needed for machine logic.
- **`@party/types` in tests:** The `@party/*` alias is resolved via `tsconfigPaths` in `vitest.config.ts` — no additional setup needed.

### Known happy-dom limitations

- **Clipboard:** `navigator.clipboard.writeText` always resolves — clipboard error paths are not testable.
- **Radix/Base UI interactive:** pointer capture not implemented — dropdowns and dialogs can only be tested in their default rendered state.

---

## Documentation

After **every** set of changes, update the relevant docs before committing:

- **`AGENTS.md`** — update the Project Structure tree if files were added, moved, or deleted; update any conventions, rules, or descriptions that changed.
- **`docs/architecture.md`** — update data flow diagrams, endpoint descriptions, environment variable tables, and system topology if the runtime behaviour changed.

If a change introduces a new pattern or structural convention not yet covered in either document, add it. Do not leave docs stale.

---

## Pausing

### Between phases

After completing a phase — committing and verifying all checks pass — stop. Post a short summary of what was built, then ask the user explicitly before starting the next phase.

### On uncertainty

If a decision is not covered by a spec or these rules, do not invent — stop and ask. This includes ambiguous requirements, missing design detail, or any structural choice not addressed in `docs/`.

### On a debug loop

If the same error persists after 3 consecutive fix attempts, stop. Report what the error is, what was tried, and what the likely cause is. Do not attempt a fourth fix without user input.

---

## Branching & Commits

- **Branch naming:** `{type}-{short-description}` in kebab-case. Type prefix matches commit types: `feat-`, `fix-`, `refactor-`, `chore-`, `docs-`, `ci-`. Examples: `feat-room-page`, `fix-rate-limit-refill`.
- **Commits:** Conventional Commits format with an emoji after the colon and lowercase descriptions. Format: `<type>: <emoji> <description>`. Subject line under 64 characters; wrap body at 72 characters.
- **Commit emojis:** `feat` → `✨`, `fix` → `🐛`, `docs` → `📝`, `chore` → `🤖`, `ci` → `👷`, `test` → `✅`, `refactor` → `🔄`, `style` → `🎨`, `perf` → `⚡️`, `revert` → `⏪`, `release` → `🚀`.
- All work goes through a branch and PR — no direct commits to `main`.
- Branch off `main`, push, and open a PR with `gh pr create`. PR titles follow the same conventional commit format.

---

## Do NOT

- Use `as`, `!`, or `any` without first exhausting proper solutions. If a type error appears, understand why before casting.
- Silence lint errors by adding rule overrides to `eslint.config.ts` — fix the root cause instead.
- Leave unused exports or files.
- Leave tests failing after making changes.
- Leave lint errors unresolved after making changes.
- Leave the build broken after making changes.
- Add unnecessary `"use client"` directives — prefer Server Components.
- Leave comments that are not JSDoc or TODO/FIXME notes.
- Use redundant return types for internal functions where the return type is inferable — exceptions are exported functions and interface method signatures where the type is part of the public contract.
- Import from `src/server/` in client components — all `"use client"` files must only import from `src/lib/`, `src/components/`, `@party/*`, or external packages.
- Use relative paths that cross the `party/` ↔ `src/` boundary — always use `@party/*`.
- Introduce a new pattern or structural change without updating `AGENTS.md` and `docs/architecture.md`.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
