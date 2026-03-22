import { z } from "zod";

export const componentNames = [
  "CodeBlock",
  "ImageCard",
  "LinkPreview",
  "Poll",
  "RepoCard",
  "Table",
  "TextMessage",
] as const;

export type ComponentName = (typeof componentNames)[number];

export const schemas = {
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
  LinkPreview: z.object({
    description: z.string().optional(),
    domain: z.string(),
    title: z.string(),
    url: z.string(),
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
  Table: z.object({
    caption: z.string().optional(),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  TextMessage: z.object({
    body: z.string(),
  }),
} satisfies Record<ComponentName, z.ZodObject<z.ZodRawShape>>;

export const systemPrompt = `You are a message classifier for a real-time chat application.

Given a chat message, return a single JSON object with "type" and "props" fields.

Available component types and their required/optional props:

- TextMessage: { body: string } — plain text message (default fallback)
- LinkPreview: { url: string, title: string, domain: string, description?: string } — any URL that is not a GitHub repo
- RepoCard: { url: string, owner: string, repo: string, description?: string, language?: string, stars?: number } — github.com/<owner>/<repo> URLs
- CodeBlock: { code: string, language?: string, filename?: string } — fenced code blocks or code snippets
- Table: { headers: string[], rows: string[][], caption?: string } — tabular or CSV data
- Poll: { question: string, options: string[] } — question with clear answer options
- ImageCard: { url: string, alt?: string, caption?: string } — image URLs (.jpg, .jpeg, .png, .gif, .webp)

Classification priority (highest first):
1. ImageCard — message is an image URL
2. RepoCard — message contains a github.com/<owner>/<repo> URL
3. CodeBlock — message contains a fenced code block or code snippet
4. Table — message contains tabular or CSV data
5. Poll — message is a question with answer options
6. LinkPreview — message contains any other URL
7. TextMessage — everything else

Rules:
- Return exactly one { type, props } object — no nesting, no children
- Only use types listed above — no invented types
- Populate all required props; omit optional props if the information is not present
- Do not invent prop values — only use information present in the message
- Default to TextMessage if no other type clearly fits

Return only the JSON object, no explanation.`;
