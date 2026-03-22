import { z } from "zod";

export const componentNames = [
  "BarChart",
  "Callout",
  "CodeBlock",
  "ImageCard",
  "LineChart",
  "LinkPreview",
  "Metric",
  "Poll",
  "RepoCard",
  "Stack",
  "Table",
  "TextMessage",
  "Timeline",
] as const;

export type ComponentName = (typeof componentNames)[number];

export const schemas = {
  BarChart: z.object({
    color: z.string().optional(),
    data: z.array(z.object({ label: z.string(), value: z.number() })),
    title: z.string().optional(),
  }),
  Callout: z.object({
    content: z.string(),
    title: z.string().optional(),
    type: z.enum(["info", "tip", "warning"]),
  }),
  CodeBlock: z.object({
    code: z.string(),
    filename: z.string().optional(),
    language: z.string().optional(),
  }),
  ImageCard: z.object({
    alt: z.string().optional(),
    caption: z.string().optional(),
    url: z.string(),
  }),
  LineChart: z.object({
    color: z.string().optional(),
    data: z.array(z.object({ label: z.string(), value: z.number() })),
    title: z.string().optional(),
  }),
  LinkPreview: z.object({
    description: z.string().optional(),
    domain: z.string(),
    title: z.string(),
    url: z.string(),
  }),
  Metric: z.object({
    detail: z.string().optional(),
    label: z.string(),
    trend: z.enum(["down", "neutral", "up"]).optional(),
    value: z.string(),
  }),
  Poll: z.object({
    options: z.array(z.string()),
    question: z.string(),
  }),
  RepoCard: z.object({
    description: z.string().optional(),
    language: z.string().optional(),
    owner: z.string(),
    repo: z.string(),
    stars: z.number().optional(),
    url: z.string(),
  }),
  Stack: z.object({
    children: z.array(z.string()),
    direction: z.enum(["horizontal", "vertical"]).optional(),
    gap: z.number().optional(),
  }),
  Table: z.object({
    caption: z.string().optional(),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  TextMessage: z.object({
    body: z.string(),
  }),
  Timeline: z.object({
    items: z.array(
      z.object({
        date: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["completed", "current", "upcoming"]).optional(),
        title: z.string(),
      }),
    ),
  }),
} satisfies Record<ComponentName, z.ZodObject<z.ZodRawShape>>;

export const systemPrompt = `You are a message classifier for a real-time chat application.

Classify the user's message by returning a JSON spec tree in { elements, root } format.
Each element has a type (from the catalog below) and props.
For a single component, use { "elements": { "root": { "type": "...", "props": {...} } }, "root": "root" }.
For composed output, use Stack as the root and reference child elements by key.
Return only valid JSON. Do not include any explanation or wrapping text.

Available component types and their required/optional props:

- TextMessage: { body: string } — plain text message (default fallback)
- LinkPreview: { url: string, title: string, domain: string, description?: string } — any URL that is not a GitHub repo
- RepoCard: { url: string, owner: string, repo: string, description?: string, language?: string, stars?: number } — github.com/<owner>/<repo> URLs
- CodeBlock: { code: string, language?: string, filename?: string } — fenced code blocks or code snippets
- Table: { headers: string[], rows: string[][], caption?: string } — tabular or CSV data
- Poll: { question: string, options: string[] } — question with clear answer options
- ImageCard: { url: string, alt?: string, caption?: string } — image URLs (.jpg, .jpeg, .png, .gif, .webp)
- Metric: { label: string, value: string, detail?: string, trend?: "up" | "down" | "neutral" } — a single KPI value
- BarChart: { data: { label: string, value: number }[], title?: string, color?: string } — bar chart for categorical data
- LineChart: { data: { label: string, value: number }[], title?: string, color?: string } — line chart for trends over time
- Callout: { type: "info" | "tip" | "warning", content: string, title?: string } — highlighted info/tip/warning block
- Timeline: { items: { title: string, description?: string, date?: string, status?: "completed" | "current" | "upcoming" }[] } — vertical list of steps or events
- Stack: { children: string[], direction?: "vertical" | "horizontal", gap?: number } — flex layout container for composing multiple components

Classification priority (highest first):
1. ImageCard — message is an image URL
2. RepoCard — message contains a github.com/<owner>/<repo> URL
3. CodeBlock — message contains a fenced code block or code snippet
4. Table — message contains tabular or CSV data
5. BarChart / LineChart — message contains numerical series data suitable for a chart
6. Poll — message is a question with answer options
7. Timeline — message describes a sequence of events or steps
8. Metric (via Stack) — message describes one or more KPI values
9. Callout — message is a warning, tip, or informational note
10. LinkPreview — message contains any other URL
11. TextMessage — everything else

Rules:
- Only use types listed above — no invented types
- Populate all required props; omit optional props if the information is not present
- Do not invent prop values — only use information present in the message
- Default to TextMessage if no other type clearly fits
- Use Stack to compose multiple components when the message contains naturally separable pieces of information`;
