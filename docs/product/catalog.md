# Component Catalog — Salita.chat

The component catalog is the constraint the AI operates within. When a message arrives at PartyKit, the AI receives this catalog as its system prompt context and must return a spec tree referencing components defined here. Any unknown component type causes the classification to be rejected and the message falls back to `TextMessage`.

The catalog is implemented using `@json-render/core` + `@json-render/react`. The source of truth is `src/catalog/index.ts`.

---

## Classification Format

The AI returns a spec tree JSON object. Single-component messages use a trivial tree with one element:

```typescript
interface SpecTree {
  elements: Record<string, { type: string; props: Record<string, unknown> }>;
  root: string; // key into elements that is the top-level node
}
```

**Single component example:**

```json
{
  "elements": {
    "root": {
      "type": "TextMessage",
      "props": { "body": "Short all the energy stocks." }
    }
  },
  "root": "root"
}
```

**Composed tree example** (Stack containing two Metrics):

```json
{
  "elements": {
    "root": {
      "type": "Stack",
      "props": { "direction": "vertical", "children": ["revenue", "margin"] }
    },
    "revenue": {
      "type": "Metric",
      "props": { "label": "Revenue", "value": "$4.2M", "trend": "up" }
    },
    "margin": {
      "type": "Metric",
      "props": { "label": "Margin", "value": "38%", "trend": "neutral" }
    }
  },
  "root": "root"
}
```

This spec tree is stored on the `Message` object as `component` and rendered directly by `@json-render/react`'s `<Renderer>`.

---

## Components

### `TextMessage`

Plain chat message. The default fallback for any input that does not match a more specific type.

**Props:**

| Prop   | Type     | Required | Description      |
| ------ | -------- | -------- | ---------------- |
| `body` | `string` | Yes      | The message text |

**Example:**

```json
{ "type": "TextMessage", "props": { "body": "Short all the energy stocks." } }
```

---

### `LinkPreview`

A URL unfurled into a title + description + domain card. Used when the message body is (or contains) a URL that is not a GitHub repo.

**Props:**

| Prop          | Type     | Required | Description                           |
| ------------- | -------- | -------- | ------------------------------------- |
| `url`         | `string` | Yes      | The URL being previewed               |
| `title`       | `string` | Yes      | Page title or AI-inferred title       |
| `description` | `string` | No       | Short description or meta description |
| `domain`      | `string` | Yes      | Hostname only, e.g. `"vercel.com"`    |

**Example:**

```json
{
  "type": "LinkPreview",
  "props": {
    "url": "https://vercel.com/blog/turbopack-is-now-the-default",
    "title": "Turbopack is now the default",
    "description": "Starting today, turbopack is the default bundler for Next.js dev.",
    "domain": "vercel.com"
  }
}
```

---

### `RepoCard`

A GitHub repository card. Used when the message contains a `github.com/<owner>/<repo>` URL.

**Props:**

| Prop          | Type     | Required | Description                            |
| ------------- | -------- | -------- | -------------------------------------- |
| `url`         | `string` | Yes      | Full GitHub repo URL                   |
| `owner`       | `string` | Yes      | GitHub username or org                 |
| `repo`        | `string` | Yes      | Repository name                        |
| `description` | `string` | No       | Repo description                       |
| `language`    | `string` | No       | Primary language, e.g. `"TypeScript"`  |
| `stars`       | `number` | No       | Star count (may be omitted if unknown) |

**Example:**

```json
{
  "type": "RepoCard",
  "props": {
    "url": "https://github.com/vercel/next.js",
    "owner": "vercel",
    "repo": "next.js",
    "description": "The React Framework",
    "language": "TypeScript",
    "stars": 120000
  }
}
```

---

### `CodeBlock`

Syntax-highlighted code. Used when the message body is or contains a fenced code block, or when the AI detects a code snippet.

**Props:**

| Prop       | Type     | Required | Description                                        |
| ---------- | -------- | -------- | -------------------------------------------------- |
| `code`     | `string` | Yes      | The raw code content                               |
| `language` | `string` | No       | Language hint for syntax highlighting, e.g. `"ts"` |
| `filename` | `string` | No       | Optional filename label displayed above the block  |

