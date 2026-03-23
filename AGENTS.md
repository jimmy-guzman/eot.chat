# eot.chat — Agent Rules

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React Server Components)
- **Language:** TypeScript (strict mode)
- **Real-time:** PartyKit (Cloudflare workerd) — owns all room state
- **Effect:** Effect-TS 3.x — used in `party/` and `src/server/` only, never in the browser
- **State machine:** XState v5 — room WebSocket lifecycle in `src/app/r/[id]/_components/room-machine.ts`
- **Actions:** `next-safe-action` + Valibot — type-safe server actions with schema validation
- **Forms:** TanStack Form — form state and field context
- **Design system:** PandaCSS — design tokens, recipes, and utility classes
- **UI motion:** PandaCSS-only — use the `durations.motion.{fast,normal,slow}` and `easings.motion.standard` tokens, keyframes `enterFade` / `enterRaise`, and the `motionEnter` recipe (`preset`: `fade` | `raise`) for mount enter animations with a single `prefers-reduced-motion` rule in the recipe; overlay/dialog motion belongs on slot recipes (e.g. `alertDialog`). Compose with `motionEnter()` + `css()` via `cx()` in components — do not add ad hoc `ms` durations, duplicate reduced-motion blocks in routes, or introduce a separate animation runtime unless explicitly agreed
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
      join-room.ts              # Set display-name cookie
      leave-room.ts             # Delete display-name cookie
    _components/                # Root route client components
      create-room-form.tsx      # Landing page form (TanStack Form)
      site-footer.tsx
    r/[id]/
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
          display-name-form.tsx # Join form (TanStack Form)
        page.tsx
      error.tsx
      layout.tsx
      opengraph-image.tsx
      page.tsx                  # Auth gate: reads cookie, fetches room name, redirects or renders
    globals.css                 # PandaCSS @layer declaration
    layout.tsx                  # Root layout — IBM Plex Mono font, metadata
    opengraph-image.tsx
    page.tsx                    # Landing page

  components/                   # Shared React components
    form/                       # TanStack Form-connected UI components
      submit-button.tsx         # Reads isSubmitting from form store
      text-field.tsx            # Labeled input with inline validation error

  lib/                          # Client-safe utilities (no server-only imports)
    app-url.ts                  # Canonical app URL (Vercel env-aware)
    form.ts                     # TanStack Form hook factory (useAppForm)
    safe-action.ts              # next-safe-action client instance
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
- **RSC boundaries** — keep `"use client"` as far down the tree as possible. Page files (`page.tsx`, `layout.tsx`) must be Server Components unless they contain no extractable static content. Extract interactive subtrees into a `_components/` folder co-located with the route. `src/server/` files must never be imported from `"use client"` components.
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
- Introduce a new pattern or structural change without updating `AGENTS.md`.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
