# Implementation Progress — eot.chat

Tracks completion of each phase in `docs/plan.md`. Check off tasks as they are done.

---

## Phase 0 — Foundation

- [x] **Phase complete**

### Files

- [x] `panda.config.ts` — add color, spacing, radius, shadow tokens + M PLUS Rounded 1c font variable
- [x] `src/app/layout.tsx` — replace Geist with M PLUS Rounded 1c, update metadata

### Dependencies

- [x] `pnpm add nanoid`

### Verification

- [x] `pnpm build` succeeds
- [x] `pnpm typecheck` clean
- [x] M PLUS Rounded 1c renders in the browser

---

## Phase 1 — Design system

- [x] **Phase complete**

### Files

- [x] `panda.config.ts` — add `surface` color token
- [x] `panda.config.ts` — add `tokens.fontSizes` (xs, sm, base, lg, xl, 2xl)
- [x] `panda.config.ts` — add `tokens.fontWeights` (regular, bold, extrabold)
- [x] `panda.config.ts` — add `tokens.lineHeights` (body, code, tight)
- [x] `panda.config.ts` — add `tokens.letterSpacings` (display, tight)
- [x] `panda.config.ts` — add `tokens.sizes` (card, bubble)
- [x] `panda.config.ts` — add `theme.recipes.button` (primary/secondary/ghost/danger, sm/md)
- [x] `panda.config.ts` — add `theme.recipes.input`
- [x] `panda.config.ts` — add `theme.recipes.card` (default/flat)
- [x] `panda.config.ts` — add `theme.recipes.badge` (default/active)

### Verification

- [x] `pnpm build` succeeds
- [x] `pnpm typecheck` clean
- [x] Panda `styled-system/` output contains recipe classes

---

## Phase 2 — PartyKit server

- [x] **Phase complete**

### Files

- [x] `party/types.ts` — create (Effect Schema definitions for `ClientMessage`, `ServerMessage`, `Participant`, `Message`)
- [x] `party/token-bucket.ts` — create (plain `TokenBucket` class, workerd-safe)
- [x] `party/index.ts` — rewrite (`onRequest`, `onConnect`, `onMessage`, `onClose` handlers)
- [x] `party/classify.ts` — create (Effect pipeline → OpenRouter → fallback to `TextMessage`)

### Tests

- [x] `party/classify.spec.ts`
- [x] `party/index.spec.ts`
- [x] `party/types.spec.ts`
- [x] `party/token-bucket.spec.ts`

### Verification

- [x] `pnpm test --run` green
- [x] Room creation `POST /parties/main/<id>` with `X-Action: create` returns `200 { id, name }`
- [x] WebSocket `join` → `init` round-trip works via `npx partykit dev`

---

## Phase 3 — Component catalog

- [x] **Phase complete**

### Files

- [x] `src/catalog/schema.ts` — create (Zod prop schemas + AI system prompt string, workerd-safe)
- [x] `src/catalog/index.ts` — create (`defineCatalog` with 7 components)
- [x] `src/catalog/registry.tsx` — create (`defineRegistry` wiring catalog to React implementations)
- [x] `src/components/text-message.tsx`
- [x] `src/components/link-preview.tsx`
- [x] `src/components/repo-card.tsx`
- [x] `src/components/code-block.tsx`
- [x] `src/components/table.tsx`
- [x] `src/components/poll.tsx`
- [x] `src/components/image-card.tsx`
- [x] `src/components/index.ts` — barrel export
- [x] Components restyled with recipe primitives and named typography tokens
- [x] Accent colors applied: `chartreuse` (CodeBlock), `orange` (Poll), `sage` (Table), `yellow` (ImageCard)
- [x] All `"white"` surfaces replaced with `surface` token

### Tests

- [x] `src/catalog/schema.spec.ts`
- [x] `src/components/text-message.spec.tsx`
- [x] `src/components/link-preview.spec.tsx`
- [x] `src/components/repo-card.spec.tsx`
- [x] `src/components/code-block.spec.tsx`
- [x] `src/components/table.spec.tsx`
- [x] `src/components/poll.spec.tsx`
- [x] `src/components/image-card.spec.tsx`

### Verification

- [x] All component unit tests pass
- [x] `pnpm build` succeeds

---

## Phase 4 — Landing page

- [x] **Phase complete**

### Files

- [x] `src/app/page.tsx` — rewrite (Create a Room form, nanoid ID, POST to PartyKit, sessionStorage, redirect)
- [x] `src/app/_components/create-room-form.tsx` — restyled with `button` and `input` recipes

### Verification

- [x] Form creates a room and redirects to `/r/<id>`
- [x] `pnpm typecheck` clean

---

## Phase 5 — Room page

- [x] **Phase complete**

### Files

