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

- [ ] **Phase complete**

### Files

- [ ] `src/components/illustrations.tsx` — create (`PlantMotif` + `CatMotif` inline SVGs)
- [ ] `src/app/page.tsx` — add `PlantMotif`, heading and tagline typography treatment
- [ ] `src/app/r/[id]/_components/display-name-form.tsx` — add `CatMotif`, heading treatment
- [ ] `src/app/r/[id]/_components/room-client.tsx` — fix bubble alignment inversion; update room name header; update empty state; add `backgroundColor: "surface"` to `CodeBlock` `<pre>`
- [ ] `src/components/link-preview.tsx` — add `lineHeight: "body"` to description `<p>`
- [ ] `src/components/repo-card.tsx` — add `lineHeight: "body"` to description `<p>`
- [ ] `src/components/code-block.tsx` — add `backgroundColor: "surface"` to `<pre>`

### Verification

- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test --run` green
- [ ] `pnpm build` succeeds

---

## Phase 8 — Generative UI expansion

- [ ] **Phase complete**

### Dependencies

- [ ] `pnpm add recharts`

### Files

- [ ] `party/types.ts` — migrate `ComponentSchema` to spec tree format `{ elements, root }`
- [ ] `party/classify.ts` — update `ClassificationSchema` and system prompt for spec tree output + 6 new components
- [ ] `src/catalog/schema.ts` — add Zod schemas for `Stack`, `Metric`, `BarChart`, `LineChart`, `Callout`, `Timeline`
- [ ] `src/catalog/index.ts` — register 6 new components
- [ ] `src/catalog/registry.tsx` — wire 6 new components to React implementations
- [ ] `src/components/bar-chart.tsx` — create (recharts `BarChart` with Panda tokens)
- [ ] `src/components/line-chart.tsx` — create (recharts `LineChart` with Panda tokens)
- [ ] `src/components/metric.tsx` — create (KPI metric with trend indicator)
- [ ] `src/components/callout.tsx` — create (info/tip/warning callout block)
- [ ] `src/components/timeline.tsx` — create (vertical timeline with status dots)
- [ ] `src/components/stack.tsx` — create (flex layout container for composed specs)
- [ ] `src/components/index.ts` — update barrel export (add 6 new components)
- [ ] `src/app/r/[id]/_components/room-client.tsx` — remove `makeSpec()` wrapper; pass `msg.component` spec tree directly to `<Renderer>`

### Tests

- [ ] `src/components/bar-chart.spec.tsx`
- [ ] `src/components/line-chart.spec.tsx`
- [ ] `src/components/metric.spec.tsx`
- [ ] `src/components/callout.spec.tsx`
- [ ] `src/components/timeline.spec.tsx`
- [ ] `src/components/stack.spec.tsx`

### Verification

- [ ] `pnpm typecheck` clean
- [ ] `pnpm lint` clean
- [ ] `pnpm test --run` green
- [ ] `pnpm build` succeeds
