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

## Phase 1 — PartyKit server

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
- [ ] Room creation `POST /parties/main/<id>` with `X-Action: create` returns `200 { id, name }`
- [ ] WebSocket `join` → `init` round-trip works via `npx partykit dev`

---

## Phase 2 — Component catalog

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

## Phase 3 — Landing page

- [ ] **Phase complete**

### Files

- [ ] `src/app/page.tsx` — rewrite (Create a Room form, nanoid ID, POST to PartyKit, sessionStorage, redirect)

### Verification

- [ ] Form creates a room and redirects to `/r/<id>`
- [ ] `pnpm typecheck` clean

---

## Phase 4 — Room page

- [ ] **Phase complete**

### Files

- [ ] `src/app/r/[id]/page.tsx` — create (Server Component: fetch room name, redirect if not found)
- [ ] `src/app/r/[id]/room-client.tsx` — create (`'use client'`: sessionStorage check, displayName prompt, PartySocket, message rendering)

### Tests

- [ ] `e2e/chat.spec.ts` — full happy-path Playwright flow
- [ ] `playwright.config.ts` — add Next.js + PartyKit `webServer` entries

### Verification

- [ ] `pnpm e2e` green (full happy path passes)
