# Component Catalog — Salita.chat

The component catalog is the constraint the AI operates within. When a message arrives at PartyKit, the AI receives this catalog as its system prompt context and must return a single `{ type, props }` object referencing a component defined here. Any unknown component type causes the classification to be rejected and the message falls back to `TextMessage`.

The catalog is implemented using `@json-render/core` + `@json-render/react`. The source of truth is `src/catalog/index.ts`.

---

## Classification Format

The AI returns a single JSON object — no spec tree, no children:

```typescript
interface Classification {
  type: string; // must be a key in this catalog
  props: Record<string, unknown>; // must match the component's props schema
}
```

This is stored on the `Message` object as `component: { type, props }` and rendered directly.

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
{
  "type": "TextMessage",
  "props": {
    "body": "Short all the energy stocks."
  }
}
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

An interactive poll. Used when the message body is a question with clear answer options, or when the AI infers a voting scenario.

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

## AI Classification Rules

When classifying a message, the AI must:

1. Return exactly one `{ type, props }` object — no spec trees, no children
2. Only use component types defined in this catalog — no invented types
3. Default to `TextMessage` if no other type clearly fits
4. Apply the most specific type that fits — e.g. a GitHub URL is `RepoCard`, not `LinkPreview`
5. Populate all required props — omit optional props if the information is not available
6. Not invent prop values — only use information present in the message body

### Classification Priority

When multiple types could match, use this priority order (highest first):

1. `ImageCard` — message is an image URL
2. `RepoCard` — message contains a `github.com/<owner>/<repo>` URL
3. `CodeBlock` — message contains a fenced code block or clear code snippet
4. `Table` — message contains tabular / CSV data
5. `Poll` — message is a question with answer options
6. `LinkPreview` — message contains any other URL
7. `TextMessage` — everything else
