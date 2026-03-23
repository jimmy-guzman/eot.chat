import type * as Party from "partykit/server";

import { Effect, Logger, Match, Schema } from "effect";
import { nanoid } from "nanoid";

import type { Message, Participant } from "./types";

import { ClientMessageSchema } from "./types";

export default class Server implements Party.Server {
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

          const message: Message = {
            authorDisplayName:
              this.participants.get(sender.id)?.displayName ?? "Unknown",
            id: nanoid(),
            rawInput: body,
            sentAt: new Date().toISOString(),
          };

          yield* Effect.logDebug("message: broadcast", { id: message.id });

          this.messages.push(message);
          this.room.broadcast(JSON.stringify({ message, type: "message" }));
        });
      }),
      Match.when({ type: "leave" }, () => {
        return Effect.promise(() => this.handleLeave(sender.id));
      }),
      Match.when({ type: "clear" }, () => {
        return Effect.gen(this, function* () {
          const participant = this.participants.get(sender.id);

          if (!participant) {
            return;
          }

          this.messages.length = 0;
          this.room.broadcast(
            JSON.stringify({
              displayName: participant.displayName,
              type: "cleared",
            }),
          );

          yield* Effect.logInfo("clear: messages cleared by participant", {
            displayName: participant.displayName,
            senderId: sender.id,
          });
        });
      }),
      Match.when({ type: "typing" }, () => {
        return Effect.gen(this, function* () {
          const participant = this.participants.get(sender.id);

          if (!participant) {
            return;
          }

          yield* Effect.logDebug("typing: broadcast", {
            displayName: participant.displayName,
          });

          this.room.broadcast(
            JSON.stringify({
              displayName: participant.displayName,
              type: "typing",
            }),
            [sender.id],
          );
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

    await Effect.runPromise(
      Effect.logInfo("leave: participant left", {
        displayName: participant.displayName,
        participantCount: this.participants.size,
        roomDissolved: this.participants.size === 0,
      }).pipe(Effect.provide(Logger.json)),
    );

    this.messages.length = 0;
    this.room.broadcast(
      JSON.stringify({ displayName: participant.displayName, type: "cleared" }),
    );

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