**Example:**

```json
{
  "type": "CodeBlock",
  "props": {
    "code": "const x = 42;",
    "language": "ts",
    "filename": "example.ts"
  }
}
```

---

### `Table`

A data table. Used when the message body contains CSV-like or tabular data.

**Props:**

| Prop      | Type         | Required | Description                                     |
| --------- | ------------ | -------- | ----------------------------------------------- |
| `headers` | `string[]`   | Yes      | Column header labels                            |
| `rows`    | `string[][]` | Yes      | Row data — each row is an array of cell strings |
| `caption` | `string`     | No       | Optional caption displayed below the table      |

**Example:**

```json
{
  "type": "Table",
  "props": {
    "headers": ["Name", "Role", "Status"],
    "rows": [
      ["Alice", "Engineer", "Active"],
      ["Bob", "Designer", "On leave"]
    ],
    "caption": "Team roster"
  }
}
```

---

### `Poll`

An interactive poll. Used when the message body is a question with clear answer options, or when the AI infers a voting scenario. Vote state is local per-client — selections are not broadcast.

**Props:**

| Prop       | Type       | Required | Description                |
| ---------- | ---------- | -------- | -------------------------- |
| `question` | `string`   | Yes      | The poll question          |
| `options`  | `string[]` | Yes      | Answer choices (2–6 items) |

**Example:**

```json
{
  "type": "Poll",
  "props": {
    "question": "When should we ship?",
    "options": ["This week", "Next week", "After more testing"]
  }
}
```

---

### `ImageCard`

