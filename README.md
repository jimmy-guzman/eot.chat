# Salita.chat

A ephemeral chat room where the layout is a living thing. You create a room, share a link, people join — but instead of a static chat interface, the room's UI is prompt-driven. Type "make this a standup board" and the room morphs for everyone simultaneously. The AI — constrained to a component catalog — reshapes the layout in real time. When everyone leaves, the room dissolves.

## The core loop

1. Create a room, get a shareable link
2. Participants join, default layout is a simple chat
3. Anyone can prompt the room to reshape itself
4. AI generates a new json-render tree, Partykit broadcasts it
5. Everyone sees the new layout instantly
6. Room is gone when it's empty

## What makes it distinct

- The UI itself is the collaborative surface, not just the content
- AI is constrained — it can only use components you've defined, no hallucinated UI
- Ephemeral by design — no accounts, no history, no persistence
- The room is alive but you're the ghost passing through

## Stack serving the concept

- Partykit — the room's heartbeat
- json-render — the constrained UI grammar
- Effect-TS — typed pipelines for every room operation
- OpenRouter — model flexibility for layout generation
- PandaCSS + Base UI — catalog components with no style opinions
- Next.js + Vercel — shell and hosting

Small room. Temporary. Shaped by whoever's in it.
