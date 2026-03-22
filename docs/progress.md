# Implementation Progress — Salita.chat

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
