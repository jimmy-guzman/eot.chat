# Decisions — eot.chat

Key architectural and product decisions made during development, in chronological order. The "why" that isn't obvious from the code.

---

## `src/lib/` vs `src/server/` boundary + `@party/*` alias

**What changed:** `partykit-client.ts` was moved from `src/lib/` to `src/server/`. A `@party/*` TypeScript path alias was introduced, replacing all relative `../../../../../party/types` imports across the `party/` ↔ `src/` boundary. Form UI components were co-located under `src/components/form/`.

**Why:** `src/lib/` was being used as a catch-all, but `partykit-client.ts` uses `@effect/platform`, server-only env vars (`PARTYKIT_URL`), and Node APIs — none of which are safe to import from a client component. Formalising `src/server/` as a server-only zone makes the boundary enforced by convention and visible in import paths. The `@party/*` alias removes fragile relative paths that break on directory moves and makes the cross-boundary intent explicit.

**Rule:** `src/lib/` is client-safe and importable from anywhere. `src/server/` may use server env vars, Effect HTTP, and Node APIs — never imported by `"use client"` files.

---

## XState for WebSocket room state

**What changed:** The WebSocket connection lifecycle, participant tracking, message history, and typing indicator state — originally managed as ad-hoc `useState`/`useEffect` in `room-client.tsx` — were extracted into an XState v5 machine (`room-machine.ts`) with a `PartySocket` actor. `room-client.tsx` became a thin orchestrator.

**Why:** The room client had grown to a tangle of interdependent `useEffect` hooks and `useRef` guards to manage connection sequencing, reconnect, and per-name timers. This class of problem — multiple actors, ordered state transitions, timers that must cancel on superseding events — is exactly what a state machine is for. XState v5's actor model maps directly: the WebSocket is an actor whose events drive transitions; typing expiry timers are spawned and cancelled as named actors.

**What was discarded:** Manual `useRef` guards, `useEffect` cleanup chains, and the inline `displayName` prompt state that had been embedded in `room-client.tsx`.

---

## Effect HTTP client for PartyKit with retry and error boundary

**What changed:** Inline `fetch` calls inside Server Actions were replaced with a dedicated `src/server/partykit-client.ts` using `@effect/platform`'s `HttpClient`. Retry logic and a typed error channel were added. A Next.js `error.tsx` route boundary was introduced at `/r/[id]/` to catch runtime failures gracefully.

**Why:** Server Actions calling raw `fetch` gave no typed error handling — a non-200 from PartyKit would either throw an untyped exception or silently return bad data. `@effect/platform`'s `HttpClient` makes the error channel explicit in the type signature, retry is declarative, and the Effect pipeline composes cleanly with the existing server-side Effect usage. The `error.tsx` boundary ensures that PartyKit being unavailable shows a recoverable error page rather than an unhandled crash.

---

## Cosmos v2 — narrowed reference set, single accent

**What changed:** The initial visual identity used 10 reference images (5 light, 5 dark) organised in subdirectories and two accent colors (amber + green). The second pass reduced to 5 images (all Soviet/Minitel hardware terminals), removed the light/dark split, deleted subdirectory organisation, and replaced the dual accent with a single orange-red (`#D44E1A`). Glow shadow tokens were added.

**Why:** Two accents created ambiguity about when to use each — the UI had no natural rule for choosing between amber and green. A single accent is unambiguous. The reference image reduction was a curation decision: the 5 remaining images are the most tonally consistent and directly drove the final palette. The light-mode variants were dropped when the product moved to dark-only.

---

## Participant re-keying on reconnect

**What changed:** PartyKit assigns a new connection ID on every reconnect (network drop, tab restore, etc.). The original implementation keyed the in-memory `participants` map by connection ID. A reconnect would add a new entry without removing the old one, leaving a ghost duplicate in the participant list. The fix re-keys by `displayName`: on connect, if an existing participant with that name is found under a different connection ID, the old entry is removed before inserting the new one.

**Why:** The room has no auth — `displayName` is the only stable identity across connections. Keying by connection ID was correct for the simple case but broke on reconnect. Keying by `displayName` matches the user model: you are your name, regardless of which WebSocket you're currently on.

**Trade-off:** If two connections genuinely share a display name (race condition on join), the second join evicts the first. This is acceptable given that display names are checked for uniqueness on join and the room is ephemeral.

---

## `cleared` broadcast attributed to sender, sent to all connections

**What changed:** The original `cleared` ServerMessage had no `displayName` field and was broadcast to all connections _except_ the sender. Two bugs emerged: (1) the sender's own UI wasn't clearing, and (2) there was no way for the StatusBar to show "X left and chat cleared" — the attribution was missing. The fix adds `displayName: string` to `cleared` and includes the sender in the broadcast.

