import type * as Party from "partykit/server";

import { Effect, Logger, Match, Schema } from "effect";
import { nanoid } from "nanoid";

import type { Message, Participant } from "./types";

import { JOIN_REGISTRY_ROOM_ID } from "./constants";
import { verifyRoomSessionToken } from "./room-token";
import {
  ClientMessageSchema,
  CreateRoomBodySchema,
  RegisterBodySchema,
  ResolveBodySchema,
  ROOM_EXPIRY_MS,
  RotateJoinCodeBodySchema,
  UnregisterBodySchema,
} from "./types";

const JOIN_CODE_STORAGE_PREFIX = "jc:";

interface ConnectionState {
  displayName: string;
  sessionId: string;
}

export default class Server implements Party.Server {
  private readonly messages: Message[] = [];
  private readonly participants = new Map<string, Participant>();
  private readonly registryHits = new Map<string, number[]>();

  constructor(readonly room: Party.Room) {}

  async onAlarm() {
    await this.room.storage.deleteAll();
  }

  async onClose(conn: Party.Connection) {
    await this.handleDisconnect(conn.id);
  }

  async onConnect(conn: Party.Connection) {
    if (this.room.id === JOIN_REGISTRY_ROOM_ID) {
      conn.send(JSON.stringify({ reason: "registry room", type: "error" }));
      conn.close();

      return;
    }

    const name = await this.room.storage.get<string>("name");

    if (!name) {
      conn.send(JSON.stringify({ reason: "room not found", type: "error" }));
      conn.close();

      return;
    }

    await this.room.storage.deleteAlarm();

    await Effect.runPromise(
      Effect.logDebug("onConnect: ready", {
        connId: conn.id,
        messageCount: this.messages.length,
        participantCount: this.participants.size,
      }).pipe(Effect.provide(Logger.json)),
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
      Match.when({ type: "join" }, (joinMsg) => {
        return Effect.gen(this, function* () {
          const { displayName, sessionId, sessionToken } = joinMsg;
          const secret = this.room.env.ROOM_CRYPTO_SECRET as string | undefined;

          if (!secret) {
            yield* Effect.logWarning("join: ROOM_CRYPTO_SECRET missing");
            sender.send(
              JSON.stringify({ reason: "server misconfigured", type: "error" }),
            );

            return;
          }

          const verified = yield* Effect.promise(() => {
            return verifyRoomSessionToken(sessionToken, secret);
          });

          if (verified?.roomId !== this.room.id) {
            yield* Effect.logInfo("join: invalid session token", {
              roomId: this.room.id,
            });
            sender.send(
              JSON.stringify({ reason: "unauthorized", type: "error" }),
            );

            return;
          }

          const existing = [...this.participants.entries()].find(
            ([, p]) => p.displayName === displayName,
          );

          if (existing) {
            const [existingConnId, existingParticipant] = existing;

            if (existingParticipant.sessionId === sessionId) {
              yield* Effect.logInfo("join: evicting previous tab", {
                displayName,
                existingConnId,
                sessionId,
              });
              const existingConn = this.room.getConnection(existingConnId);

              existingConn?.close(4000, "replaced");
              this.participants.delete(existingConnId);
            } else {
              yield* Effect.logWarning("join: duplicate displayName rejected", {
                displayName,
              });
              sender.send(
                JSON.stringify({ reason: "display name taken", type: "error" }),
              );

              return;
            }
          }

          const participant: Participant = {
            displayName,
            joinedAt: new Date().toISOString(),
            sessionId,
          };

          this.participants.set(sender.id, participant);
          sender.setState({ displayName, sessionId });

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
        const displayName = this.resolveDisplayName(sender);

        return Effect.gen(this, function* () {
          if (!body.trim() || !displayName) {
            return;
          }

          const message: Message = {
            authorDisplayName: displayName,
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
        return Effect.promise(() => this.handleLeave(sender.id, true));
      }),
      Match.when({ type: "clear" }, () => {
        const displayName = this.resolveDisplayName(sender);

        return Effect.gen(this, function* () {
          if (!displayName) {
            return;
          }

          this.messages.length = 0;
          this.room.broadcast(
            JSON.stringify({
              displayName,
              type: "cleared",
            }),
          );

          yield* Effect.logInfo("clear: messages cleared by participant", {
            displayName,
            senderId: sender.id,
          });
        });
      }),
      Match.when({ type: "typing" }, () => {
        const displayName = this.resolveDisplayName(sender);

        return Effect.gen(this, function* () {
          if (!displayName) {
            return;
          }

          yield* Effect.logDebug("typing: broadcast", {
            displayName,
          });

          this.room.broadcast(
            JSON.stringify({
              displayName,
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

    if (this.room.id === JOIN_REGISTRY_ROOM_ID) {
      return this.handleRegistryRequest(req, corsHeaders);
    }

    if (req.method === "GET") {
      const name = await this.room.storage.get<string>("name");

      if (!name) {
        return new Response("Not Found", { headers: corsHeaders, status: 404 });
      }

      const joinCode = await this.room.storage.get<string>("joinCode");
      const joinCodeVersion =
        (await this.room.storage.get<number>("joinCodeVersion")) ?? 1;

      return Response.json(
        {
          id: this.room.id,
          joinCode: joinCode ?? this.room.id,
          joinCodeVersion,
          name,
        },
        { headers: corsHeaders },
      );
    }

    const action = req.headers.get("X-Action");

    if (req.method !== "POST" || !action) {
      return new Response("Method Not Allowed", {
        headers: corsHeaders,
        status: 405,
      });
    }

    if (action === "create") {
      return this.handleCreateRoom(req, corsHeaders);
    }

    if (action === "rotate-join-code") {
      return this.handleRotateJoinCode(req, corsHeaders);
    }

    return new Response("Method Not Allowed", {
      headers: corsHeaders,
      status: 405,
    });
  }

  private checkRegistryRateLimit(clientKey: string): boolean {
    const now = Date.now();
    const windowMs = 60_000;
    const max = 60;
    const arr = (this.registryHits.get(clientKey) ?? []).filter(
      (t) => now - t < windowMs,
    );

    if (arr.length >= max) {
      return false;
    }

    arr.push(now);
    this.registryHits.set(clientKey, arr);

    return true;
  }

  private async handleCreateRoom(
    req: Party.Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    const existing = await this.room.storage.get<string>("name");

    if (existing) {
      return new Response("Conflict", { headers: corsHeaders, status: 409 });
    }

    const decoded = Schema.decodeUnknownEither(CreateRoomBodySchema)(
      await req.json(),
    );

    if (decoded._tag === "Left") {
      return new Response("Bad Request", { headers: corsHeaders, status: 400 });
    }

    const { hostSecret, name } = decoded.right;
    const joinCode = decoded.right.joinCode.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName || !joinCode || !hostSecret.trim()) {
      return new Response("Bad Request", { headers: corsHeaders, status: 400 });
    }

    await this.room.storage.put("name", trimmedName);
    await this.room.storage.put("joinCode", joinCode);
    await this.room.storage.put("joinCodeVersion", 1);
    await this.room.storage.put("hostSecret", hostSecret.trim());

    return Response.json(
      {
        id: this.room.id,
        joinCode,
        joinCodeVersion: 1,
        name: trimmedName,
      },
      { headers: corsHeaders },
    );
  }

  private async handleDisconnect(connId: string) {
    await this.handleLeave(connId, false);
  }

  private async handleLeave(connId: string, clearMessages: boolean) {
    const participant = this.participants.get(connId);

    if (!participant) {
      return;
    }

    this.participants.delete(connId);

    await Effect.runPromise(
      Effect.logInfo("leave: participant left", {
        clearMessages,
        displayName: participant.displayName,
        expiryScheduled: this.participants.size === 0,
        participantCount: this.participants.size,
      }).pipe(Effect.provide(Logger.json)),
    );

    if (clearMessages) {
      this.messages.length = 0;
      this.room.broadcast(
        JSON.stringify({
          displayName: participant.displayName,
          type: "cleared",
        }),
      );
    }

    this.room.broadcast(
      JSON.stringify({
        displayName: participant.displayName,
        participants: [...this.participants.values()],
        type: "left",
      }),
    );

    if (this.participants.size === 0) {
      await this.room.storage.setAlarm(Date.now() + ROOM_EXPIRY_MS);
    }
  }

  private async handleRegistryRequest(
    req: Party.Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        headers: corsHeaders,
        status: 405,
      });
    }

    const action = req.headers.get("X-Action");

    if (!action) {
      return new Response("Method Not Allowed", {
        headers: corsHeaders,
        status: 405,
      });
    }

    const clientKey =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for") ??
      "unknown";

    const rawBody: unknown = await req.json();
    const badRequest = new Response("Bad Request", {
      headers: corsHeaders,
      status: 400,
    });

    if (action === "register") {
      const decoded = Schema.decodeUnknownEither(RegisterBodySchema)(rawBody);

      if (decoded._tag === "Left") return badRequest;

      const joinCode = decoded.right.joinCode.trim().toLowerCase();
      const roomId = decoded.right.roomId.trim();

      if (!joinCode || !roomId) return badRequest;

      const key = `${JOIN_CODE_STORAGE_PREFIX}${joinCode}`;
      const existing = await this.room.storage.get<string>(key);

      if (existing && existing !== roomId) {
        return new Response("Conflict", { headers: corsHeaders, status: 409 });
      }

      await this.room.storage.put(key, roomId);

      await Effect.runPromise(
        Effect.logInfo("registry: join code registered", {
          joinCode,
          roomId,
        }).pipe(Effect.provide(Logger.json)),
      );

      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (action === "unregister") {
      const decoded = Schema.decodeUnknownEither(UnregisterBodySchema)(rawBody);

      if (decoded._tag === "Left") return badRequest;

      const joinCode = decoded.right.joinCode.trim().toLowerCase();

      if (!joinCode) return badRequest;

      await this.room.storage.delete(`${JOIN_CODE_STORAGE_PREFIX}${joinCode}`);

      await Effect.runPromise(
        Effect.logInfo("registry: join code unregistered", { joinCode }).pipe(
          Effect.provide(Logger.json),
        ),
      );

      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (action === "resolve") {
      if (!this.checkRegistryRateLimit(clientKey)) {
        return new Response("Too Many Requests", {
          headers: corsHeaders,
          status: 429,
        });
      }

      const decoded = Schema.decodeUnknownEither(ResolveBodySchema)(rawBody);

      if (decoded._tag === "Left") return badRequest;

      const joinCode = decoded.right.joinCode.trim().toLowerCase();

      if (!joinCode) return badRequest;

      const roomId = await this.room.storage.get<string>(
        `${JOIN_CODE_STORAGE_PREFIX}${joinCode}`,
      );

      await Effect.runPromise(
        Effect.logDebug("registry: resolve join code", {
          found: Boolean(roomId),
          joinCode,
        }).pipe(Effect.provide(Logger.json)),
      );

      if (!roomId) {
        return new Response("Not Found", { headers: corsHeaders, status: 404 });
      }

      return Response.json({ roomId }, { headers: corsHeaders });
    }

    return new Response("Method Not Allowed", {
      headers: corsHeaders,
      status: 405,
    });
  }

  private async handleRotateJoinCode(
    req: Party.Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    const decoded = Schema.decodeUnknownEither(RotateJoinCodeBodySchema)(
      await req.json(),
    );

    if (decoded._tag === "Left") {
      return new Response("Bad Request", { headers: corsHeaders, status: 400 });
    }

    const newJoinCode = decoded.right.newJoinCode.trim().toLowerCase();
    const hostSecret = decoded.right.hostSecret.trim();

    if (!newJoinCode || !hostSecret) {
      return new Response("Bad Request", { headers: corsHeaders, status: 400 });
    }

    const storedSecret = await this.room.storage.get<string>("hostSecret");

    if (!storedSecret || storedSecret !== hostSecret) {
      return new Response("Forbidden", { headers: corsHeaders, status: 403 });
    }

    const oldJoinCode = await this.room.storage.get<string>("joinCode");

    if (!oldJoinCode) {
      return new Response("Bad Request", {
        headers: corsHeaders,
        status: 400,
      });
    }

    const nextVersion =
      (await this.room.storage.get<number>("joinCodeVersion")) ?? 1;

    await this.room.storage.put("joinCode", newJoinCode);
    await this.room.storage.put("joinCodeVersion", nextVersion + 1);

    await Effect.runPromise(
      Effect.logInfo("room: join code rotated", {
        roomId: this.room.id,
      }).pipe(Effect.provide(Logger.json)),
    );

    return Response.json(
      {
        joinCode: newJoinCode,
        joinCodeVersion: nextVersion + 1,
        previousJoinCode: oldJoinCode,
      },
      { headers: corsHeaders },
    );
  }

  private resolveDisplayName(conn: Party.Connection): null | string {
    const fromParticipants = this.participants.get(conn.id)?.displayName;

    if (fromParticipants) return fromParticipants;

    const state = conn.state as ConnectionState | null;

    return state?.displayName ?? null;
  }
}

Server satisfies Party.Worker;
