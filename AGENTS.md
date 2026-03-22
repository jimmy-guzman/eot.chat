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

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
