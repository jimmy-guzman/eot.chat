# Salita.chat — Agent Rules

## Specs

The `docs/` folder contains the canonical specifications for this project. Implementation must match the specs. If code and a spec disagree, the spec is wrong — update the spec first, then write the code. Never silently diverge.

| Spec                        | What it covers                                                  |
| --------------------------- | --------------------------------------------------------------- |
| `docs/product/functions.md` | Screens, data model, URL structure, key constraints             |
| `docs/product/visual.md`    | Color tokens, typography, illustration language                 |
| `docs/product/catalog.md`   | Message component types, props schemas, AI classification rules |
| `docs/architecture.md`      | System topology, data flow, PartyKit protocol, rate limiting    |
| `docs/plan.md`              | Build phases, file map, milestone summary                       |

## Supporting material (not specs)

| Path              | What it is                                                         |
| ----------------- | ------------------------------------------------------------------ |
| `docs/prompts/`   | AI prompts for generating design assets — not implementation rules |
| `docs/reference/` | Mood images and wireframes — visual reference only                 |

## Before writing any code

1. Read the relevant spec(s) for the area you are working in
2. Read `node_modules/next/dist/docs/` for Next.js API guidance (see below)
3. If a spec is ambiguous or missing detail, stop and ask — do not invent

## Progress tracking

As you work through a phase, check off each item in `docs/progress.md` as it is completed — files, tests, and verification steps. Tick "Phase complete" once the phase commit lands on `main`.

---

## Pausing

### Between phases

After completing a phase — committing and verifying all checks pass — stop. Post a short summary of what was built, then ask the user explicitly before starting the next phase. Do not begin Phase N+1 without a clear go-ahead.

### On uncertainty

If a decision is not covered by a spec or these rules, do not invent — stop and ask. This includes ambiguous requirements, missing design detail, or any structural choice not addressed in `docs/`.

### On a debug loop

If the same error persists after 3 consecutive fix attempts, stop. Report:

- What the error is
- What was tried
- What you think the likely cause is

Do not attempt a fourth fix without user input.

---

## Commands

```txt
pnpm dev          # Start dev server
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

- **Path alias** `@/*` maps to `./src/*`.
- **Named exports** preferred over default exports (except Next.js pages and layouts).
- Use `satisfies` for type narrowing on config objects.
- Test files use the `.spec.ts` / `.spec.tsx` suffix and live next to the code they test.
- **Bottom-up file structure** — private helpers and sub-components at the top, the main exported item at the bottom. The file's public API is immediately visible when you scroll to the end.
- Use top-level `import type` declarations, not inline `import { type Foo }`.
- Sort object keys and import statements alphabetically.
- No comments in the codebase that are not JSDoc or TODO/FIXME notes.
- **Kebab-case filenames** — all files and directories use kebab-case (e.g. `room-client.tsx`, `token-bucket.ts`). Next.js reserved filenames (`page.tsx`, `layout.tsx`, `route.ts`, `error.tsx`, etc.) are exempt.
- **RSC boundaries** — keep `"use client"` as far down the tree as possible. Page files (`page.tsx`, `layout.tsx`) must be Server Components unless they contain no extractable static content. Extract interactive subtrees into a `_components/` folder co-located with the route (e.g. `src/app/_components/` for the root, `src/app/r/[id]/_components/` for the room route). Use `useTransition` for async form submissions — it provides `isPending` without manual `loading` state and keeps the UI responsive during the transition. Reserve `useOptimistic` for mutations that have a meaningful local preview (e.g. appending a sent message before the server broadcasts it back).

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
- Effect `flatMap`: use `ServiceTag.pipe(Effect.flatMap(svc => svc.method()))` — not `Effect.flatMap(ServiceTag, fn)` (`unicorn/no-array-method-this-argument`).

---

## Branching & Commits

- **Branch naming:** `{type}-{short-description}` in kebab-case. Type prefix matches commit types: `feat-`, `fix-`, `refactor-`, `chore-`, `docs-`, `ci-`. Examples: `feat-room-page`, `fix-rate-limit-refill`.
- **Commits:** Conventional Commits format with an emoji after the colon and lowercase descriptions. Format: `<type>: <emoji> <description>`. Subject line under 64 characters; wrap body at 72 characters.
- **Commit emojis:** `feat` → `✨`, `fix` → `🐛`, `docs` → `📝`, `chore` → `🤖`, `ci` → `👷`, `test` → `✅`, `refactor` → `🔄`, `style` → `🎨`, `perf` → `⚡️`, `revert` → `⏪`, `release` → `🚀`.
- **Commit cadence:** one commit per phase, after all four verification checks pass (`typecheck` → `lint` → `test` → `build`). Update `docs/progress.md` to reflect completion before committing. Commit message format: `feat: ✨ phase <n> — <phase name>` (e.g. `feat: ✨ phase 0 — foundation`).
- Commits go directly to `main` — no feature branch per phase.
- For non-phase work (fixes, docs, refactors), branch off `main`, push, and open a PR with `gh pr create`. PR titles follow the same conventional commit format.
- Do not commit directly to `main` for non-phase work — create a branch first.

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
- Introduce a new pattern or structural change without updating the relevant spec in `docs/` — ask if `AGENTS.md` also needs updating.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