An image with an optional caption. Used when the message body is an image URL (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`).

**Props:**

| Prop      | Type     | Required | Description                   |
| --------- | -------- | -------- | ----------------------------- |
| `url`     | `string` | Yes      | The image URL                 |
| `alt`     | `string` | No       | Alt text                      |
| `caption` | `string` | No       | Caption displayed below image |

**Example:**

```json
{
  "type": "ImageCard",
  "props": {
    "url": "https://example.com/chart.png",
    "alt": "Q3 revenue chart",
    "caption": "Q3 revenue is up 12% YoY"
  }
}
```

---

### `Metric`

A single KPI display: a prominent value, a label, optional detail text, and an optional trend indicator. Use inside a `Stack` to show multiple KPIs side-by-side.

**Props:**

| Prop     | Type                          | Required | Description                                             |
| -------- | ----------------------------- | -------- | ------------------------------------------------------- |
| `label`  | `string`                      | Yes      | Short label, e.g. `"Revenue"`, `"DAU"`                  |
| `value`  | `string`                      | Yes      | Displayed value, e.g. `"$4.2M"`, `"12,450"`, `"38%"`    |
| `detail` | `string`                      | No       | Secondary detail line, e.g. `"vs $3.8M last quarter"`   |
| `trend`  | `"up" \| "down" \| "neutral"` | No       | Trend direction — `up` renders in cobalt, `down` in red |

**Example:**

```json
{
  "type": "Metric",
  "props": {
    "label": "Revenue",
    "value": "$4.2M",
    "detail": "vs $3.8M last quarter",
    "trend": "up"
  }
}
```

---

### `BarChart`

A bar chart for comparing categorical values. Uses recharts internally with Panda design tokens.

**Props:**

| Prop    | Type                                 | Required | Description                                     |
| ------- | ------------------------------------ | -------- | ----------------------------------------------- |
| `data`  | `{ label: string; value: number }[]` | Yes      | Array of data points                            |
| `title` | `string`                             | No       | Chart title displayed above                     |
| `color` | `string`                             | No       | Bar fill color token, e.g. `"cobalt"` (default) |

**Example:**

```json
{
  "type": "BarChart",
  "props": {
    "title": "Monthly signups",
    "data": [
      { "label": "Jan", "value": 120 },
      { "label": "Feb", "value": 185 },
      { "label": "Mar", "value": 240 }
    ]
  }
}
```

---

### `LineChart`

A line chart for showing trends over time. Uses recharts internally with Panda design tokens.

**Props:**

| Prop    | Type                                 | Required | Description                                        |
| ------- | ------------------------------------ | -------- | -------------------------------------------------- |
| `data`  | `{ label: string; value: number }[]` | Yes      | Array of data points in order                      |
| `title` | `string`                             | No       | Chart title displayed above                        |
| `color` | `string`                             | No       | Line stroke color token, e.g. `"cobalt"` (default) |

**Example:**

```json
{
  "type": "LineChart",
  "props": {
    "title": "Daily active users",
    "data": [
      { "label": "Mon", "value": 800 },
      { "label": "Tue", "value": 950 },
      { "label": "Wed", "value": 1100 }
    ]
  }
}
```

---

### `Callout`

A highlighted block for surfacing important information. Background color is determined by `type`.

**Props:**

| Prop      | Type                           | Required | Description                                                          |
| --------- | ------------------------------ | -------- | -------------------------------------------------------------------- |
| `type`    | `"info" \| "tip" \| "warning"` | Yes      | Visual style: `info` → powder-blue; `tip` → mint; `warning` → yellow |
| `title`   | `string`                       | No       | Optional bold heading                                                |
| `content` | `string`                       | Yes      | Body text                                                            |

**Example:**

```json
{
  "type": "Callout",
  "props": {
    "type": "warning",
    "title": "Breaking change",
    "content": "The v2 API removes the /legacy endpoint. Migrate before Friday."
  }
}
```

---

### `Timeline`

A vertical list of events or steps with status indicators.

**Props:**

| Prop    | Type                                                                                                        | Required | Description           |
| ------- | ----------------------------------------------------------------------------------------------------------- | -------- | --------------------- |
| `items` | `{ title: string; description?: string; date?: string; status?: "completed" \| "current" \| "upcoming" }[]` | Yes      | Ordered list of steps |

Status dot colors: `completed` → chartreuse; `current` → cobalt; `upcoming` → soft-pink (default when omitted).

**Example:**

```json
{
  "type": "Timeline",
  "props": {
    "items": [
      { "title": "Design review", "date": "Mar 10", "status": "completed" },
      { "title": "Implementation", "date": "Mar 17", "status": "current" },
      { "title": "Launch", "date": "Mar 24", "status": "upcoming" }
    ]
  }
}
```

---

### `Stack`

A flex layout container. Allows the AI to compose multiple components into a single message. Children are referenced by their element keys in the spec tree.

**Props:**

| Prop        | Type                         | Required | Description                                                       |
| ----------- | ---------------------------- | -------- | ----------------------------------------------------------------- |
| `children`  | `string[]`                   | Yes      | Ordered list of element keys from the spec tree                   |
| `direction` | `"vertical" \| "horizontal"` | No       | Flex direction (default `"vertical"`)                             |
| `gap`       | `number`                     | No       | Gap between children in design system spacing units (default `4`) |

**Example:** See the composed tree example in the Classification Format section above.

---

## AI Classification Rules

When classifying a message, the AI must:

1. Return a valid spec tree in `{ elements, root }` format
2. Only use component types defined in this catalog — no invented types
3. Default to `TextMessage` if no other type clearly fits
4. Apply the most specific type that fits — e.g. a GitHub URL is `RepoCard`, not `LinkPreview`
5. Populate all required props — omit optional props if the information is not available
6. Not invent prop values — only use information present in the message body
7. Use `Stack` to compose multiple components when the message contains naturally separable pieces of information (e.g. a set of KPIs, a chart plus a summary)

### Classification Priority

When multiple types could match, use this priority order (highest first):

1. `ImageCard` — message is an image URL
2. `RepoCard` — message contains a `github.com/<owner>/<repo>` URL
3. `CodeBlock` — message contains a fenced code block or clear code snippet
4. `Table` — message contains tabular / CSV data
5. `BarChart` / `LineChart` — message contains numerical series data suitable for a chart
6. `Poll` — message is a question with answer options
7. `Timeline` — message describes a sequence of events or steps
8. `Metric` (via `Stack`) — message describes one or more KPI values
9. `Callout` — message is a warning, tip, or informational note
10. `LinkPreview` — message contains any other URL
11. `TextMessage` — everything else