- [x] `src/app/r/[id]/page.tsx` — create (Server Component: fetch room name, redirect if not found)
- [x] `src/app/r/[id]/_components/room-client.tsx` — create (`'use client'`: `useSyncExternalStore` for sessionStorage, displayName prompt, PartySocket, message rendering)
- [x] `src/app/r/[id]/_components/display-name-form.tsx` — create (inline display name prompt)
- [x] `room-client.tsx` — restyled with `button`, `input`, `badge` recipes and named tokens
- [x] `display-name-form.tsx` — restyled with `button` and `input` recipes

### Tests

- [x] `e2e/chat.spec.ts` — full happy-path Playwright flow
- [x] `e2e/smoke.spec.ts` — home page title assertion
- [x] `playwright.config.ts` — Next.js + PartyKit `webServer` entries with `--port 1999`

### Verification

- [x] `pnpm e2e` green (full happy path passes)

---

## Phase 6 — Clear chat

- [x] **Phase complete**

### Files

- [x] `docs/product/functions.md` — add `Clear Chat` action, update Key Constraints
- [x] `docs/architecture.md` — add `clear`/`cleared` to protocol; update data flow for leave and clear; update Room Dissolution
- [x] `docs/plan.md` — update Phase 2 and Phase 5 descriptions
- [x] `docs/prompts/excalidraw.md` — add participant strip; add `Clear Chat` button to Screen 3 actions
- [x] `party/types.ts` — add `clear` to `ClientMessageSchema`, `cleared` to `ServerMessageSchema`
- [x] `party/index.ts` — handle `clear` message; clear + broadcast `cleared` on any leave
- [x] `src/app/r/[id]/_components/room-client.tsx` — handle `cleared`; add `Clear Chat` ghost button

### Tests

- [x] `party/index.spec.ts` — add tests for `clear` message and mid-session leave clearing

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green
- [x] `pnpm build` succeeds

---

## Phase 7 — Visual identity

- [x] **Phase complete**

### Files

- [x] `src/components/illustrations.tsx` — create (`PlantMotif` + `CatMotif` inline SVGs)
- [x] `src/app/page.tsx` — add `PlantMotif`, heading and tagline typography treatment
- [x] `src/app/r/[id]/_components/display-name-form.tsx` — add `CatMotif`, heading treatment
- [x] `src/app/r/[id]/_components/room-client.tsx` — fix bubble alignment inversion; update room name header; update empty state; add `backgroundColor: "surface"` to `CodeBlock` `<pre>`
- [x] `src/components/link-preview.tsx` — add `lineHeight: "body"` to description `<p>`
- [x] `src/components/repo-card.tsx` — add `lineHeight: "body"` to description `<p>`
- [x] `src/components/code-block.tsx` — add `backgroundColor: "surface"` to `<pre>`

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green
- [x] `pnpm build` succeeds

---

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green
- [x] `pnpm build` succeeds

---

## Refactor — Visual identity redefinition + semantic tokens

- [x] **Complete**

### Updated

- [x] `docs/product/visual.md` — full rewrite: retro-computing identity (vintage computing hardware), light/dark curation, IBM Plex Mono, DaisyUI-style semantic token system with token philosophy section
- [x] `panda.config.ts` — dark mode media condition; fully semantic token names (`base-100/200/300/content`, `primary/primary-content`, `secondary/secondary-content`, `accent/accent-content`, `error/error-content`); tightened radii; updated recipes to use only semantic names; no per-component `_dark` conditionals
- [x] `src/app/layout.tsx` — replaced M PLUS Rounded 1c with IBM Plex Mono, added `color-scheme` meta
- [x] `src/components/illustrations.tsx` — deleted (no motifs in new identity)
- [x] `src/app/page.tsx` — removed PlantMotif, all token references updated to semantic names
- [x] `src/app/r/[id]/_components/room-client.tsx` — removed PlantMotif, all token references updated to semantic names
- [x] `src/app/r/[id]/_components/display-name-form.tsx` — removed CatMotif, all token references updated to semantic names
- [x] `docs/reference/cosmos/` — added 10 reference images (5 light, 5 dark) driving the retro-computing palette

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green
- [x] `pnpm build` succeeds

---

## Refactor — Strip AI classification and rich component catalog

- [x] **Complete**

### Removed

- [x] `party/classify.ts` + `party/classify.spec.ts`
- [x] `party/token-bucket.ts` + `party/token-bucket.spec.ts`
- [x] `src/catalog/` (entire directory: `schema.ts`, `schema.spec.ts`, `index.ts`, `registry.tsx`)
- [x] `src/components/` — all rich message components and specs (bar-chart, callout, code-block, image-card, line-chart, link-preview, metric, poll, repo-card, stack, table, text-message, timeline) + their spec files
- [x] `src/components/index.ts` — barrel export

