# salita.chat

An ephemeral chat room where messages are alive. Not text bubbles — rich, AI-generated components shaped by what you share. Paste a GitHub link, get a repo card. Drop a CSV, get a table. Ask a question, get a poll. The room reads what you share and renders it. When everyone leaves, it dissolves.

## The core loop

1. Create a room, get a shareable link
2. Participants join, no account needed
3. Send anything — a URL, a question, a code snippet, raw text
4. AI classifies the input and generates the right component
5. Partykit broadcasts the rendered message to everyone instantly
6. Room dissolves when it's empty

## What makes it distinct

- Messages are components, not strings — the AI decides how to render what you share
- AI is constrained — it can only use components in your catalog, no hallucinated UI
- Ephemeral by design — no accounts, no history, no persistence
- The room is alive but you're the ghost passing through

## Stack serving the concept

- **Partykit** — room state and real-time broadcast
- **json-render** — constrained component catalog, AI output is always predictable
- **OpenRouter** — classifies input, picks the right component, cheap and fast
- **Effect-TS** — typed pipelines for message classification and room operations
- **PandaCSS + Base UI** — catalog components, zero style opinions
- **Next.js + Vercel** — shell and hosting

Small room. Temporary. Shaped by what you bring into it.
