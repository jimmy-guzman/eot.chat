# eot.chat

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

## Example messages

Each message below triggers a different component.

**Text**

```
hey, anyone around?
```

**Link preview**

```
https://vercel.com/blog/ai-sdk-4-2
```

**Repo card**

```
https://github.com/vercel/next.js
```

**Code block**

```
const greet = (name: string) => `Hello, ${name}!`
```

**Table**

```
Name, Role, Location
Alice, Engineer, NYC
Bob, Designer, SF
Carol, PM, London
```

**Poll**

```
Should we ship this week or wait for the redesign? Yes / No / Wait
```

**Image**

```
https://images.unsplash.com/photo-1506905925346-21bda4d32df4
```

**Bar chart**

```
Q1: 120, Q2: 145, Q3: 98, Q4: 172 — quarterly revenue
```

**Line chart**

```
Jan: 5k, Feb: 7k, Mar: 6.5k, Apr: 9k, May: 11k — monthly signups
```

**Metric**

```
MRR is $42,000, up 18% month over month
```

**Callout**

```
Warning: the API key expires on Friday — rotate it before deploying
```

**Timeline**

```
1. Discovery — completed
2. Design — completed
3. Build — in progress
4. Launch — upcoming
```

**Stack (composed)**

```
Here's our Q3 snapshot: revenue hit $420k (up 12%), signups grew from 8k to 11k over the quarter, and we're on track for launch in October.
```

Small room. Temporary. Shaped by what you bring into it.