### Updated

- [x] `party/types.ts` — removed `ComponentSchema` and `component` field from `MessageSchema`
- [x] `party/index.ts` — removed AI classification, rate limiting, and token bucket logic
- [x] `party/index.spec.ts` — removed MSW mock, simplified message broadcast assertion
- [x] `party/types.spec.ts` — simplified `MessageSchema` test (no `component` field)
- [x] `src/app/r/[id]/_components/room-client.tsx` — removed `JSONUIProvider`/`Renderer`/registry; inline plain text `<p>` render
- [x] `e2e/chat.spec.ts` — removed Step 5 AI/RepoCard assertion
- [x] `package.json` — removed `@json-render/core`, `@json-render/react`, `@openrouter/sdk`, `@base-ui/react`, `zod`
- [x] `docs/architecture.md` — removed AI classification, rate limiting, OpenRouter sections; updated data model and data flow
- [x] `docs/product/functions.md` — updated overview and message area description; removed AI-specific constraints
- [x] `docs/product/catalog.md` — archived (preserved for history, no longer active)
- [x] `docs/plan.md` — added note that Phases 3 and 8 are superseded

---

## Refactor — Panda CSS recipes (label + card)

- [x] **Complete**

### Updated

- [x] `panda.config.ts` — added `label` recipe (base-only, no variants; `marginBottom` kept at callsite)
- [x] `panda.config.ts` — updated `card` recipe: `borderRadius: "lg"` (was `"md"`), `boxShadow: "lg"` on default variant (was `"sm"`)
- [x] `src/app/_components/create-room-form.tsx` — applied `label()` recipe; fixed invalid `"ink"` token → `"base-content"` on label color
- [x] `src/app/r/[id]/_components/display-name-form.tsx` — applied `label()` recipe
- [x] `src/app/page.tsx` — replaced inline card div with `card()` recipe
- [x] `src/app/r/[id]/_components/display-name-form.tsx` — replaced inline card div with `card()` recipe

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green
- [x] `pnpm build` succeeds

---

## Feature — Typing indicator

- [x] **Complete**

### Dependencies added

- [x] `@tanstack/pacer`
- [x] `@tanstack/react-pacer`

### Files

- [x] `party/types.ts` — added `{ type: "typing" }` to `ClientMessageSchema`; added `{ displayName, type: "typing" }` to `ServerMessageSchema`
- [x] `party/index.ts` — added `typing` handler: looks up sender's `displayName`, broadcasts to all except sender
- [x] `party/types.spec.ts` — added 2 decode tests for typing messages
- [x] `party/index.spec.ts` — added 2 tests: broadcasts to others; no-op if sender hasn't joined
- [x] `src/app/r/[id]/_components/room-client.tsx` — throttled outbound `typing` sends via `useThrottledCallback` (1s); per-name auto-clear timer (3s); clears indicator immediately on incoming `message`; renders `"<name> is typing..."` / `"<a>, <b> and <c> are typing..."` between participant strip and message area

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green (36/36)
- [x] `pnpm build` succeeds

---

## Refactor — TanStack Form + next-safe-action + cookie-based displayName

- [x] **Complete**

### Dependencies added

- [x] `next-safe-action`
- [x] `@tanstack/react-form`
- [x] `valibot`

### New files

- [x] `src/lib/safe-action.ts` — next-safe-action client instance
- [x] `src/lib/form.ts` — TanStack Form hook factory + `useFormContext` re-export
- [x] `src/components/text-field.tsx` — labeled text input (TanStack form-connected)
- [x] `src/components/submit-button.tsx` — submit button (reads `isSubmitting` from form store)
- [x] `src/app/_actions/create-room.ts` — Server Action: generate nanoid, POST to PartyKit, set `display-name-{id}` HttpOnly cookie, redirect
- [x] `src/app/_actions/join-room.ts` — Server Action: set `display-name-{id}` HttpOnly cookie

### Updated files

- [x] `src/app/_components/create-room-form.tsx` — migrated to TanStack Form + `createRoom` Server Action
- [x] `src/app/r/[id]/_components/display-name-form.tsx` — migrated to TanStack Form + `joinRoom` Server Action
- [x] `src/app/r/[id]/_components/room-client.tsx` — removed sessionStorage; accepts `displayName: string | null` prop; added `overrideDisplayName` state for within-session joins
- [x] `src/app/r/[id]/page.tsx` — reads `display-name-{id}` cookie server-side; passes `displayName` prop to `<RoomClient>`

### Verification

- [x] `pnpm typecheck` clean
- [x] `pnpm lint` clean
- [x] `pnpm test --run` green (32/32)
- [x] `pnpm build` succeeds
