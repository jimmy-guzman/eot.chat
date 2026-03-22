import type * as Party from "partykit/server";

import { Effect, Logger, Match, Schema } from "effect";
import { nanoid } from "nanoid";

import type { Message, Participant } from "./types";

import { classify } from "./classify";
import { TokenBucket } from "./token-bucket";
import { ClientMessageSchema } from "./types";

const SYSTEM_PROMPT = `You are a message classifier for a chat application.
Classify the user's message by returning a JSON spec tree in { elements, root } format.
Each element has a type (from the catalog below) and props.
For a single component, use { "elements": { "root": { "type": "...", "props": {...} } }, "root": "root" }.
For composed output, use Stack as the root and reference child elements by key.
Return only valid JSON. Do not include any explanation or wrapping text.

Components:
- TextMessage: plain text. Props: { body: string }
- LinkPreview: a URL (non-GitHub). Props: { url: string, title: string, domain: string, description?: string }
- RepoCard: a github.com/<owner>/<repo> URL. Props: { url: string, owner: string, repo: string, description?: string, language?: string, stars?: number }
- CodeBlock: code snippet or fenced block. Props: { code: string, language?: string, filename?: string }
- Table: tabular/CSV data. Props: { headers: string[], rows: string[][], caption?: string }
- Poll: question with answer options. Props: { question: string, options: string[] }
- ImageCard: image URL (.jpg/.jpeg/.png/.gif/.webp). Props: { url: string, alt?: string, caption?: string }
- Metric: a single KPI. Props: { label: string, value: string, detail?: string, trend?: "up" | "down" | "neutral" }
- BarChart: bar chart for categorical data. Props: { data: { label: string, value: number }[], title?: string, color?: string }
- LineChart: line chart for trends. Props: { data: { label: string, value: number }[], title?: string, color?: string }
- Callout: highlighted info/tip/warning block. Props: { type: "info" | "tip" | "warning", content: string, title?: string }
- Timeline: vertical list of steps/events. Props: { items: { title: string, description?: string, date?: string, status?: "completed" | "current" | "upcoming" }[] }
- Stack: flex layout container for composing multiple components. Props: { children: string[], direction?: "vertical" | "horizontal", gap?: number }

Priority (highest first): ImageCard > RepoCard > CodeBlock > Table > BarChart/LineChart > Poll > Timeline > Metric (via Stack) > Callout > LinkPreview > TextMessage
Default to TextMessage if nothing else fits.`;

export default class Server implements Party.Server {
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly messages: Message[] = [];
  private readonly participants = new Map<string, Participant>();

  constructor(readonly room: Party.Room) {}

  async onClose(conn: Party.Connection) {
    await this.handleLeave(conn.id);
  }

  async onConnect(conn: Party.Connection) {
    const name = await this.room.storage.get<string>("name");

    if (!name) {
      conn.send(JSON.stringify({ reason: "room not found", type: "error" }));
      conn.close();

      return;
    }

    await Effect.runPromise(
      Effect.logDebug("onConnect: init sent", {
        connId: conn.id,
        messageCount: this.messages.length,
        participantCount: this.participants.size,
      }).pipe(Effect.provide(Logger.json)),
    );

    conn.send(
      JSON.stringify({
        messages: this.messages,
        participants: [...this.participants.values()],
        type: "init",
      }),
    );
  }

