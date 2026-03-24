"use server";

import { Effect, Schedule } from "effect";
import { customAlphabet, nanoid } from "nanoid";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/env";
import { setRoomSessionCookies } from "@/lib/cookies";
import { generateJoinCode } from "@/lib/join-code";
import { actionClient } from "@/lib/safe-action";
import { createRoomSchema } from "@/lib/schemas";
import { createPartyKitRoom, registerJoinCode } from "@/server/partykit-client";
import { mintRoomSessionToken } from "@/server/room-token";

const generateRoomId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 8);

const conflictRetry = Schedule.recurs(7).pipe(
  Schedule.whileInput((e: { _tag: string; status?: number }) => {
    return e._tag === "PartyKitError" && e.status === 409;
  }),
);

const createRoomWithCode = (
  id: string,
  roomName: string,
  hostSecret: string,
) => {
  return Effect.gen(function* () {
    const joinCode = generateJoinCode();

    yield* createPartyKitRoom(id, { hostSecret, joinCode, name: roomName });
    yield* registerJoinCode({ joinCode, roomId: id }).pipe(
      Effect.retry(conflictRetry),
    );

    return joinCode;
  });
};

export const createRoom = actionClient
  .inputSchema(createRoomSchema)
  .action(async ({ parsedInput: { displayName, roomName } }) => {
    const id = generateRoomId();
    const hostSecret = nanoid(48);

    await Effect.runPromise(createRoomWithCode(id, roomName, hostSecret));

    const [cookieStore, sessionToken] = await Promise.all([
      cookies(),
      mintRoomSessionToken(id, env.ROOM_CRYPTO_SECRET),
    ]);

    setRoomSessionCookies(cookieStore, {
      displayName: displayName.trim(),
      hostSecret,
      roomId: id,
      sessionId: nanoid(16),
      sessionToken,
    });

    redirect(`/r/${id}`);
  });