**Why:** Excluding the sender from broadcasts is a common pattern for `typing` (where you don't want to see your own indicator) but wrong for `cleared` — the sender's UI needs to update too. Attribution was needed to power the StatusBar notification ("Alice left, chat cleared") which replaced silent chat clearing.

---

## StatusBar replacing TypingIndicator

**What changed:** The initial typing indicator was a dedicated `TypingIndicator` component. It was replaced by a generic `StatusBar` that accepts a `StatusNotification` prop — a discriminated union covering `typing`, `joined`, `left`, and `cleared` events. All transient room notifications route through this single slot.

**Why:** With clearing now attributed and join/leave events needing a notification surface, multiple competing notification areas would have appeared. A single `StatusBar` with a shared notification slot gives one predictable place for transient room events and keeps the UI from feeling cluttered. The Server Component boundary is also cleaner: `StatusBar` receives a typed prop and renders deterministically, making it straightforward to test in isolation.

---

## Visual identity: IBM Plex Mono + retro-computing palette

**What changed:** Replaced M PLUS Rounded 1c (the originally planned font) with IBM Plex Mono. Replaced the initial light-mode token scale with a dark-only semantic token system derived from vintage computing hardware (Soviet military terminals, Minitel hardware).

**Why:** The rounded sans-serif font and light-mode palette were generic. The retro-computing direction gave the product a distinctive, coherent identity — a terminal aesthetic that matches the ephemeral, no-accounts nature of the product. Dark-only removes the complexity of maintaining two themes with no corresponding benefit.

**What was discarded:** `PlantMotif` and `CatMotif` inline SVG illustrations (added in Phase 7, removed during this refactor). The motifs added visual noise and clashed with the terminal aesthetic.

**Token approach:** Adopted DaisyUI-style semantic token naming (`base-100/200/300/content`, `primary/primary-content`, etc.) over descriptive names like `powder-blue` or `chartreuse`. Semantic names survive palette changes — descriptive names don't.

---

## Strip AI classification and rich component catalog

**What changed:** Removed the entire AI classification pipeline (`party/classify.ts`, `party/token-bucket.ts`), the component catalog (`src/catalog/`), all rich message components (RepoCard, CodeBlock, Poll, LinkPreview, etc.), and their dependencies (`@json-render/core`, `@json-render/react`, `@openrouter/sdk`, `zod`, `recharts`). Messages are now rendered as plain text.

**Why:** The generative UI feature (AI classifying messages and rendering them as rich components) added significant complexity — an external AI API dependency, rate limiting, a spec tree wire format, a component registry, and recharts SVG mocking in tests — without meaningfully improving the core product. The product is about ephemeral real-time conversation; plain text serves that better than AI-inferred UI components. Removing it also eliminated the `OPENROUTER_API_KEY` requirement, making local dev and testing simpler.

**What was discarded:** The spec tree wire format (`{ elements, root }`), the `component` field on `Message`, the `@json-render` rendering layer, `zod` (replaced with `valibot` in the subsequent refactor).

---

## Cookie-based displayName over sessionStorage

**What changed:** Replaced browser `sessionStorage` for storing the user's display name with an HttpOnly cookie (`display-name-{id}`) set by Server Actions. Introduced `next-safe-action` + `valibot` for type-safe server action validation and `TanStack Form` for form state management. Split the display name prompt into its own route (`/r/[id]/join/`).

**Why:** `sessionStorage` is inaccessible to Server Components — the room page had to render client-side first, check storage, then decide whether to show the name prompt. This caused a flash of the prompt even for returning users. Moving the display name to a cookie lets the Server Component read it at render time and pass it as a prop, eliminating the flash and making the auth gate a clean server-side check.

HttpOnly cookies also prevent client-side JS from reading or tampering with the display name, which is appropriate for this kind of ephemeral identity.

`next-safe-action` was chosen over raw Server Actions for consistent input validation (via valibot schemas) and type-safe return values without boilerplate. `TanStack Form` was chosen over uncontrolled forms or `react-hook-form` for its fine-grained subscription model (no unnecessary re-renders) and first-class async submit handling.

---

## Typing indicator with throttled outbound events

**What changed:** Added `{ type: "typing" }` to the wire protocol (both `ClientMessage` and `ServerMessage`). The client throttles outbound typing events to once per second (`@tanstack/pacer`). The server broadcasts the sender's `displayName` to all other connections. Each recipient auto-clears the indicator after 3 seconds of silence per name.

**Why:** Typing indicators are a standard chat UX affordance. The throttle prevents a typing event per keystroke saturating the WebSocket. The 3-second server-side auto-expiry (tracked in XState context as `typingNames[]` with per-name timers) means no explicit "stopped typing" message is needed — simplifying the protocol.

**Implementation note:** The typing indicator is ephemeral — it is not part of the `Message` data model and is never persisted or replayed on join.

---

## Room expiry via Durable Object alarm instead of eager dissolution

**What changed:** Previously, a room was permanently deleted (`room.storage.delete("name")`) the moment the last participant left or disconnected. The room link immediately became a 404. Now, when the last participant leaves, the server schedules a 1-hour Durable Object alarm (`room.storage.setAlarm`). If no one reconnects before the alarm fires, `onAlarm` calls `room.storage.deleteAll()` and the room is gone. If someone reconnects before the hour is up, `onConnect` cancels the alarm with `room.storage.deleteAlarm()`.

Messages are still cleared on every leave (class assignment constraint). The expiry window applies to the room's existence, not to message retention.

**Why:** The original eager dissolution meant a briefly-disconnected participant (network drop, accidental tab close) would return to a dead 404 link. The 1-hour grace period covers realistic reconnect scenarios without keeping abandoned rooms around indefinitely. Durable Object alarms are the idiomatic mechanism for this on Cloudflare/PartyKit — no external scheduler, no cron, no polling.

**Last participant UX:** The exit dialog description adapts when `participants.length === 1`, informing the user that the room will be deleted in 1 hour if no one rejoins. No additional actions are presented — the 1-hour window is the only path.

**Abrupt disconnects:** `onClose` (tab close, network drop) follows the same alarm path as a graceful leave — the room is never deleted synchronously on disconnect. This is safe because the in-memory participant map is cleared normally; if the worker hibernates and wakes on alarm, `onAlarm` has no participant state to clean up and simply wipes storage.

**Trade-off:** A room with no active connections still occupies a Durable Object slot for up to 1 hour. This is acceptable given the low volume of rooms and the zero-infrastructure cost of storage alarms.