  async onMessage(raw: string, sender: Party.Connection) {
    const parsed: unknown = (() => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return null;
      }
    })();

    const decodeResult =
      Schema.decodeUnknownEither(ClientMessageSchema)(parsed);

    if (decodeResult._tag === "Left") {
      return;
    }

    const msg = decodeResult.right;

    const program = Match.value(msg).pipe(
      Match.when({ type: "join" }, ({ displayName }) => {
        return Effect.gen(this, function* () {
          const isDuplicate = [...this.participants.values()].some(
            (p) => p.displayName === displayName,
          );

          if (isDuplicate) {
            yield* Effect.logWarning("join: duplicate displayName rejected", {
              displayName,
            });

            return;
          }

          const participant: Participant = {
            displayName,
            joinedAt: new Date().toISOString(),
          };

          this.participants.set(sender.id, participant);

          yield* Effect.logInfo("join: participant joined", {
            displayName,
            participantCount: this.participants.size,
          });

          this.room.broadcast(
            JSON.stringify({
              participant,
              participants: [...this.participants.values()],
              type: "joined",
            }),
            [sender.id],
          );

          sender.send(
            JSON.stringify({
              messages: this.messages,
              participants: [...this.participants.values()],
              type: "init",
            }),
          );
        });
      }),
      Match.when({ type: "message" }, ({ body }) => {
        return Effect.gen(this, function* () {
          if (!body.trim()) {
            return;
          }

          const apiKey = this.room.env.OPENROUTER_API_KEY as string | undefined;

          if (!apiKey) {
            yield* Effect.logWarning(
              "message: OPENROUTER_API_KEY not set — skipping classification",
            );
          }

          let bucket = this.buckets.get(sender.id);

          if (!bucket) {
            bucket = new TokenBucket(3, 3000);
            this.buckets.set(sender.id, bucket);
          }

          const tokenConsumed = bucket.consume();

          if (!tokenConsumed) {
            yield* Effect.logWarning("message: rate limited", {
              senderId: sender.id,
            });
          }

          const canClassify = tokenConsumed && apiKey;

          const component = canClassify
            ? yield* classify(body, apiKey, SYSTEM_PROMPT)
            : {
                elements: { root: { props: { body }, type: "TextMessage" } },
                root: "root",
              };

          const message: Message = {
            authorDisplayName:
              this.participants.get(sender.id)?.displayName ?? "Unknown",
            component,
            id: nanoid(),
            rawInput: body,
            sentAt: new Date().toISOString(),
          };

          yield* Effect.logDebug("message: broadcast", {
            id: message.id,
            type: component.elements[component.root].type,
          });

          this.messages.push(message);
          this.room.broadcast(JSON.stringify({ message, type: "message" }));
        });
      }),
      Match.when({ type: "leave" }, () => {
        return Effect.promise(() => this.handleLeave(sender.id));
      }),
      Match.when({ type: "clear" }, () => {
        return Effect.gen(this, function* () {
          this.messages.length = 0;
          this.room.broadcast(JSON.stringify({ type: "cleared" }));

          yield* Effect.logInfo("clear: messages cleared by participant", {
            senderId: sender.id,
          });
        });
      }),
      Match.exhaustive,
    );

    await Effect.runPromise(
      program.pipe(
        Effect.catchAll(() => Effect.void),
        Effect.provide(Logger.json),
      ),
    );
  }

  async onRequest(req: Party.Request) {
    const corsHeaders = {
      "Access-Control-Allow-Headers": "Content-Type, X-Action",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    if (req.method === "GET") {
      const name = await this.room.storage.get<string>("name");

      if (!name) {
        return new Response("Not Found", { headers: corsHeaders, status: 404 });
      }

      return Response.json(
        { id: this.room.id, name },
        { headers: corsHeaders },
      );
    }

    const action = req.headers.get("X-Action");

    if (req.method !== "POST" || action !== "create") {
      return new Response("Method Not Allowed", {
        headers: corsHeaders,
        status: 405,
      });
    }

    const existing = await this.room.storage.get<string>("name");

    if (existing) {
      return new Response("Conflict", { headers: corsHeaders, status: 409 });
    }

    const rawBody: unknown = await req.json();
    const name =
      typeof rawBody === "object" && rawBody !== null && "name" in rawBody
        ? (rawBody as { name: unknown }).name
        : undefined;

    if (typeof name !== "string" || !name.trim()) {
      return new Response("Bad Request", {
        headers: corsHeaders,
        status: 400,
      });
    }

    await this.room.storage.put("name", name);

    return Response.json({ id: this.room.id, name }, { headers: corsHeaders });
  }

  private async handleLeave(connId: string) {
    const participant = this.participants.get(connId);

    if (!participant) {
      return;
    }

    this.participants.delete(connId);
    this.buckets.delete(connId);

    await Effect.runPromise(
      Effect.logInfo("leave: participant left", {
        displayName: participant.displayName,
        participantCount: this.participants.size,
        roomDissolved: this.participants.size === 0,
      }).pipe(Effect.provide(Logger.json)),
    );

    this.messages.length = 0;
    this.room.broadcast(JSON.stringify({ type: "cleared" }));

    this.room.broadcast(
      JSON.stringify({
        displayName: participant.displayName,
        participants: [...this.participants.values()],
        type: "left",
      }),
    );

    if (this.participants.size === 0) {
      await this.room.storage.delete("name");
    }
  }
}

Server satisfies Party.Worker;
