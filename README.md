# eot.chat

An ephemeral real-time chat room. No accounts, no history. When everyone leaves, the room dissolves.

## The core loop

1. Create a room, get a shareable link
2. Share the link — anyone with it can join
3. Send plain text messages, visible to everyone in the room instantly
4. When any participant leaves, the chat clears
5. When the last participant leaves, the room dissolves

## What makes it distinct

- No accounts — identity is a display name chosen at entry
- Ephemeral by design — no database, no persistence, no logs
- The room ID is the only access control — share the link only with intended participants
- Messages clear automatically when anyone leaves

## Stack

- **PartyKit** — room state and real-time broadcast
- **Effect-TS** — typed pipelines for room operations
- **PandaCSS** — design tokens and recipes
- **next-safe-action + valibot** — type-safe Server Actions
- **TanStack Form** — form state management
- **Next.js + Vercel** — shell and hosting

## Running locally

```bash
pnpm dev
```

Starts the Next.js app and the PartyKit server concurrently.
